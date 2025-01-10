import { IGroupStore } from './groupStore'
import { Group } from './group'
import {
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
} from '@river-build/proto'
import { PlainMessage } from '@bufbuild/protobuf'
import { Crypto } from './crypto'

type InitializeGroupMessage = Omit<
    PlainMessage<MemberPayload_Mls_InitializeGroup>,
    'externalGroupSnapshot'
>
type ExternalJoinMessage = PlainMessage<MemberPayload_Mls_ExternalJoin>

/// Service handling group operations both for Group and External Group
export class GroupService {
    private groupCache: Map<string, Group> = new Map()
    private groupStore: IGroupStore

    private mlsCrypto: Crypto

    constructor(groupStore: IGroupStore, mlsCrypto: Crypto) {
        this.groupStore = groupStore
        this.mlsCrypto = mlsCrypto
    }

    public getGroup(streamId: string): Group | undefined {
        return this.groupCache.get(streamId)
    }

    public async loadGroup(streamId: string): Promise<void> {
        const dto = await this.groupStore.getGroup(streamId)

        if (dto === undefined) {
            throw new Error(`Group not found for ${streamId}`)
        }

        const { groupId, ...fields } = dto

        const mlsGroup = await this.mlsCrypto.loadGroup(groupId)

        const group = {
            ...fields,
            group: mlsGroup,
        }

        this.groupCache.set(streamId, group)
    }

    // TODO: Add recovery in case any of those failing
    public async saveGroup(group: Group): Promise<void> {
        this.groupCache.set(group.streamId, group)

        const { group: mlsGroup, ...fields } = group
        const groupId = mlsGroup.groupId
        const dto = { ...fields, groupId }

        await this.groupStore.setGroup(dto)
        await this.mlsCrypto.writeGroupToStorage(group.group)
    }

    public handleInitializeGroup(_message: InitializeGroupMessage) {
        throw new Error('Not implemented')
    }

    public handleExternalJoin(_message: ExternalJoinMessage) {
        throw new Error('Not implemented')
    }

    // Handle confirmed commit message and write to storage
    private async handleCommit(group: Group, commit: Uint8Array) {
        await this.mlsCrypto.processCommit(group.group, commit)
        await this.saveGroup(group)
    }

    public async initializeGroupMessage(streamId: string): Promise<InitializeGroupMessage> {
        if (this.groupCache.has(streamId)) {
            throw new Error(`Group already exists for ${streamId}`)
        }

        const group = await this.mlsCrypto.createGroup(streamId)
        await this.saveGroup(group)
        const signaturePublicKey = this.getSignaturePublicKey()

        // TODO: Add check for groupInfoWithExternalKey not being null
        return {
            groupInfoMessage: group.groupInfoWithExternalKey!,
            signaturePublicKey,
        }
    }

    public async externalJoinMessage(
        streamId: string,
        latestGroupInfo: Uint8Array,
    ): Promise<ExternalJoinMessage> {
        if (this.groupCache.has(streamId)) {
            throw new Error(`Group already exists for ${streamId}`)
        }
        const group = await this.mlsCrypto.externalJoin(streamId, latestGroupInfo)
        await this.saveGroup(group)
        const signaturePublicKey = this.getSignaturePublicKey()
        // TODO: Add checks for commit and groupinfoexternalkey not being null
        return {
            commit: group.commit!,
            groupInfoMessage: group.groupInfoWithExternalKey!,
            signaturePublicKey,
        }
    }

    private getSignaturePublicKey(): Uint8Array {
        throw new Error('Not implemented')
    }
}

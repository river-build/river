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

    private crypto: Crypto

    constructor(groupStore: IGroupStore, mlsCrypto: Crypto) {
        this.groupStore = groupStore
        this.crypto = mlsCrypto
    }

    public getGroup(streamId: string): Group | undefined {
        return this.groupCache.get(streamId)
    }

    public async loadGroup(streamId: string): Promise<void> {
        const dto = await this.groupStore.getGroup(streamId)

        // TODO: Should this throw an Error?
        if (dto === undefined) {
            throw new Error(`Group not found for ${streamId}`)
        }

        const { groupId, ...fields } = dto

        const mlsGroup = await this.crypto.loadGroup(groupId)

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
        await this.crypto.writeGroupToStorage(group.group)
    }

    // TODO: Should this be private or public?
    public async clearGroup(streamId: string): Promise<void> {
        this.groupCache.delete(streamId)
        await this.groupStore.clearGroup(streamId)
        // TODO: Clear group in GroupStateStore
    }

    public async handleInitializeGroup(group: Group, _message: InitializeGroupMessage) {
        const isGroupActive = group.status === 'GROUP_ACTIVE'
        if (isGroupActive) {
            // Report programmer error
            throw new Error('Group is already active')
        }

        const wasInitializeGroupOurOwn = false
        if (!wasInitializeGroupOurOwn) {
            await this.clearGroup(group.streamId)
            // TODO: Signal to the coordinator that we need to rejoin the group
        }

        const activeGroup = Group.activeGroup(group.streamId, group.group)
        await this.saveGroup(activeGroup)

        // TODO: Signal to coordinator that the group is now active
        // TODO: Signal to the coordinator that there is a new epoch secret

        throw new Error('Not finished')
    }

    public async handleExternalJoin(group: Group, message: ExternalJoinMessage) {
        const isGroupActive = group.status === 'GROUP_ACTIVE'
        if (isGroupActive) {
            await this.crypto.processCommit(group, message.commit)
            await this.saveGroup(group)
            // TODO: Signal to the coordinator that there is new epoch secret
            return
        }

        // TODO: How do I test this?
        // Check if group is in pending join
        // Check if keys match
        const wasExternalJoinOurOwn = false
        if (!wasExternalJoinOurOwn) {
            await this.clearGroup(group.streamId)
            // TODO: Signal to the coordinator that we need to rejoin the group
        }

        const activeGroup = Group.activeGroup(group.streamId, group.group)
        await this.saveGroup(activeGroup)

        // TODO: Signal to the coordinator that the group is now active
        // TODO: Signal to the coordinator that there is a new epoch secret

        throw new Error('Not finished')
    }

    public async initializeGroupMessage(streamId: string): Promise<InitializeGroupMessage> {
        if (this.groupCache.has(streamId)) {
            throw new Error(`Group already exists for ${streamId}`)
        }

        const group = await this.crypto.createGroup(streamId)
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
        exportedTree: Uint8Array,
    ): Promise<ExternalJoinMessage> {
        if (this.groupCache.has(streamId)) {
            throw new Error(`Group already exists for ${streamId}`)
        }
        const group = await this.crypto.externalJoin(streamId, latestGroupInfo, exportedTree)
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

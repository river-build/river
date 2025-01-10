import { IGroupStore } from './groupStore'
import { Group } from './group'
import {
    MemberPayload_MlsPayload_ExternalJoin,
    MemberPayload_MlsPayload_InitializeGroup,
} from '@river-build/proto'
import { PlainMessage } from '@bufbuild/protobuf'
import { MlsCrypto } from './index'

type InitializeGroupMessage = PlainMessage<MemberPayload_MlsPayload_InitializeGroup>
type ExternalJoinMessage = PlainMessage<MemberPayload_MlsPayload_ExternalJoin>

/// Service handling group operations both for Group and External Group
export class GroupService {
    private groupStore: IGroupStore
    private mlsCrypto: MlsCrypto
    cache: Map<string, Group> = new Map()

    constructor(groupStore: IGroupStore, mlsCrypto: MlsCrypto) {
        this.groupStore = groupStore
        this.mlsCrypto = mlsCrypto
    }

    public getGroup(streamId: string): Group | undefined {
        return this.cache.get(streamId)
    }

    public async loadGroup(streamId: string): Promise<void> {
        const dto = await this.groupStore.getGroup(streamId)

        if (dto === undefined) {
            throw new Error(`Group not found for ${streamId}`)
        }

        const mlsGroup = await this.mlsCrypto.loadGroup(dto.groupId)

        const group = {
            ...dto,
            group: mlsGroup,
        }

        this.cache.set(streamId, group)
    }

    // TODO: Add recovery in case any of those failing
    public async saveGroup(group: Group): Promise<void> {
        this.cache.set(group.streamId, group)
        await this.groupStore.setGroup(group)
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

    public async initializeGroupMessage(
        streamId: string,
        userAddress: Uint8Array,
        deviceKey: Uint8Array,
    ): Promise<InitializeGroupMessage> {
        if (this.cache.has(streamId)) {
            throw new Error(`Group already exists for ${streamId}`)
        }

        // TODO: Check if we have external group, meaning that someone else
        //  already created it

        const group = await this.mlsCrypto.createGroup(streamId)
        await this.saveGroup(group)
        return {
            userAddress,
            deviceKey,
            groupInfoWithExternalKey: group.groupInfoWithExternalKey!,
        }
    }

    public async externalJoinMessage(
        streamId: string,
        latestGroupInfo: Uint8Array,
        userAddress: Uint8Array,
        deviceKey: Uint8Array,
    ): Promise<ExternalJoinMessage> {
        // TODO: Check if we have external group, so we can get the public tree
        const { group: group, epoch } = await this.mlsCrypto.externalJoin(streamId, latestGroupInfo)
        await this.saveGroup(group)
        return {
            userAddress,
            deviceKey,
            commit: group.commit!,
            groupInfoWithExternalKey: group.groupInfoWithExternalKey!,
            epoch,
        }
    }
}

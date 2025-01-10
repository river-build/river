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

// Placeholder for a coordinator
export interface IGroupServiceCoordinator {
    joinOrCreateGroup(streamId: string): void
    groupActive(streamId: string): void
    newEpochSecret(streamId: string, epoch: bigint): void
}

/// Service handling group operations both for Group and External Group
export class GroupService {
    private groupCache: Map<string, Group> = new Map()
    private groupStore: IGroupStore

    private crypto: Crypto
    private coordinator: IGroupServiceCoordinator | undefined

    constructor(
        groupStore: IGroupStore,
        mlsCrypto: Crypto,
        coordinator?: IGroupServiceCoordinator,
    ) {
        this.groupStore = groupStore
        this.crypto = mlsCrypto
        this.coordinator = coordinator
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

    // TODO: Should this throw an Error?
    public async handleInitializeGroup(group: Group, _message: InitializeGroupMessage) {
        const isGroupActive = group.status === 'GROUP_ACTIVE'
        if (isGroupActive) {
            // Report programmer error
            throw new Error('Programmer error: Group is already active')
        }

        const wasInitializeGroupOurOwn =
            group.status === 'GROUP_PENDING_CREATE' &&
            group.groupInfoWithExternalKey !== undefined &&
            uint8ArrayEqual(_message.groupInfoMessage, group.groupInfoWithExternalKey) &&
            uint8ArrayEqual(_message.signaturePublicKey, this.getSignaturePublicKey())

        if (!wasInitializeGroupOurOwn) {
            await this.clearGroup(group.streamId)
            this.coordinator?.joinOrCreateGroup(group.streamId)
            return
        }

        const activeGroup = Group.activeGroup(group.streamId, group.group)
        await this.saveGroup(activeGroup)

        this.coordinator?.groupActive(group.streamId)
        const epoch = this.crypto.currentEpoch(group)
        this.coordinator?.newEpochSecret(group.streamId, epoch)
    }

    public async handleExternalJoin(group: Group, message: ExternalJoinMessage) {
        const isGroupActive = group.status === 'GROUP_ACTIVE'
        if (isGroupActive) {
            await this.crypto.processCommit(group, message.commit)
            await this.saveGroup(group)
            const epoch = this.crypto.currentEpoch(group)
            this.coordinator?.newEpochSecret(group.streamId, epoch)
            return
        }

        const wasExternalJoinOurOwn =
            group.status === 'GROUP_PENDING_JOIN' &&
            group.groupInfoWithExternalKey !== undefined &&
            uint8ArrayEqual(message.groupInfoMessage, group.groupInfoWithExternalKey) &&
            group.commit !== undefined &&
            uint8ArrayEqual(message.commit, group.commit) &&
            uint8ArrayEqual(message.signaturePublicKey, this.getSignaturePublicKey())

        if (!wasExternalJoinOurOwn) {
            await this.clearGroup(group.streamId)
            this.coordinator?.joinOrCreateGroup(group.streamId)
            return
        }

        const activeGroup = Group.activeGroup(group.streamId, group.group)
        await this.saveGroup(activeGroup)

        this.coordinator?.groupActive(group.streamId)
        const epoch = this.crypto.currentEpoch(group)
        this.coordinator?.newEpochSecret(group.streamId, epoch)
    }

    public async initializeGroupMessage(streamId: string): Promise<InitializeGroupMessage> {
        if (this.groupCache.has(streamId)) {
            throw new Error(`Group already exists for ${streamId}`)
        }

        const group = await this.crypto.createGroup(streamId)
        await this.saveGroup(group)

        const signaturePublicKey = this.getSignaturePublicKey()

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

function uint8ArrayEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a === b) {
        return true
    }
    if (a.length !== b.length) {
        return false
    }
    for (const [i, byte] of a.entries()) {
        if (byte !== b[i]) {
            return false
        }
    }
    return true
}

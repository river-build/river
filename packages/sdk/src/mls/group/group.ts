import { Group as MlsGroup } from '@river-build/mls-rs-wasm'

export type GroupStatus = 'GROUP_PENDING_CREATE' | 'GROUP_PENDING_JOIN' | 'GROUP_ACTIVE'

export class Group {
    public readonly streamId: string
    public readonly groupId: Uint8Array
    public status: GroupStatus
    public readonly group: MlsGroup
    public readonly groupInfoWithExternalKey?: Uint8Array
    public readonly commit?: Uint8Array

    private constructor(
        streamId: string,
        groupId: Uint8Array,
        group: MlsGroup,
        status: GroupStatus,
        groupInfoWithExternalKey?: Uint8Array,
        commit?: Uint8Array,
    ) {
        this.streamId = streamId
        this.groupId = groupId
        this.group = group
        this.groupInfoWithExternalKey = groupInfoWithExternalKey
        this.commit = commit
        this.status = status
    }

    /// Mark the group as active
    public markActive() {
        this.status = 'GROUP_ACTIVE'
    }

    /// Factory method for creating the group from scratch
    public static createGroup(
        streamId: string,
        group: MlsGroup,
        groupInfoWithExternalKey: Uint8Array,
    ): Group {
        const groupId = group.groupId
        return new Group(streamId, groupId, group, 'GROUP_PENDING_CREATE', groupInfoWithExternalKey)
    }

    /// Factory method for creating the group via external join
    public static externalJoin(
        streamId: string,
        group: MlsGroup,
        commit: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
    ): Group {
        const groupId = group.groupId
        return new Group(
            streamId,
            groupId,
            group,
            'GROUP_PENDING_JOIN',
            groupInfoWithExternalKey,
            commit,
        )
    }
}

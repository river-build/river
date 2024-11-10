import { Group as MlsGroup } from '@river-build/mls-rs-wasm'
import { MlsStore } from './mlsStore'

export type GroupStatus =
    | 'GROUP_MISSING'
    | 'GROUP_PENDING_CREATE'
    | 'GROUP_PENDING_JOIN'
    | 'GROUP_ACTIVE'

type GroupState =
    | {
          state: 'GROUP_PENDING_CREATE'
          group: MlsGroup
          groupInfoWithExternalKey: Uint8Array
      }
    | {
          state: 'GROUP_PENDING_JOIN'
          group: MlsGroup
          commit: Uint8Array
          groupInfoWithExternalKey: Uint8Array
      }
    | {
          state: 'GROUP_ACTIVE'
          group: MlsGroup
      }

export class GroupStore {
    private groups: Map<string, GroupState> = new Map()
    mlsStore: MlsStore
    constructor(mlsStore: MlsStore) {
        this.mlsStore = mlsStore
    }

    public hasGroup(streamId: string): boolean {
        return this.groups.has(streamId)
    }

    public getGroupStatus(streamId: string): GroupStatus {
        const group = this.groups.get(streamId)
        if (!group) {
            return 'GROUP_MISSING'
        }
        return group.state
    }

    public addGroupViaCreate(
        streamId: string,
        group: MlsGroup,
        groupInfoWithExternalKey: Uint8Array,
    ): void {
        if (this.groups.has(streamId)) {
            throw new Error('Group already exists')
        }

        const groupState: GroupState = {
            state: 'GROUP_PENDING_CREATE',
            group,
            groupInfoWithExternalKey,
        }

        this.groups.set(streamId, groupState)
    }

    public addGroupViaExternalJoin(
        streamId: string,
        group: MlsGroup,
        commit: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
    ): void {
        if (this.groups.has(streamId)) {
            throw new Error('Group already exists')
        }

        const groupState: GroupState = {
            state: 'GROUP_PENDING_JOIN',
            group,
            commit,
            groupInfoWithExternalKey,
        }
        this.groups.set(streamId, groupState)
    }

    public getGroup(streamId: string): GroupState | undefined {
        return this.groups.get(streamId)
    }

    public setGroupState(streamId: string, state: GroupState): void {
        this.groups.set(streamId, state)
    }

    public clear(streamId: string): void {
        this.groups.delete(streamId)
    }
}

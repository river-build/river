import { Group as MlsGroup } from '@river-build/mls-rs-wasm'

export type GroupState =
    | {
          status: 'GROUP_PENDING_CREATE'
          group: MlsGroup
          groupInfoWithExternalKey: Uint8Array
      }
    | {
          status: 'GROUP_PENDING_JOIN'
          group: MlsGroup
          commit: Uint8Array
          groupInfoWithExternalKey: Uint8Array
      }
    | {
          status: 'GROUP_ACTIVE'
          group: MlsGroup
      }

export class Group {
    public readonly streamId: string
    private _state: GroupState

    constructor(streamId: string, state: GroupState) {
        this.streamId = streamId
        this._state = state
    }

    get state(): GroupState {
        return this._state
    }

    public markActive() {
        if (this._state.status !== 'GROUP_ACTIVE') {
            this._state = {
                status: 'GROUP_ACTIVE',
                group: this._state.group,
            }
        }
    }

    static createGroup(
        streamId: string,
        group: MlsGroup,
        groupInfoWithExternalKey: Uint8Array,
    ): Group {
        const groupState: GroupState = {
            status: 'GROUP_PENDING_CREATE',
            group,
            groupInfoWithExternalKey,
        }
        return new Group(streamId, groupState)
    }

    static externalJoin(
        streamId: string,
        group: MlsGroup,
        commit: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
    ): Group {
        const groupState: GroupState = {
            status: 'GROUP_PENDING_JOIN',
            group,
            commit,
            groupInfoWithExternalKey,
        }
        return new Group(streamId, groupState)
    }
}

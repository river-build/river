import { MembershipOp } from '@river-build/proto'
import { LoadPriority, type Identifiable, type Store } from '../../../store/store'
import { check } from '@river-build/dlog'
import { isDefined } from '../../../check'
import { persistedObservable, PersistedObservable } from '../../../observable/persistedObservable'
import type { RiverConnection } from '../../river-connection/riverConnection'

// TODO: inviter, streamParentId
export interface MemberMembershipModel extends Identifiable {
    id: string
    streamId: string
    initialized: boolean
    op: MembershipOp
}

// The streamInitialized, streamNewUserInvited, streamNewUserJoined, streamUserLeft are not listened here.
// They are listened in the members model, which propagates the updates to the membership model.
@persistedObservable({ tableName: 'member_membership' })
export class MemberMembership extends PersistedObservable<MemberMembershipModel> {
    constructor(
        userId: string,
        streamId: string,
        private riverConnection: RiverConnection,
        store: Store,
    ) {
        super(
            {
                id: `${userId}_${streamId}`,
                streamId,
                initialized: false,
                op: MembershipOp.SO_UNSPECIFIED,
            },
            store,
            LoadPriority.high,
        )
    }

    public onStreamInitialized = (streamId: string) => {
        if (streamId === this.data.streamId) {
            const streamView = this.riverConnection.client?.stream(this.data.streamId)?.view
            check(isDefined(streamView), 'streamView is not defined')
            const op = streamView.getMembers().membership.info(this.data.id)
            this.setData({ initialized: true, op })
        }
    }

    public onStreamMembershipUpdated = (
        streamId: string,
        userId: string,
        op: MembershipOp.SO_JOIN | MembershipOp.SO_INVITE | MembershipOp.SO_LEAVE,
    ) => {
        if (streamId === this.data.streamId && userId === this.data.id) {
            this.setData({ op })
        }
    }
}

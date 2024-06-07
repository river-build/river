import TypedEmitter from 'typed-emitter';
import { MemberPayload_Membership, MembershipOp } from '@river-build/proto';
import { StreamStateEvents } from './streamEvents';
export declare class StreamStateView_Members_Membership {
    readonly streamId: string;
    readonly joinedUsers: Set<string>;
    readonly invitedUsers: Set<string>;
    readonly leftUsers: Set<string>;
    readonly pendingJoinedUsers: Set<string>;
    readonly pendingInvitedUsers: Set<string>;
    readonly pendingLeftUsers: Set<string>;
    readonly pendingMembershipEvents: Map<string, MemberPayload_Membership>;
    constructor(streamId: string);
    /**
     * If no userId is provided, checks current user
     */
    isMemberJoined(userId: string): boolean;
    /**
     * If no userId is provided, checks current user
     */
    isMember(membership: MembershipOp, userId: string): boolean;
    participants(): Set<string>;
    joinedParticipants(): Set<string>;
    joinedOrInvitedParticipants(): Set<string>;
    applyMembershipEvent(userId: string, op: MembershipOp, type: 'pending' | 'confirmed', stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    private emitMembershipChange;
}
//# sourceMappingURL=streamStateView_Members_Membership.d.ts.map
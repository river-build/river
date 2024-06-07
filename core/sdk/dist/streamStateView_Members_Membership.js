import { MembershipOp } from '@river-build/proto';
import { logNever } from './check';
export class StreamStateView_Members_Membership {
    streamId;
    joinedUsers = new Set();
    invitedUsers = new Set();
    leftUsers = new Set();
    pendingJoinedUsers = new Set();
    pendingInvitedUsers = new Set();
    pendingLeftUsers = new Set();
    pendingMembershipEvents = new Map();
    constructor(streamId) {
        this.streamId = streamId;
    }
    /**
     * If no userId is provided, checks current user
     */
    isMemberJoined(userId) {
        return this.joinedUsers.has(userId);
    }
    /**
     * If no userId is provided, checks current user
     */
    isMember(membership, userId) {
        switch (membership) {
            case MembershipOp.SO_INVITE:
                return this.invitedUsers.has(userId);
            case MembershipOp.SO_JOIN:
                return this.joinedUsers.has(userId);
            case MembershipOp.SO_LEAVE:
                return !this.invitedUsers.has(userId) && !this.joinedUsers.has(userId);
            case MembershipOp.SO_UNSPECIFIED:
                return false;
            default:
                logNever(membership);
                return false;
        }
    }
    participants() {
        return new Set([...this.joinedUsers, ...this.invitedUsers, ...this.leftUsers]);
    }
    joinedParticipants() {
        return this.joinedUsers;
    }
    joinedOrInvitedParticipants() {
        return new Set([...this.joinedUsers, ...this.invitedUsers]);
    }
    applyMembershipEvent(userId, op, type, stateEmitter) {
        switch (op) {
            case MembershipOp.SO_INVITE:
                if (type === 'confirmed') {
                    this.pendingInvitedUsers.delete(userId);
                    if (this.invitedUsers.add(userId)) {
                        stateEmitter?.emit('streamNewUserInvited', this.streamId, userId);
                        this.emitMembershipChange(userId, stateEmitter, this.streamId);
                    }
                }
                else {
                    if (this.pendingInvitedUsers.add(userId)) {
                        stateEmitter?.emit('streamPendingMembershipUpdated', this.streamId, userId);
                    }
                }
                break;
            case MembershipOp.SO_JOIN:
                if (type === 'confirmed') {
                    this.pendingJoinedUsers.delete(userId);
                    if (this.joinedUsers.add(userId)) {
                        stateEmitter?.emit('streamNewUserJoined', this.streamId, userId);
                        this.emitMembershipChange(userId, stateEmitter, this.streamId);
                    }
                }
                else {
                    if (this.pendingJoinedUsers.add(userId)) {
                        stateEmitter?.emit('streamPendingMembershipUpdated', this.streamId, userId);
                    }
                }
                break;
            case MembershipOp.SO_LEAVE:
                if (type === 'confirmed') {
                    const wasJoined = this.joinedUsers.delete(userId);
                    const wasInvited = this.invitedUsers.delete(userId);
                    this.pendingLeftUsers.delete(userId);
                    this.leftUsers.add(userId);
                    if (wasJoined || wasInvited) {
                        stateEmitter?.emit('streamUserLeft', this.streamId, userId);
                        this.emitMembershipChange(userId, stateEmitter, this.streamId);
                    }
                }
                else {
                    if (this.pendingLeftUsers.add(userId)) {
                        stateEmitter?.emit('streamPendingMembershipUpdated', this.streamId, userId);
                    }
                }
                break;
            case MembershipOp.SO_UNSPECIFIED:
                break;
            default:
                logNever(op);
        }
    }
    emitMembershipChange(userId, stateEmitter, streamId) {
        stateEmitter?.emit('streamMembershipUpdated', streamId, userId);
    }
}
//# sourceMappingURL=streamStateView_Members_Membership.js.map
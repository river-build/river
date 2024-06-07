import { MembershipOp, } from '@river-build/proto';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { check } from '@river-build/dlog';
import { logNever } from './check';
import { streamIdFromBytes } from './id';
export class StreamStateView_User extends StreamStateView_AbstractContent {
    streamId;
    streamMemberships = {};
    constructor(streamId) {
        super();
        this.streamId = streamId;
    }
    applySnapshot(snapshot, content, encryptionEmitter) {
        // initialize memberships
        for (const payload of content.memberships) {
            this.addUserPayload_userMembership(payload, encryptionEmitter);
        }
    }
    prependEvent(event, _cleartext, _encryptionEmitter, _stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'userPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'userMembership':
                // memberships are handled in the snapshot
                break;
            case 'userMembershipAction':
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    appendEvent(event, cleartext, _encryptionEmitter, stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'userPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'userMembership':
                this.addUserPayload_userMembership(payload.content.value, stateEmitter);
                break;
            case 'userMembershipAction':
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    addUserPayload_userMembership(payload, emitter) {
        const { op, streamId: inStreamId } = payload;
        const streamId = streamIdFromBytes(inStreamId);
        const wasInvited = this.streamMemberships[streamId]?.op === MembershipOp.SO_INVITE;
        const wasJoined = this.streamMemberships[streamId]?.op === MembershipOp.SO_JOIN;
        this.streamMemberships[streamId] = payload;
        switch (op) {
            case MembershipOp.SO_INVITE:
                emitter?.emit('userInvitedToStream', streamId);
                emitter?.emit('userStreamMembershipChanged', streamId);
                break;
            case MembershipOp.SO_JOIN:
                emitter?.emit('userJoinedStream', streamId);
                emitter?.emit('userStreamMembershipChanged', streamId);
                break;
            case MembershipOp.SO_LEAVE:
                if (wasInvited || wasJoined) {
                    emitter?.emit('userLeftStream', streamId);
                    emitter?.emit('userStreamMembershipChanged', streamId);
                }
                break;
            case MembershipOp.SO_UNSPECIFIED:
                break;
            default:
                logNever(op);
        }
    }
    getMembership(streamId) {
        return this.streamMemberships[streamId];
    }
    isMember(streamId, membership) {
        return this.getMembership(streamId)?.op === membership;
    }
    isJoined(streamId) {
        return this.isMember(streamId, MembershipOp.SO_JOIN);
    }
}
//# sourceMappingURL=streamStateView_User.js.map
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { check } from '@river-build/dlog';
import { logNever } from './check';
export class StreamStateView_UserInbox extends StreamStateView_AbstractContent {
    streamId;
    deviceSummary = {};
    pendingGroupSessions = {};
    constructor(streamId) {
        super();
        this.streamId = streamId;
    }
    applySnapshot(snapshot, content, _emitter) {
        Object.entries(content.deviceSummary).map(([deviceId, summary]) => {
            this.deviceSummary[deviceId] = summary;
        });
    }
    onConfirmedEvent(event, emitter) {
        super.onConfirmedEvent(event, emitter);
        const eventId = event.hashStr;
        const payload = this.pendingGroupSessions[eventId];
        if (payload) {
            delete this.pendingGroupSessions[eventId];
            this.addGroupSessions(payload.creatorUserId, payload.value, emitter);
        }
    }
    prependEvent(event, _cleartext, encryptionEmitter, _stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'userInboxPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'groupEncryptionSessions':
                this.addGroupSessions(event.creatorUserId, payload.content.value, encryptionEmitter);
                break;
            case 'ack':
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    appendEvent(event, _cleartext, _encryptionEmitter, _stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'userInboxPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'groupEncryptionSessions':
                this.pendingGroupSessions[event.hashStr] = {
                    creatorUserId: event.creatorUserId,
                    value: payload.content.value,
                };
                break;
            case 'ack':
                this.updateDeviceSummary(event.remoteEvent, payload.content.value);
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    hasPendingSessionId(deviceKey, sessionId) {
        for (const [_, payload] of Object.entries(this.pendingGroupSessions)) {
            if (payload.value.sessionIds.includes(sessionId) &&
                payload.value.ciphertexts[deviceKey]) {
                return true;
            }
        }
        return false;
    }
    addGroupSessions(creatorUserId, content, encryptionEmitter) {
        encryptionEmitter?.emit('newGroupSessions', content, creatorUserId);
    }
    updateDeviceSummary(event, content) {
        const summary = this.deviceSummary[content.deviceKey];
        if (summary) {
            if (summary.upperBound <= content.miniblockNum) {
                delete this.deviceSummary[content.deviceKey];
            }
            else {
                summary.lowerBound = content.miniblockNum + 1n;
            }
        }
    }
}
//# sourceMappingURL=streamStateView_UserInbox.js.map
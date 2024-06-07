import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { check } from '@river-build/dlog';
import { logNever } from './check';
import { userIdFromAddress } from './id';
export class StreamStateView_DMChannel extends StreamStateView_AbstractContent {
    streamId;
    firstPartyId;
    secondPartyId;
    lastEventCreatedAtEpochMs = 0n;
    constructor(streamId) {
        super();
        this.streamId = streamId;
    }
    applySnapshot(snapshot, content, _cleartexts, _encryptionEmitter) {
        if (content.inception) {
            this.firstPartyId = userIdFromAddress(content.inception.firstPartyAddress);
            this.secondPartyId = userIdFromAddress(content.inception.secondPartyAddress);
        }
    }
    appendEvent(event, cleartext, encryptionEmitter, stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'dmChannelPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                this.updateLastEvent(event.remoteEvent, stateEmitter);
                break;
            case 'message':
                this.decryptEvent('channelMessage', event, payload.content.value, cleartext, encryptionEmitter);
                this.updateLastEvent(event.remoteEvent, stateEmitter);
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    prependEvent(event, cleartext, encryptionEmitter, _stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'dmChannelPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                this.updateLastEvent(event.remoteEvent, undefined);
                break;
            case 'message':
                this.updateLastEvent(event.remoteEvent, undefined);
                this.decryptEvent('channelMessage', event, payload.content.value, cleartext, encryptionEmitter);
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    onDecryptedContent(_eventId, _content, _stateEmitter) {
        // pass
    }
    onConfirmedEvent(event, stateEmitter) {
        super.onConfirmedEvent(event, stateEmitter);
    }
    onAppendLocalEvent(event, stateEmitter) {
        this.lastEventCreatedAtEpochMs = event.createdAtEpochMs;
        stateEmitter?.emit('streamLatestTimestampUpdated', this.streamId);
    }
    updateLastEvent(event, stateEmitter) {
        const createdAtEpochMs = event.event.createdAtEpochMs;
        if (createdAtEpochMs > this.lastEventCreatedAtEpochMs) {
            this.lastEventCreatedAtEpochMs = createdAtEpochMs;
            stateEmitter?.emit('streamLatestTimestampUpdated', this.streamId);
        }
    }
    participants() {
        if (!this.firstPartyId || !this.secondPartyId) {
            return new Set();
        }
        return new Set([this.firstPartyId, this.secondPartyId]);
    }
}
//# sourceMappingURL=streamStateView_DMChannel.js.map
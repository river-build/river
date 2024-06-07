import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { StreamStateView_ChannelMetadata } from './streamStateView_ChannelMetadata';
import { check } from '@river-build/dlog';
import { logNever } from './check';
export class StreamStateView_GDMChannel extends StreamStateView_AbstractContent {
    streamId;
    channelMetadata;
    lastEventCreatedAtEpochMs = 0n;
    constructor(streamId) {
        super();
        this.channelMetadata = new StreamStateView_ChannelMetadata(streamId);
        this.streamId = streamId;
    }
    applySnapshot(snapshot, content, cleartexts, encryptionEmitter) {
        if (content.channelProperties) {
            this.channelMetadata.applySnapshot(content.channelProperties, cleartexts, encryptionEmitter);
        }
    }
    prependEvent(event, cleartext, encryptionEmitter, _stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'gdmChannelPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                this.updateLastEvent(event.remoteEvent, undefined);
                break;
            case 'message':
                this.updateLastEvent(event.remoteEvent, undefined);
                this.decryptEvent('channelMessage', event, payload.content.value, cleartext, encryptionEmitter);
                break;
            case 'channelProperties':
                // nothing to do, conveyed in the snapshot
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    appendEvent(event, cleartext, encryptionEmitter, stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'gdmChannelPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                this.updateLastEvent(event.remoteEvent, stateEmitter);
                break;
            case 'message':
                this.decryptEvent('channelMessage', event, payload.content.value, cleartext, encryptionEmitter);
                this.updateLastEvent(event.remoteEvent, stateEmitter);
                break;
            case 'channelProperties':
                this.channelMetadata.appendEvent(event, cleartext, encryptionEmitter);
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    onDecryptedContent(eventId, content, emitter) {
        if (content.kind === 'channelProperties') {
            this.channelMetadata.onDecryptedContent(eventId, content, emitter);
        }
    }
    onConfirmedEvent(event, emitter) {
        super.onConfirmedEvent(event, emitter);
    }
    onAppendLocalEvent(event, stateEmitter) {
        this.lastEventCreatedAtEpochMs = event.createdAtEpochMs;
        stateEmitter?.emit('streamLatestTimestampUpdated', this.streamId);
    }
    getChannelMetadata() {
        return this.channelMetadata;
    }
    updateLastEvent(event, stateEmitter) {
        const createdAtEpochMs = event.event.createdAtEpochMs;
        if (createdAtEpochMs > this.lastEventCreatedAtEpochMs) {
            this.lastEventCreatedAtEpochMs = createdAtEpochMs;
            stateEmitter?.emit('streamLatestTimestampUpdated', this.streamId);
        }
    }
}
//# sourceMappingURL=streamStateView_GDMChannel.js.map
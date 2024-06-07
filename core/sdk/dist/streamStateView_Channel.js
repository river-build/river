import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { check } from '@river-build/dlog';
import { logNever } from './check';
import { streamIdFromBytes } from './id';
export class StreamStateView_Channel extends StreamStateView_AbstractContent {
    streamId;
    spaceId = '';
    reachedRenderableContent = false;
    constructor(streamId) {
        super();
        this.streamId = streamId;
    }
    getStreamParentId() {
        return this.spaceId;
    }
    needsScrollback() {
        return !this.reachedRenderableContent;
    }
    applySnapshot(snapshot, content, _encryptionEmitter) {
        this.spaceId = streamIdFromBytes(content.inception?.spaceId ?? Uint8Array.from([]));
    }
    prependEvent(event, cleartext, encryptionEmitter, _stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'channelPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'message':
                this.reachedRenderableContent = true;
                this.decryptEvent('channelMessage', event, payload.content.value, cleartext, encryptionEmitter);
                break;
            case 'redaction':
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    appendEvent(event, cleartext, encryptionEmitter, _stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'channelPayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'message':
                this.reachedRenderableContent = true;
                this.decryptEvent('channelMessage', event, payload.content.value, cleartext, encryptionEmitter);
                break;
            case 'redaction':
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
}
//# sourceMappingURL=streamStateView_Channel.js.map
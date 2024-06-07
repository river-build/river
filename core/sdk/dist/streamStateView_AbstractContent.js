import { toDecryptedContent } from './encryptedContentTypes';
import { streamIdToBytes } from './id';
export class StreamStateView_AbstractContent {
    decryptEvent(kind, event, content, cleartext, encryptionEmitter) {
        if (cleartext) {
            event.decryptedContent = toDecryptedContent(kind, cleartext);
        }
        else {
            encryptionEmitter?.emit('newEncryptedContent', this.streamId, event.hashStr, {
                kind,
                content,
            });
        }
    }
    onConfirmedEvent(_event, _stateEmitter) {
        //
    }
    onDecryptedContent(_eventId, _content, _stateEmitter) {
        //
    }
    onAppendLocalEvent(_event, _stateEmitter) {
        //
    }
    getChannelMetadata() {
        return undefined;
    }
    getStreamParentId() {
        return undefined;
    }
    getStreamParentIdAsBytes() {
        const streamParentId = this.getStreamParentId();
        if (streamParentId === undefined) {
            return undefined;
        }
        return streamIdToBytes(streamParentId);
    }
    needsScrollback() {
        return false;
    }
}
//# sourceMappingURL=streamStateView_AbstractContent.js.map
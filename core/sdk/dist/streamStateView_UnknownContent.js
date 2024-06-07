import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
export class StreamStateView_UnknownContent extends StreamStateView_AbstractContent {
    streamId;
    constructor(streamId) {
        super();
        this.streamId = streamId;
    }
    prependEvent(_event, _cleartext, _encryptionEmitter, _stateEmitter) {
        throw new Error(`Unknown content type`);
    }
    appendEvent(_event, _cleartext, _emitter) {
        throw new Error(`Unknown content type`);
    }
}
//# sourceMappingURL=streamStateView_UnknownContent.js.map
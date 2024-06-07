import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { check } from '@river-build/dlog';
import { logNever } from './check';
import { streamIdFromBytes } from './id';
export class StreamStateView_Media extends StreamStateView_AbstractContent {
    streamId;
    info;
    constructor(streamId) {
        super();
        this.streamId = streamId;
    }
    applySnapshot(_snapshot, content, _emitter) {
        const inception = content.inception;
        if (!inception?.chunkCount || !inception.channelId || !inception.chunkCount) {
            throw new Error('invalid media snapshot');
        }
        this.info = {
            channelId: streamIdFromBytes(inception.channelId),
            chunkCount: inception.chunkCount,
            chunks: Array(inception.chunkCount),
        };
    }
    appendEvent(event, _cleartext, _encryptionEmitter, _stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'mediaPayload');
        if (!this.info) {
            return;
        }
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'chunk':
                if (payload.content.value.chunkIndex < 0 ||
                    payload.content.value.chunkIndex >= this.info.chunkCount) {
                    throw new Error(`chunkIndex out of bounds: ${payload.content.value.chunkIndex}`);
                }
                this.info.chunks[payload.content.value.chunkIndex] = payload.content.value.data;
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    prependEvent(event, cleartext, encryptionEmitter, stateEmitter) {
        // append / prepend are identical for media content
        this.appendEvent(event, cleartext, encryptionEmitter, stateEmitter);
    }
}
//# sourceMappingURL=streamStateView_Media.js.map
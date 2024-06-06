import { ChannelOp, Err, } from '@river-build/proto';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { check, throwWithCode } from '@river-build/dlog';
import { logNever } from './check';
import { isDefaultChannelId, streamIdAsString } from './id';
export class StreamStateView_Space extends StreamStateView_AbstractContent {
    streamId;
    spaceChannelsMetadata = new Map();
    constructor(streamId) {
        super();
        this.streamId = streamId;
    }
    applySnapshot(eventHash, snapshot, content, _cleartexts, _encryptionEmitter) {
        // loop over content.channels, update space channels metadata
        for (const payload of content.channels) {
            this.addSpacePayload_Channel(eventHash, payload, payload.updatedAtEventNum, undefined);
        }
    }
    onConfirmedEvent(_event, _emitter) {
        // pass
    }
    prependEvent(event, _cleartext, _encryptionEmitter, _stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'spacePayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'channel':
                // nothing to do, channel data was conveyed in the snapshot
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    appendEvent(event, cleartext, encryptionEmitter, stateEmitter) {
        check(event.remoteEvent.event.payload.case === 'spacePayload');
        const payload = event.remoteEvent.event.payload.value;
        switch (payload.content.case) {
            case 'inception':
                break;
            case 'channel':
                this.addSpacePayload_Channel(event.hashStr, payload.content.value, event.eventNum, stateEmitter);
                break;
            case undefined:
                break;
            default:
                logNever(payload.content);
        }
    }
    addSpacePayload_Channel(eventHash, payload, updatedAtEventNum, stateEmitter) {
        const { op, channelId: channelIdBytes } = payload;
        const channelId = streamIdAsString(channelIdBytes);
        switch (op) {
            case ChannelOp.CO_CREATED: {
                this.spaceChannelsMetadata.set(channelId, {
                    isDefault: isDefaultChannelId(channelId),
                    updatedAtEventNum,
                });
                stateEmitter?.emit('spaceChannelCreated', this.streamId, channelId);
                break;
            }
            case ChannelOp.CO_DELETED:
                if (this.spaceChannelsMetadata.delete(channelId)) {
                    stateEmitter?.emit('spaceChannelDeleted', this.streamId, channelId);
                }
                break;
            case ChannelOp.CO_UPDATED: {
                this.spaceChannelsMetadata.set(channelId, {
                    isDefault: isDefaultChannelId(channelId),
                    updatedAtEventNum,
                });
                stateEmitter?.emit('spaceChannelUpdated', this.streamId, channelId);
                break;
            }
            default:
                throwWithCode(`Unknown channel ${op}`, Err.STREAM_BAD_EVENT);
        }
    }
    onDecryptedContent(_eventId, _content, _stateEmitter) {
        // pass
    }
}
//# sourceMappingURL=streamStateView_Space.js.map
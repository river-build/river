import { bin_toHexString, dlog, check } from '@river-build/dlog';
import { toDecryptedContent } from './encryptedContentTypes';
export class StreamStateView_ChannelMetadata {
    log = dlog('csb:streams:channel_metadata');
    streamId;
    channelProperties;
    latestEncryptedChannelProperties;
    constructor(streamId) {
        this.streamId = streamId;
    }
    applySnapshot(encryptedChannelProperties, cleartexts, encryptionEmitter) {
        if (!encryptedChannelProperties.data) {
            return;
        }
        const eventId = bin_toHexString(encryptedChannelProperties.eventHash);
        this.latestEncryptedChannelProperties = {
            eventId: eventId,
            data: encryptedChannelProperties.data,
        };
        const cleartext = cleartexts?.[eventId];
        this.decryptPayload(encryptedChannelProperties.data, eventId, cleartext, encryptionEmitter);
    }
    decryptPayload(payload, eventId, cleartext, encryptionEmitter) {
        if (cleartext) {
            const decryptedContent = toDecryptedContent('channelProperties', cleartext);
            this.handleDecryptedContent(decryptedContent, encryptionEmitter);
        }
        else {
            encryptionEmitter?.emit('newEncryptedContent', this.streamId, eventId, {
                kind: 'channelProperties',
                content: payload,
            });
        }
    }
    handleDecryptedContent(content, emitter) {
        if (content.kind === 'channelProperties') {
            this.channelProperties = content.content;
            emitter?.emit('streamChannelPropertiesUpdated', this.streamId);
        }
        else {
            check(false);
        }
    }
    appendEvent(event, cleartext, emitter) {
        check(event.remoteEvent.event.payload.case === 'gdmChannelPayload');
        check(event.remoteEvent.event.payload.value.content.case === 'channelProperties');
        const payload = event.remoteEvent.event.payload.value.content.value;
        this.decryptPayload(payload, event.hashStr, cleartext, emitter);
    }
    prependEvent(_event, _cleartext, _emitter) {
        // conveyed in snapshot
    }
    onDecryptedContent(_eventId, content, stateEmitter) {
        this.handleDecryptedContent(content, stateEmitter);
    }
}
//# sourceMappingURL=streamStateView_ChannelMetadata.js.map
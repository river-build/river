import { ChannelMessage, ChannelProperties } from '@river-build/proto';
import { checkNever } from './check';
export function isEncryptedContentKind(kind) {
    return kind === 'text' || kind === 'channelMessage' || kind === 'channelProperties';
}
export function toDecryptedContent(kind, content) {
    switch (kind) {
        case 'text':
            return {
                kind,
                content,
            };
        case 'channelMessage':
            return {
                kind,
                content: ChannelMessage.fromJsonString(content),
            };
        case 'channelProperties':
            return {
                kind,
                content: ChannelProperties.fromJsonString(content),
            };
        default:
            // the client is responsible for this
            // we should never have a type we don't know about locally here
            checkNever(kind);
    }
}
//# sourceMappingURL=encryptedContentTypes.js.map
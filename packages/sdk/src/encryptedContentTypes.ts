import { ChannelMessage, ChannelProperties, EncryptedData } from '@river-build/proto'
import { checkNever } from './check'

/*************
 * EncryptedContent
 *************/
export interface EncryptedContent {
    kind: 'text' | 'channelMessage' | 'channelProperties'
    content: EncryptedData
}

export function isEncryptedContentKind(kind: string): kind is EncryptedContent['kind'] {
    return kind === 'text' || kind === 'channelMessage' || kind === 'channelProperties'
}

/*************
 * DecryptedContent
 *************/
export interface DecryptedContent_Text {
    kind: 'text'
    content: string
}

export interface DecryptedContent_ChannelMessage {
    kind: 'channelMessage'
    content: ChannelMessage
}

export interface DecryptedContent_ChannelProperties {
    kind: 'channelProperties'
    content: ChannelProperties
}

export interface DecryptedContent_UnsupportedContent {
    kind: 'unsupported'
    content: string | Uint8Array
}

export type DecryptedContent =
    | DecryptedContent_Text
    | DecryptedContent_ChannelMessage
    | DecryptedContent_ChannelProperties
    | DecryptedContent_UnsupportedContent

export function toDecryptedContent(
    kind: EncryptedContent['kind'],
    dataType: string | undefined,
    cleartext: Uint8Array,
): DecryptedContent {
    // v2 for encrypting messages, we keep a type field in the message,
    // everything should be bytes
    if (dataType && dataType.length > 0) {
        switch (dataType) {
            case 'textEncoder':
                return {
                    kind: 'text',
                    content: new TextDecoder().decode(cleartext),
                } satisfies DecryptedContent_Text
            case 'ChannelProperties':
                return {
                    kind: 'channelProperties',
                    content: ChannelProperties.fromBinary(cleartext),
                } satisfies DecryptedContent_ChannelProperties
            case 'ChannelMessage':
                return {
                    kind: 'channelMessage',
                    content: ChannelMessage.fromBinary(cleartext),
                } satisfies DecryptedContent_ChannelMessage
            default:
                return {
                    kind: 'unsupported',
                    content: cleartext,
                } satisfies DecryptedContent_UnsupportedContent
        }
    }

    // for v1 encoded messages, we need to decode the cleartext
    const cleartextString = new TextDecoder().decode(cleartext)

    // deprecated
    switch (kind) {
        case 'text':
            return {
                kind,
                content: cleartextString,
            } satisfies DecryptedContent_Text
        case 'channelMessage':
            return {
                kind,
                content: ChannelMessage.fromJsonString(cleartextString),
            } satisfies DecryptedContent_ChannelMessage

        case 'channelProperties':
            return {
                kind,
                content: ChannelProperties.fromJsonString(cleartextString),
            } satisfies DecryptedContent_ChannelProperties
        default:
            // the client is responsible for this
            // we should never have a type we don't know about locally here
            checkNever(kind)
    }
}

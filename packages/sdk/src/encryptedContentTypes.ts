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

// Type guard function based on field checks
export function isEncryptedData(obj: unknown): obj is EncryptedData {
    if (typeof obj !== 'object' || obj === null) {
        return false
    }

    const data = obj as EncryptedData
    return (
        typeof data.ciphertext === 'string' &&
        typeof data.algorithm === 'string' &&
        typeof data.senderKey === 'string' &&
        typeof data.sessionId === 'string' &&
        (typeof data.checksum === 'string' || data.checksum === undefined) &&
        (typeof data.refEventId === 'string' || data.refEventId === undefined)
    )
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

export type DecryptedContent =
    | DecryptedContent_Text
    | DecryptedContent_ChannelMessage
    | DecryptedContent_ChannelProperties

export function toDecryptedContent(
    kind: EncryptedContent['kind'],
    content: string,
): DecryptedContent {
    switch (kind) {
        case 'text':
            return {
                kind,
                content,
            } satisfies DecryptedContent_Text
        case 'channelMessage':
            return {
                kind,
                content: ChannelMessage.fromJsonString(content),
            } satisfies DecryptedContent_ChannelMessage

        case 'channelProperties':
            return {
                kind,
                content: ChannelProperties.fromJsonString(content),
            } satisfies DecryptedContent_ChannelProperties
        default:
            // the client is responsible for this
            // we should never have a type we don't know about locally here
            checkNever(kind)
    }
}

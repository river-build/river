import { ChannelMessage, ChannelProperties, EncryptedData } from '@river-build/proto';
/*************
 * EncryptedContent
 *************/
export interface EncryptedContent {
    kind: 'text' | 'channelMessage' | 'channelProperties';
    content: EncryptedData;
}
export declare function isEncryptedContentKind(kind: string): kind is EncryptedContent['kind'];
/*************
 * DecryptedContent
 *************/
export interface DecryptedContent_Text {
    kind: 'text';
    content: string;
}
export interface DecryptedContent_ChannelMessage {
    kind: 'channelMessage';
    content: ChannelMessage;
}
export interface DecryptedContent_ChannelProperties {
    kind: 'channelProperties';
    content: ChannelProperties;
}
export type DecryptedContent = DecryptedContent_Text | DecryptedContent_ChannelMessage | DecryptedContent_ChannelProperties;
export declare function toDecryptedContent(kind: EncryptedContent['kind'], content: string): DecryptedContent;
//# sourceMappingURL=encryptedContentTypes.d.ts.map
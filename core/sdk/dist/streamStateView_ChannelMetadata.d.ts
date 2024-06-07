import TypedEmitter from 'typed-emitter';
import { ChannelProperties, EncryptedData, WrappedEncryptedData } from '@river-build/proto';
import { DecryptedContent } from './encryptedContentTypes';
import { StreamEncryptionEvents, StreamEvents, StreamStateEvents } from './streamEvents';
import { RemoteTimelineEvent } from './types';
export declare class StreamStateView_ChannelMetadata {
    log: import("@river-build/dlog").DLogger;
    readonly streamId: string;
    channelProperties: ChannelProperties | undefined;
    latestEncryptedChannelProperties?: {
        eventId: string;
        data: EncryptedData;
    };
    constructor(streamId: string);
    applySnapshot(encryptedChannelProperties: WrappedEncryptedData, cleartexts: Record<string, string> | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    private decryptPayload;
    private handleDecryptedContent;
    appendEvent(event: RemoteTimelineEvent, cleartext: string | undefined, emitter: TypedEmitter<StreamEvents> | undefined): void;
    prependEvent(_event: RemoteTimelineEvent, _cleartext: string | undefined, _emitter: TypedEmitter<StreamEvents> | undefined): void;
    onDecryptedContent(_eventId: string, content: DecryptedContent, stateEmitter: TypedEmitter<StreamStateEvents>): void;
}
//# sourceMappingURL=streamStateView_ChannelMetadata.d.ts.map
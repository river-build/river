import TypedEmitter from 'typed-emitter';
import { EncryptedData } from '@river-build/proto';
import { ConfirmedTimelineEvent, RemoteTimelineEvent, StreamTimelineEvent } from './types';
import { DecryptedContent, EncryptedContent } from './encryptedContentTypes';
import { StreamStateView_ChannelMetadata } from './streamStateView_ChannelMetadata';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
export declare abstract class StreamStateView_AbstractContent {
    abstract readonly streamId: string;
    abstract prependEvent(event: RemoteTimelineEvent, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    abstract appendEvent(event: RemoteTimelineEvent, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    decryptEvent(kind: EncryptedContent['kind'], event: RemoteTimelineEvent, content: EncryptedData, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    onConfirmedEvent(_event: ConfirmedTimelineEvent, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onDecryptedContent(_eventId: string, _content: DecryptedContent, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onAppendLocalEvent(_event: StreamTimelineEvent, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    getChannelMetadata(): StreamStateView_ChannelMetadata | undefined;
    getStreamParentId(): string | undefined;
    getStreamParentIdAsBytes(): Uint8Array | undefined;
    needsScrollback(): boolean;
}
//# sourceMappingURL=streamStateView_AbstractContent.d.ts.map
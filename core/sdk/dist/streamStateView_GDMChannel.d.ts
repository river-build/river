import TypedEmitter from 'typed-emitter';
import { GdmChannelPayload_Snapshot, Snapshot } from '@river-build/proto';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { ConfirmedTimelineEvent, RemoteTimelineEvent, StreamTimelineEvent } from './types';
import { DecryptedContent } from './encryptedContentTypes';
import { StreamEncryptionEvents, StreamEvents, StreamStateEvents } from './streamEvents';
import { StreamStateView_ChannelMetadata } from './streamStateView_ChannelMetadata';
export declare class StreamStateView_GDMChannel extends StreamStateView_AbstractContent {
    readonly streamId: string;
    readonly channelMetadata: StreamStateView_ChannelMetadata;
    lastEventCreatedAtEpochMs: bigint;
    constructor(streamId: string);
    applySnapshot(snapshot: Snapshot, content: GdmChannelPayload_Snapshot, cleartexts: Record<string, string> | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    prependEvent(event: RemoteTimelineEvent, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendEvent(event: RemoteTimelineEvent, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onDecryptedContent(eventId: string, content: DecryptedContent, emitter: TypedEmitter<StreamEvents>): void;
    onConfirmedEvent(event: ConfirmedTimelineEvent, emitter: TypedEmitter<StreamEvents> | undefined): void;
    onAppendLocalEvent(event: StreamTimelineEvent, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    getChannelMetadata(): StreamStateView_ChannelMetadata | undefined;
    private updateLastEvent;
}
//# sourceMappingURL=streamStateView_GDMChannel.d.ts.map
import TypedEmitter from 'typed-emitter';
import { DmChannelPayload_Snapshot, Snapshot } from '@river-build/proto';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { ConfirmedTimelineEvent, RemoteTimelineEvent, StreamTimelineEvent } from './types';
import { DecryptedContent } from './encryptedContentTypes';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
export declare class StreamStateView_DMChannel extends StreamStateView_AbstractContent {
    readonly streamId: string;
    firstPartyId?: string;
    secondPartyId?: string;
    lastEventCreatedAtEpochMs: bigint;
    constructor(streamId: string);
    applySnapshot(snapshot: Snapshot, content: DmChannelPayload_Snapshot, _cleartexts: Record<string, string> | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    appendEvent(event: RemoteTimelineEvent, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    prependEvent(event: RemoteTimelineEvent, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onDecryptedContent(_eventId: string, _content: DecryptedContent, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onConfirmedEvent(event: ConfirmedTimelineEvent, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onAppendLocalEvent(event: StreamTimelineEvent, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    private updateLastEvent;
    participants(): Set<string>;
}
//# sourceMappingURL=streamStateView_DMChannel.d.ts.map
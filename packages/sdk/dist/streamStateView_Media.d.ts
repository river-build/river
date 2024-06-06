import TypedEmitter from 'typed-emitter';
import { Snapshot, MediaPayload_Snapshot } from '@river-build/proto';
import { RemoteTimelineEvent } from './types';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
export declare class StreamStateView_Media extends StreamStateView_AbstractContent {
    readonly streamId: string;
    info: {
        channelId: string;
        chunkCount: number;
        chunks: Uint8Array[];
    } | undefined;
    constructor(streamId: string);
    applySnapshot(_snapshot: Snapshot, content: MediaPayload_Snapshot, _emitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    appendEvent(event: RemoteTimelineEvent, _cleartext: string | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    prependEvent(event: RemoteTimelineEvent, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
}
//# sourceMappingURL=streamStateView_Media.d.ts.map
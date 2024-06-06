import TypedEmitter from 'typed-emitter';
import { RemoteTimelineEvent } from './types';
import { ChannelPayload_Snapshot, Snapshot } from '@river-build/proto';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
export declare class StreamStateView_Channel extends StreamStateView_AbstractContent {
    readonly streamId: string;
    spaceId: string;
    private reachedRenderableContent;
    constructor(streamId: string);
    getStreamParentId(): string | undefined;
    needsScrollback(): boolean;
    applySnapshot(snapshot: Snapshot, content: ChannelPayload_Snapshot, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    prependEvent(event: RemoteTimelineEvent, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendEvent(event: RemoteTimelineEvent, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
}
//# sourceMappingURL=streamStateView_Channel.d.ts.map
import TypedEmitter from 'typed-emitter';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { StreamEncryptionEvents, StreamEvents, StreamStateEvents } from './streamEvents';
import { RemoteTimelineEvent } from './types';
export declare class StreamStateView_UnknownContent extends StreamStateView_AbstractContent {
    readonly streamId: string;
    constructor(streamId: string);
    prependEvent(_event: RemoteTimelineEvent, _cleartext: string | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendEvent(_event: RemoteTimelineEvent, _cleartext: string | undefined, _emitter: TypedEmitter<StreamEvents> | undefined): void;
}
//# sourceMappingURL=streamStateView_UnknownContent.d.ts.map
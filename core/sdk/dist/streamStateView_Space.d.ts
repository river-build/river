import TypedEmitter from 'typed-emitter';
import { ConfirmedTimelineEvent, RemoteTimelineEvent } from './types';
import { Snapshot, SpacePayload_Snapshot } from '@river-build/proto';
import { StreamEncryptionEvents, StreamEvents, StreamStateEvents } from './streamEvents';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { DecryptedContent } from './encryptedContentTypes';
export type ParsedChannelProperties = {
    isDefault: boolean;
    updatedAtHash: string;
};
export declare class StreamStateView_Space extends StreamStateView_AbstractContent {
    readonly streamId: string;
    readonly spaceChannelsMetadata: Map<string, ParsedChannelProperties>;
    constructor(streamId: string);
    applySnapshot(eventHash: string, snapshot: Snapshot, content: SpacePayload_Snapshot, _cleartexts: Record<string, string> | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    onConfirmedEvent(_event: ConfirmedTimelineEvent, _emitter: TypedEmitter<StreamEvents> | undefined): void;
    prependEvent(event: RemoteTimelineEvent, _cleartext: string | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendEvent(event: RemoteTimelineEvent, cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    private addSpacePayload_Channel;
    onDecryptedContent(_eventId: string, _content: DecryptedContent, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
}
//# sourceMappingURL=streamStateView_Space.d.ts.map
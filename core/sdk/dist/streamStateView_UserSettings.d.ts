import { Snapshot, UserSettingsPayload_MarkerContent, UserSettingsPayload_Snapshot, UserSettingsPayload_Snapshot_UserBlocks, UserSettingsPayload_Snapshot_UserBlocks_Block } from '@river-build/proto';
import TypedEmitter from 'typed-emitter';
import { RemoteTimelineEvent } from './types';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
export declare class StreamStateView_UserSettings extends StreamStateView_AbstractContent {
    readonly streamId: string;
    readonly settings: Map<string, string>;
    readonly fullyReadMarkersSrc: Map<string, UserSettingsPayload_MarkerContent>;
    readonly fullyReadMarkers: Map<string, Record<string, import("@bufbuild/protobuf").PlainMessage<import("@river-build/proto").FullyReadMarkers_Content>>>;
    readonly userBlocks: Record<string, UserSettingsPayload_Snapshot_UserBlocks>;
    constructor(streamId: string);
    applySnapshot(snapshot: Snapshot, content: UserSettingsPayload_Snapshot): void;
    prependEvent(event: RemoteTimelineEvent, _cleartext: string | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendEvent(event: RemoteTimelineEvent, _cleartext: string | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    private fullyReadMarkerUpdate;
    private userBlockUpdate;
    isUserBlocked(userId: string): boolean;
    isUserBlockedAt(userId: string, eventNum: bigint): boolean;
    getLastBlock(userId: string): UserSettingsPayload_Snapshot_UserBlocks_Block | undefined;
}
//# sourceMappingURL=streamStateView_UserSettings.d.ts.map
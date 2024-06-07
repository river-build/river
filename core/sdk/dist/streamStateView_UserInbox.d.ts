import TypedEmitter from 'typed-emitter';
import { ConfirmedTimelineEvent, RemoteTimelineEvent } from './types';
import { Snapshot, UserInboxPayload_Snapshot, UserInboxPayload_Snapshot_DeviceSummary, UserInboxPayload_GroupEncryptionSessions } from '@river-build/proto';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
export declare class StreamStateView_UserInbox extends StreamStateView_AbstractContent {
    readonly streamId: string;
    deviceSummary: Record<string, UserInboxPayload_Snapshot_DeviceSummary>;
    pendingGroupSessions: Record<string, {
        creatorUserId: string;
        value: UserInboxPayload_GroupEncryptionSessions;
    }>;
    constructor(streamId: string);
    applySnapshot(snapshot: Snapshot, content: UserInboxPayload_Snapshot, _emitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    onConfirmedEvent(event: ConfirmedTimelineEvent, emitter: TypedEmitter<StreamStateEvents> | undefined): void;
    prependEvent(event: RemoteTimelineEvent, _cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendEvent(event: RemoteTimelineEvent, _cleartext: string | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    hasPendingSessionId(deviceKey: string, sessionId: string): boolean;
    private addGroupSessions;
    private updateDeviceSummary;
}
//# sourceMappingURL=streamStateView_UserInbox.d.ts.map
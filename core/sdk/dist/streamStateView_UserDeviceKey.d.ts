import TypedEmitter from 'typed-emitter';
import { RemoteTimelineEvent } from './types';
import { Snapshot, UserDeviceKeyPayload_Snapshot } from '@river-build/proto';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { UserDevice } from '@river-build/encryption';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
export declare class StreamStateView_UserDeviceKeys extends StreamStateView_AbstractContent {
    readonly streamId: string;
    readonly streamCreatorId: string;
    readonly deviceKeys: UserDevice[];
    constructor(streamId: string);
    applySnapshot(snapshot: Snapshot, content: UserDeviceKeyPayload_Snapshot, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    prependEvent(_event: RemoteTimelineEvent, _cleartext: string | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendEvent(event: RemoteTimelineEvent, _cleartext: string | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    private addUserDeviceKey;
}
//# sourceMappingURL=streamStateView_UserDeviceKey.d.ts.map
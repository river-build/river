import TypedEmitter from 'typed-emitter';
import { RemoteTimelineEvent } from './types';
import { MembershipOp, Snapshot, UserPayload_Snapshot, UserPayload_UserMembership } from '@river-build/proto';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
export declare class StreamStateView_User extends StreamStateView_AbstractContent {
    readonly streamId: string;
    readonly streamMemberships: {
        [key: string]: UserPayload_UserMembership;
    };
    constructor(streamId: string);
    applySnapshot(snapshot: Snapshot, content: UserPayload_Snapshot, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    prependEvent(event: RemoteTimelineEvent, _cleartext: string | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendEvent(event: RemoteTimelineEvent, cleartext: string | undefined, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    private addUserPayload_userMembership;
    getMembership(streamId: string): UserPayload_UserMembership | undefined;
    isMember(streamId: string, membership: MembershipOp): boolean;
    isJoined(streamId: string): boolean;
}
//# sourceMappingURL=streamStateView_User.d.ts.map
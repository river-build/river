import { MembershipOp, MemberPayload, Snapshot, WrappedEncryptedData, MemberPayload_Nft } from '@river-build/proto';
import TypedEmitter from 'typed-emitter';
import { StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
import { ConfirmedTimelineEvent, RemoteTimelineEvent } from './types';
import { StreamStateView_Members_Membership } from './streamStateView_Members_Membership';
import { StreamStateView_Members_Solicitations } from './streamStateView_Members_Solicitations';
import { DecryptedContent } from './encryptedContentTypes';
import { StreamStateView_UserMetadata } from './streamStateView_UserMetadata';
import { KeySolicitationContent } from '@river-build/encryption';
export type StreamMember = {
    userId: string;
    userAddress: Uint8Array;
    miniblockNum?: bigint;
    eventNum?: bigint;
    solicitations: KeySolicitationContent[];
    encryptedUsername?: WrappedEncryptedData;
    encryptedDisplayName?: WrappedEncryptedData;
    ensAddress?: Uint8Array;
    nft?: MemberPayload_Nft;
};
export declare class StreamStateView_Members {
    readonly streamId: string;
    readonly joined: Map<string, StreamMember>;
    readonly membership: StreamStateView_Members_Membership;
    readonly solicitHelper: StreamStateView_Members_Solicitations;
    readonly userMetadata: StreamStateView_UserMetadata;
    constructor(streamId: string);
    applySnapshot(snapshot: Snapshot, cleartexts: Record<string, string> | undefined, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined): void;
    prependEvent(_event: RemoteTimelineEvent, _payload: MemberPayload, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, _stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    /**
     * Places event in a pending queue, to be applied when the event is confirmed in a miniblock header
     */
    appendEvent(event: RemoteTimelineEvent, cleartext: string | undefined, payload: MemberPayload, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onConfirmedEvent(event: ConfirmedTimelineEvent, payload: MemberPayload, _encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    onDecryptedContent(eventId: string, content: DecryptedContent, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    isMemberJoined(userId: string): boolean;
    isMember(membership: MembershipOp, userId: string): boolean;
    participants(): Set<string>;
    joinedParticipants(): Set<string>;
    joinedOrInvitedParticipants(): Set<string>;
}
//# sourceMappingURL=streamStateView_Members.d.ts.map
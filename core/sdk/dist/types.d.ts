import { PlainMessage } from '@bufbuild/protobuf';
import { StreamEvent, ChannelMessage, ChannelMessage_Post_Content_Text, UserDeviceKeyPayload_Inception, UserPayload_Inception, SpacePayload_Inception, ChannelProperties, ChannelPayload_Inception, UserSettingsPayload_Inception, SpacePayload_Channel, EncryptedData, UserPayload_UserMembership, UserSettingsPayload_UserBlock, UserSettingsPayload_FullyReadMarkers, MiniblockHeader, ChannelMessage_Post_Mention, ChannelMessage_Post, MediaPayload_Inception, MediaPayload_Chunk, DmChannelPayload_Inception, GdmChannelPayload_Inception, UserInboxPayload_Ack, UserInboxPayload_Inception, UserDeviceKeyPayload_EncryptionDevice, UserInboxPayload_GroupEncryptionSessions, SyncCookie, Snapshot, UserPayload_UserMembershipAction, MemberPayload_Membership, MembershipOp, MemberPayload_KeyFulfillment, MemberPayload_KeySolicitation, MemberPayload_Nft } from '@river-build/proto';
import { DecryptedContent } from './encryptedContentTypes';
import { DecryptionSessionError } from '@river-build/encryption';
export type LocalEventStatus = 'sending' | 'sent' | 'failed';
export interface LocalEvent {
    localId: string;
    channelMessage: ChannelMessage;
    status: LocalEventStatus;
}
export interface ParsedEvent {
    event: StreamEvent;
    hash: Uint8Array;
    hashStr: string;
    prevMiniblockHashStr?: string;
    creatorUserId: string;
}
export interface StreamTimelineEvent {
    hashStr: string;
    creatorUserId: string;
    eventNum: bigint;
    createdAtEpochMs: bigint;
    localEvent?: LocalEvent;
    remoteEvent?: ParsedEvent;
    decryptedContent?: DecryptedContent;
    decryptedContentError?: DecryptionSessionError;
    miniblockNum?: bigint;
    confirmedEventNum?: bigint;
}
export type RemoteTimelineEvent = Omit<StreamTimelineEvent, 'remoteEvent'> & {
    remoteEvent: ParsedEvent;
};
export type LocalTimelineEvent = Omit<StreamTimelineEvent, 'localEvent'> & {
    localEvent: LocalEvent;
};
export type ConfirmedTimelineEvent = Omit<StreamTimelineEvent, 'remoteEvent' | 'confirmedEventNum' | 'miniblockNum'> & {
    remoteEvent: ParsedEvent;
    confirmedEventNum: bigint;
    miniblockNum: bigint;
};
export type DecryptedTimelineEvent = Omit<StreamTimelineEvent, 'decryptedContent' | 'remoteEvent'> & {
    remoteEvent: ParsedEvent;
    decryptedContent: DecryptedContent;
};
export declare function isLocalEvent(event: StreamTimelineEvent): event is LocalTimelineEvent;
export declare function isRemoteEvent(event: StreamTimelineEvent): event is RemoteTimelineEvent;
export declare function isDecryptedEvent(event: StreamTimelineEvent): event is DecryptedTimelineEvent;
export declare function isConfirmedEvent(event: StreamTimelineEvent): event is ConfirmedTimelineEvent;
export declare function makeRemoteTimelineEvent(params: {
    parsedEvent: ParsedEvent;
    eventNum: bigint;
    miniblockNum?: bigint;
    confirmedEventNum?: bigint;
}): RemoteTimelineEvent;
export interface ParsedMiniblock {
    hash: Uint8Array;
    header: MiniblockHeader;
    events: ParsedEvent[];
}
export interface ParsedStreamAndCookie {
    nextSyncCookie: SyncCookie;
    miniblocks: ParsedMiniblock[];
    events: ParsedEvent[];
}
export interface ParsedStreamResponse {
    snapshot: Snapshot;
    streamAndCookie: ParsedStreamAndCookie;
    prevSnapshotMiniblockNum: bigint;
    eventIds: string[];
}
export type ClientInitStatus = {
    isLocalDataLoaded: boolean;
    isRemoteDataLoaded: boolean;
    progress: number;
};
export declare function isCiphertext(text: string): boolean;
export declare const takeKeccakFingerprintInHex: (buf: Uint8Array, n: number) => string;
export declare const make_MemberPayload_Membership: (value: PlainMessage<MemberPayload_Membership>) => PlainMessage<StreamEvent>['payload'];
export declare const make_UserPayload_Inception: (value: PlainMessage<UserPayload_Inception>) => PlainMessage<StreamEvent>['payload'];
export declare const make_UserPayload_UserMembership: (value: PlainMessage<UserPayload_UserMembership>) => PlainMessage<StreamEvent>['payload'];
export declare const make_UserPayload_UserMembershipAction: (value: PlainMessage<UserPayload_UserMembershipAction>) => PlainMessage<StreamEvent>['payload'];
export declare const make_SpacePayload_Inception: (value: PlainMessage<SpacePayload_Inception>) => PlainMessage<StreamEvent>['payload'];
export declare const make_MemberPayload_DisplayName: (value: PlainMessage<EncryptedData>) => PlainMessage<StreamEvent>['payload'];
export declare const make_MemberPayload_Username: (value: PlainMessage<EncryptedData>) => PlainMessage<StreamEvent>['payload'];
export declare const make_MemberPayload_EnsAddress: (value: Uint8Array) => PlainMessage<StreamEvent>['payload'];
export declare const make_MemberPayload_Nft: (value: MemberPayload_Nft) => PlainMessage<StreamEvent>['payload'];
export declare const make_ChannelMessage_Post_Content_Text: (body: string, mentions?: PlainMessage<ChannelMessage_Post_Mention>[]) => ChannelMessage;
export declare const make_ChannelMessage_Post_Content_GM: (typeUrl: string, value?: Uint8Array) => ChannelMessage;
export declare const make_ChannelMessage_Reaction: (refEventId: string, reaction: string) => ChannelMessage;
export declare const make_ChannelMessage_Edit: (refEventId: string, post: PlainMessage<ChannelMessage_Post>) => ChannelMessage;
export declare const make_ChannelMessage_Redaction: (refEventId: string, reason?: string) => ChannelMessage;
export declare const make_ChannelProperties: (channelName: string, channelTopic: string) => ChannelProperties;
export declare const make_ChannelPayload_Inception: (value: PlainMessage<ChannelPayload_Inception>) => PlainMessage<StreamEvent>['payload'];
export declare const make_DMChannelPayload_Inception: (value: PlainMessage<DmChannelPayload_Inception>) => PlainMessage<StreamEvent>['payload'];
type DeprecatedMembership = {
    userId: string;
    op: MembershipOp;
    initiatorId: string;
    streamParentId?: string;
};
export declare const make_MemberPayload_Membership2: (value: DeprecatedMembership) => PlainMessage<StreamEvent>['payload'];
export declare const make_GDMChannelPayload_Inception: (value: PlainMessage<GdmChannelPayload_Inception>) => PlainMessage<StreamEvent>['payload'];
export declare const make_GDMChannelPayload_ChannelProperties: (value: PlainMessage<EncryptedData>) => PlainMessage<StreamEvent>['payload'];
export declare const make_UserSettingsPayload_Inception: (value: PlainMessage<UserSettingsPayload_Inception>) => PlainMessage<StreamEvent>['payload'];
export declare const make_UserSettingsPayload_FullyReadMarkers: (value: PlainMessage<UserSettingsPayload_FullyReadMarkers>) => PlainMessage<StreamEvent>['payload'];
export declare const make_UserSettingsPayload_UserBlock: (value: PlainMessage<UserSettingsPayload_UserBlock>) => PlainMessage<StreamEvent>['payload'];
export declare const make_UserDeviceKeyPayload_Inception: (value: PlainMessage<UserDeviceKeyPayload_Inception>) => PlainMessage<StreamEvent>['payload'];
export declare const make_UserInboxPayload_Inception: (value: PlainMessage<UserInboxPayload_Inception>) => PlainMessage<StreamEvent>['payload'];
export declare const make_UserInboxPayload_GroupEncryptionSessions: (value: PlainMessage<UserInboxPayload_GroupEncryptionSessions>) => PlainMessage<StreamEvent>['payload'];
export declare const make_UserInboxPayload_Ack: (value: PlainMessage<UserInboxPayload_Ack>) => PlainMessage<StreamEvent>['payload'];
export declare const make_UserDeviceKeyPayload_EncryptionDevice: (value: PlainMessage<UserDeviceKeyPayload_EncryptionDevice>) => PlainMessage<StreamEvent>['payload'];
export declare const make_SpacePayload_Channel: (value: PlainMessage<SpacePayload_Channel>) => PlainMessage<StreamEvent>['payload'];
export declare const getUserPayload_Membership: (event: ParsedEvent | StreamEvent | undefined) => UserPayload_UserMembership | undefined;
export declare const getChannelPayload: (event: ParsedEvent | StreamEvent | undefined) => SpacePayload_Channel | undefined;
export declare const make_ChannelPayload_Message: (value: PlainMessage<EncryptedData>) => PlainMessage<StreamEvent>['payload'];
export declare const make_ChannelPayload_Redaction: (eventId: Uint8Array) => PlainMessage<StreamEvent>['payload'];
export declare const make_MemberPayload_KeyFulfillment: (value: PlainMessage<MemberPayload_KeyFulfillment>) => PlainMessage<StreamEvent>['payload'];
export declare const make_MemberPayload_KeySolicitation: (content: PlainMessage<MemberPayload_KeySolicitation>) => PlainMessage<StreamEvent>['payload'];
export declare const make_DMChannelPayload_Message: (value: PlainMessage<EncryptedData>) => PlainMessage<StreamEvent>['payload'];
export declare const make_GDMChannelPayload_Message: (value: PlainMessage<EncryptedData>) => PlainMessage<StreamEvent>['payload'];
export declare const getMessagePayload: (event: ParsedEvent | StreamEvent | undefined) => EncryptedData | undefined;
export declare const getMessagePayloadContent: (event: ParsedEvent | StreamEvent | undefined) => ChannelMessage | undefined;
export declare const getMessagePayloadContent_Text: (event: ParsedEvent | StreamEvent | undefined) => ChannelMessage_Post_Content_Text | undefined;
export declare const make_MediaPayload_Inception: (value: PlainMessage<MediaPayload_Inception>) => PlainMessage<StreamEvent>['payload'];
export declare const make_MediaPayload_Chunk: (value: PlainMessage<MediaPayload_Chunk>) => PlainMessage<StreamEvent>['payload'];
export declare const getMiniblockHeader: (event: ParsedEvent | StreamEvent | undefined) => MiniblockHeader | undefined;
export declare const getRefEventIdFromChannelMessage: (message: ChannelMessage) => string | undefined;
export {};
//# sourceMappingURL=types.d.ts.map
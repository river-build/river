import { ChannelMessage, SnapshotCaseType, SyncCookie, Snapshot } from '@river-build/proto';
import TypedEmitter from 'typed-emitter';
import { LocalEventStatus, LocalTimelineEvent, ParsedEvent, ParsedMiniblock, StreamTimelineEvent } from './types';
import { StreamStateView_Space } from './streamStateView_Space';
import { StreamStateView_Channel } from './streamStateView_Channel';
import { StreamStateView_User } from './streamStateView_User';
import { StreamStateView_UserSettings } from './streamStateView_UserSettings';
import { StreamStateView_UserDeviceKeys } from './streamStateView_UserDeviceKey';
import { StreamStateView_Members } from './streamStateView_Members';
import { StreamStateView_Media } from './streamStateView_Media';
import { StreamStateView_GDMChannel } from './streamStateView_GDMChannel';
import { StreamStateView_AbstractContent } from './streamStateView_AbstractContent';
import { StreamStateView_DMChannel } from './streamStateView_DMChannel';
import { StreamStateView_UserInbox } from './streamStateView_UserInbox';
import { DecryptedContent } from './encryptedContentTypes';
import { StreamStateView_UserMetadata } from './streamStateView_UserMetadata';
import { StreamStateView_ChannelMetadata } from './streamStateView_ChannelMetadata';
import { StreamEvents, StreamEncryptionEvents, StreamStateEvents } from './streamEvents';
import { DecryptionSessionError } from '@river-build/encryption';
export declare class StreamStateView {
    readonly streamId: string;
    readonly userId: string;
    readonly contentKind: SnapshotCaseType;
    readonly timeline: StreamTimelineEvent[];
    readonly events: Map<string, StreamTimelineEvent>;
    isInitialized: boolean;
    snapshot?: Snapshot;
    prevMiniblockHash?: Uint8Array;
    lastEventNum: bigint;
    prevSnapshotMiniblockNum: bigint;
    miniblockInfo?: {
        max: bigint;
        min: bigint;
        terminusReached: boolean;
    };
    syncCookie?: SyncCookie;
    membershipContent: StreamStateView_Members;
    private readonly _spaceContent?;
    get spaceContent(): StreamStateView_Space;
    private readonly _channelContent?;
    get channelContent(): StreamStateView_Channel;
    private readonly _dmChannelContent?;
    get dmChannelContent(): StreamStateView_DMChannel;
    private readonly _gdmChannelContent?;
    get gdmChannelContent(): StreamStateView_GDMChannel;
    private readonly _userContent?;
    get userContent(): StreamStateView_User;
    private readonly _userSettingsContent?;
    get userSettingsContent(): StreamStateView_UserSettings;
    private readonly _userDeviceKeyContent?;
    get userDeviceKeyContent(): StreamStateView_UserDeviceKeys;
    private readonly _userInboxContent?;
    get userInboxContent(): StreamStateView_UserInbox;
    private readonly _mediaContent?;
    get mediaContent(): StreamStateView_Media;
    constructor(userId: string, streamId: string);
    private applySnapshot;
    private appendStreamAndCookie;
    private processAppendedEvent;
    private processMiniblockHeader;
    private processPrependedEvent;
    private updateMiniblockInfo;
    updateDecryptedContent(eventId: string, content: DecryptedContent, emitter: TypedEmitter<StreamStateEvents>): void;
    updateDecryptedContentError(eventId: string, content: DecryptionSessionError, emitter: TypedEmitter<StreamStateEvents>): void;
    initialize(nextSyncCookie: SyncCookie, minipoolEvents: ParsedEvent[], snapshot: Snapshot, miniblocks: ParsedMiniblock[], prependedMiniblocks: ParsedMiniblock[], prevSnapshotMiniblockNum: bigint, cleartexts: Record<string, string> | undefined, localEvents: LocalTimelineEvent[], emitter: TypedEmitter<StreamEvents> | undefined): void;
    appendEvents(events: ParsedEvent[], nextSyncCookie: SyncCookie, cleartexts: Record<string, string> | undefined, emitter: TypedEmitter<StreamEvents>): void;
    prependEvents(miniblocks: ParsedMiniblock[], cleartexts: Record<string, string> | undefined, terminus: boolean, encryptionEmitter: TypedEmitter<StreamEncryptionEvents> | undefined, stateEmitter: TypedEmitter<StreamStateEvents> | undefined): void;
    appendLocalEvent(channelMessage: ChannelMessage, status: LocalEventStatus, emitter: TypedEmitter<StreamEvents> | undefined): string;
    updateLocalEvent(localId: string, parsedEventHash: string, status: LocalEventStatus, emitter: TypedEmitter<StreamEvents>): void;
    getMembers(): StreamStateView_Members;
    getUserMetadata(): StreamStateView_UserMetadata;
    getChannelMetadata(): StreamStateView_ChannelMetadata | undefined;
    getContent(): StreamStateView_AbstractContent;
    /**
     * Streams behave slightly differently.
     * Regular channels: the user needs to be an active member. SO_JOIN
     * DMs: always open for key exchange for any of the two participants
     */
    userIsEntitledToKeyExchange(userId: string): boolean;
    getUsersEntitledToKeyExchange(): Set<string>;
}
//# sourceMappingURL=streamStateView.d.ts.map
import { Message, PlainMessage } from '@bufbuild/protobuf';
import { ChannelMessage_Post_Mention, ChannelMessage, ChannelMessage_Post, ChannelMessage_Post_Content_Text, ChannelMessage_Post_Content_Image, ChannelMessage_Post_Content_GM, ChannelMessage_Reaction, ChannelMessage_Redaction, StreamEvent, EncryptedData, StreamSettings, FullyReadMarker, Envelope, ChannelMessage_Post_Attachment, AddEventResponse_Error } from '@river-build/proto';
import { CryptoStore, DecryptionEvents, EncryptionDevice, EntitlementsDelegate, GroupEncryptionCrypto, GroupEncryptionSession, IGroupEncryptionClient, UserDevice, UserDeviceCollection } from '@river-build/encryption';
import { StreamRpcClientType } from './makeStreamRpcClient';
import TypedEmitter from 'typed-emitter';
import { StreamEvents } from './streamEvents';
import { StreamStateView } from './streamStateView';
import { StreamTimelineEvent, ParsedMiniblock, ClientInitStatus } from './types';
import { Stream } from './stream';
import { SyncedStreams } from './syncedStreams';
import { SyncedStream } from './syncedStream';
import { SignerContext } from './signerContext';
type ClientEvents = StreamEvents & DecryptionEvents;
declare const Client_base: new () => TypedEmitter<ClientEvents>;
export declare class Client extends Client_base implements IGroupEncryptionClient {
    readonly signerContext: SignerContext;
    readonly rpcClient: StreamRpcClientType;
    readonly userId: string;
    readonly streams: SyncedStreams;
    userStreamId?: string;
    userSettingsStreamId?: string;
    userDeviceKeyStreamId?: string;
    userInboxStreamId?: string;
    private readonly logCall;
    private readonly logSync;
    private readonly logEmitFromStream;
    private readonly logEmitFromClient;
    private readonly logEvent;
    private readonly logError;
    private readonly logInfo;
    private readonly logDebug;
    cryptoBackend?: GroupEncryptionCrypto;
    cryptoStore: CryptoStore;
    private getStreamRequests;
    private getStreamExRequests;
    private getScrollbackRequests;
    private creatingStreamIds;
    private entitlementsDelegate;
    private decryptionExtensions?;
    private syncedStreamsExtensions?;
    private persistenceStore;
    constructor(signerContext: SignerContext, rpcClient: StreamRpcClientType, cryptoStore: CryptoStore, entitlementsDelegate: EntitlementsDelegate, persistenceStoreName?: string, logNamespaceFilter?: string, highPriorityStreamIds?: string[]);
    get streamSyncActive(): boolean;
    get clientInitStatus(): ClientInitStatus;
    get cryptoEnabled(): boolean;
    get encryptionDevice(): EncryptionDevice;
    stop(): Promise<void>;
    getSizeOfEncryptedСontentQueue(): number;
    stream(streamId: string | Uint8Array): SyncedStream | undefined;
    createSyncedStream(streamId: string | Uint8Array): SyncedStream;
    private initUserJoinedStreams;
    initializeUser(newUserMetadata?: {
        spaceId: Uint8Array | string;
    }): Promise<void>;
    private initUserStream;
    private initUserInboxStream;
    private initUserDeviceKeyStream;
    private initUserSettingsStream;
    private getUserStream;
    private createUserStream;
    private createUserDeviceKeyStream;
    private createUserInboxStream;
    private createUserSettingsStream;
    private createStreamAndSync;
    createSpace(spaceAddressOrId: string): Promise<{
        streamId: string;
    }>;
    createChannel(spaceId: string | Uint8Array, channelName: string, channelTopic: string, inChannelId: string | Uint8Array, streamSettings?: PlainMessage<StreamSettings>): Promise<{
        streamId: string;
    }>;
    createDMChannel(userId: string, streamSettings?: PlainMessage<StreamSettings>): Promise<{
        streamId: string;
    }>;
    createGDMChannel(userIds: string[], channelProperties?: EncryptedData, streamSettings?: PlainMessage<StreamSettings>): Promise<{
        streamId: string;
    }>;
    createMediaStream(channelId: string | Uint8Array, spaceId: string | Uint8Array | undefined, chunkCount: number, streamSettings?: PlainMessage<StreamSettings>): Promise<{
        streamId: string;
        prevMiniblockHash: Uint8Array;
    }>;
    updateChannel(spaceId: string | Uint8Array, channelId: string | Uint8Array, unused1: string, unused2: string): Promise<{
        eventId: string;
        error?: AddEventResponse_Error | undefined;
    }>;
    updateGDMChannelProperties(streamId: string, channelName: string, channelTopic: string): Promise<{
        eventId: string;
        error?: AddEventResponse_Error | undefined;
    }>;
    sendFullyReadMarkers(channelId: string | Uint8Array, fullyReadMarkers: Record<string, FullyReadMarker>): Promise<{
        eventId: string;
        error?: AddEventResponse_Error | undefined;
    }>;
    updateUserBlock(userId: string, isBlocked: boolean): Promise<{
        eventId: string;
        error?: AddEventResponse_Error | undefined;
    }>;
    setDisplayName(streamId: string, displayName: string): Promise<void>;
    setUsername(streamId: string, username: string): Promise<void>;
    setEnsAddress(streamId: string, walletAddress: string | Uint8Array): Promise<void>;
    setNft(streamId: string, tokenId: string, chainId: number, contractAddress: string): Promise<void>;
    isUsernameAvailable(streamId: string, username: string): boolean;
    waitForStream(streamId: string | Uint8Array): Promise<Stream>;
    getStream(streamId: string): Promise<StreamStateView>;
    private _getStream;
    private streamViewFromUnpackedResponse;
    getStreamEx(streamId: string): Promise<StreamStateView>;
    private _getStreamEx;
    initStream(streamId: string | Uint8Array, allowGetStream?: boolean): Promise<Stream>;
    private onJoinedStream;
    private onInvitedToStream;
    private onLeftStream;
    private onStreamInitialized;
    startSync(): void;
    stopSync(): Promise<void>;
    emit<E extends keyof ClientEvents>(event: E, ...args: Parameters<ClientEvents[E]>): boolean;
    sendMessage(streamId: string, body: string, mentions?: ChannelMessage_Post_Mention[], attachments?: ChannelMessage_Post_Attachment[]): Promise<{
        eventId: string;
    }>;
    sendChannelMessage(streamId: string, payload: ChannelMessage, opts?: {
        beforeSendEventHook?: Promise<void>;
    }): Promise<{
        eventId: string;
    }>;
    private makeAndSendChannelMessageEvent;
    sendChannelMessage_Text(streamId: string, payload: Omit<PlainMessage<ChannelMessage_Post>, 'content'> & {
        content: PlainMessage<ChannelMessage_Post_Content_Text>;
    }, opts?: {
        beforeSendEventHook?: Promise<void>;
    }): Promise<{
        eventId: string;
    }>;
    sendChannelMessage_Image(streamId: string, payload: Omit<PlainMessage<ChannelMessage_Post>, 'content'> & {
        content: PlainMessage<ChannelMessage_Post_Content_Image>;
    }, opts?: {
        beforeSendEventHook?: Promise<void>;
    }): Promise<{
        eventId: string;
    }>;
    sendChannelMessage_GM(streamId: string, payload: Omit<PlainMessage<ChannelMessage_Post>, 'content'> & {
        content: PlainMessage<ChannelMessage_Post_Content_GM>;
    }, opts?: {
        beforeSendEventHook?: Promise<void>;
    }): Promise<{
        eventId: string;
    }>;
    sendMediaPayload(streamId: string, data: Uint8Array, chunkIndex: number, prevMiniblockHash: Uint8Array): Promise<{
        prevMiniblockHash: Uint8Array;
    }>;
    sendChannelMessage_Reaction(streamId: string, payload: PlainMessage<ChannelMessage_Reaction>, opts?: {
        beforeSendEventHook?: Promise<void>;
    }): Promise<{
        eventId: string;
    }>;
    sendChannelMessage_Redaction(streamId: string, payload: PlainMessage<ChannelMessage_Redaction>): Promise<{
        eventId: string;
    }>;
    sendChannelMessage_Edit(streamId: string, refEventId: string, newPost: PlainMessage<ChannelMessage_Post>): Promise<{
        eventId: string;
    }>;
    sendChannelMessage_Edit_Text(streamId: string, refEventId: string, payload: Omit<PlainMessage<ChannelMessage_Post>, 'content'> & {
        content: PlainMessage<ChannelMessage_Post_Content_Text>;
    }): Promise<{
        eventId: string;
    }>;
    redactMessage(streamId: string, eventId: string): Promise<{
        eventId: string;
    }>;
    retrySendMessage(streamId: string, localId: string): Promise<void>;
    inviteUser(streamId: string | Uint8Array, userId: string): Promise<{
        eventId: string;
    }>;
    joinUser(streamId: string | Uint8Array, userId: string): Promise<{
        eventId: string;
    }>;
    joinStream(streamId: string | Uint8Array, opts?: {
        skipWaitForMiniblockConfirmation?: boolean;
        skipWaitForUserStreamUpdate?: boolean;
    }): Promise<Stream>;
    leaveStream(streamId: string | Uint8Array): Promise<{
        eventId: string;
    }>;
    removeUser(streamId: string | Uint8Array, userId: string): Promise<{
        eventId: string;
    }>;
    getMiniblocks(streamId: string | Uint8Array, fromInclusive: bigint, toExclusive: bigint): Promise<{
        miniblocks: ParsedMiniblock[];
        terminus: boolean;
    }>;
    scrollback(streamId: string): Promise<{
        terminus: boolean;
        firstEvent?: StreamTimelineEvent;
    }>;
    /**
     * Get the list of active devices for all users in the room
     *
     *
     * @returns Promise which resolves to `null`, or an array whose
     *     first element is a {@link DeviceInfoMap} indicating
     *     the devices that messages should be encrypted to, and whose second
     *     element is a map from userId to deviceId to data indicating the devices
     *     that are in the room but that have been blocked.
     */
    getDevicesInStream(stream_id: string): Promise<UserDeviceCollection>;
    downloadNewInboxMessages(): Promise<void>;
    downloadUserDeviceInfo(userIds: string[]): Promise<UserDeviceCollection>;
    knownDevicesForUserId(userId: string): Promise<UserDevice[]>;
    makeEventAndAddToStream(streamId: string | Uint8Array, payload: PlainMessage<StreamEvent>['payload'], options?: {
        method?: string;
        localId?: string;
        cleartext?: string;
        optional?: boolean;
    }): Promise<{
        eventId: string;
        error?: AddEventResponse_Error;
    }>;
    makeEventWithHashAndAddToStream(streamId: string | Uint8Array, payload: PlainMessage<StreamEvent>['payload'], prevMiniblockHash: Uint8Array, optional?: boolean, localId?: string, cleartext?: string, retryCount?: number): Promise<{
        prevMiniblockHash: Uint8Array;
        eventId: string;
        error?: AddEventResponse_Error;
    }>;
    getStreamLastMiniblockHash(streamId: string | Uint8Array): Promise<Uint8Array>;
    private initCrypto;
    /**
     * Resets crypto backend and creates a new encryption account, uploading device keys to UserDeviceKey stream.
     */
    resetCrypto(): Promise<void>;
    uploadDeviceKeys(): Promise<{
        eventId: string;
        error?: AddEventResponse_Error | undefined;
    }>;
    ackInboxStream(): Promise<void>;
    setHighPriorityStreams(streamIds: string[]): void;
    /**
     * decrypts and updates the decrypted event
     */
    decryptGroupEvent(streamId: string, eventId: string, kind: string, // kind of data
    encryptedData: EncryptedData): Promise<void>;
    private cleartextForGroupEvent;
    encryptAndShareGroupSessions(inStreamId: string | Uint8Array, sessions: GroupEncryptionSession[], toDevices: UserDeviceCollection): Promise<void>;
    encryptGroupEvent(event: Message, streamId: string): Promise<EncryptedData>;
    encryptWithDeviceKeys(payload: Message, deviceKeys: UserDevice[]): Promise<Record<string, string>>;
    userDeviceKey(): UserDevice;
    debugForceMakeMiniblock(streamId: string, opts?: {
        forceSnapshot?: boolean;
    }): Promise<void>;
    debugForceAddEvent(streamId: string, event: Envelope): Promise<void>;
}
export {};
//# sourceMappingURL=client.d.ts.map
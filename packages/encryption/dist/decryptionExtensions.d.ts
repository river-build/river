import TypedEmitter from 'typed-emitter';
import { Permission } from '@river-build/web3';
import { AddEventResponse_Error, EncryptedData, SessionKeys, UserInboxPayload_GroupEncryptionSessions } from '@river-build/proto';
import { DLogger } from '@river-build/dlog';
import { GroupEncryptionSession, UserDevice } from './olmLib';
import { GroupEncryptionCrypto } from './groupEncryptionCrypto';
export interface EntitlementsDelegate {
    isEntitled(spaceId: string | undefined, channelId: string | undefined, user: string, permission: Permission): Promise<boolean>;
}
export declare enum DecryptionStatus {
    initializing = "initializing",
    updating = "updating",
    processingNewGroupSessions = "processingNewGroupSessions",
    decryptingEvents = "decryptingEvents",
    retryingDecryption = "retryingDecryption",
    requestingKeys = "requestingKeys",
    respondingToKeyRequests = "respondingToKeyRequests",
    idle = "idle"
}
export type DecryptionEvents = {
    decryptionExtStatusChanged: (status: DecryptionStatus) => void;
};
export interface EncryptedContentItem {
    streamId: string;
    eventId: string;
    kind: string;
    encryptedData: EncryptedData;
}
export interface KeySolicitationContent {
    deviceKey: string;
    fallbackKey: string;
    isNewDevice: boolean;
    sessionIds: string[];
}
export interface KeySolicitationItem {
    streamId: string;
    fromUserId: string;
    fromUserAddress: Uint8Array;
    solicitation: KeySolicitationContent;
    respondAfter: Date;
}
export interface KeySolicitationData {
    streamId: string;
    isNewDevice: boolean;
    missingSessionIds: string[];
}
export interface KeyFulfilmentData {
    streamId: string;
    userAddress: Uint8Array;
    deviceKey: string;
    sessionIds: string[];
}
export interface GroupSessionsData {
    streamId: string;
    item: KeySolicitationItem;
    sessions: GroupEncryptionSession[];
}
export interface DecryptionSessionError {
    missingSession: boolean;
    kind: string;
    encryptedData: EncryptedData;
    error?: unknown;
}
/**
 *
 * Responsibilities:
 * 1. Download new to-device messages that happened while we were offline
 * 2. Decrypt new to-device messages
 * 3. Decrypt encrypted content
 * 4. Retry decryption failures, request keys for failed decryption
 * 5. Respond to key solicitations
 *
 *
 * Notes:
 * If in the future we started snapshotting the eventNum of the last message sent by every user,
 * we could use that to determine the order we send out keys, and the order that we reply to key solicitations.
 *
 * It should be easy to introduce a priority stream, where we decrypt messages from that stream first, before
 * anything else, so the messages show up quicky in the ui that the user is looking at.
 *
 * We need code to purge bad sessions (if someones sends us the wrong key, or a key that doesn't decrypt the message)
 */
export declare abstract class BaseDecryptionExtensions {
    private _status;
    private queues;
    private upToDateStreams;
    private highPriorityStreams;
    private decryptionFailures;
    private inProgressTick?;
    private timeoutId?;
    private delayMs;
    private started;
    private emitter;
    protected _onStopFn?: () => void;
    protected log: {
        debug: DLogger;
        info: DLogger;
        error: DLogger;
    };
    readonly crypto: GroupEncryptionCrypto;
    readonly entitlementDelegate: EntitlementsDelegate;
    readonly userDevice: UserDevice;
    readonly userId: string;
    constructor(emitter: TypedEmitter<DecryptionEvents>, crypto: GroupEncryptionCrypto, entitlementDelegate: EntitlementsDelegate, userDevice: UserDevice, userId: string, upToDateStreams: Set<string>);
    abstract ackNewGroupSession(session: UserInboxPayload_GroupEncryptionSessions): Promise<void>;
    abstract decryptGroupEvent(streamId: string, eventId: string, kind: string, encryptedData: EncryptedData): Promise<void>;
    abstract downloadNewMessages(): Promise<void>;
    abstract getKeySolicitations(streamId: string): KeySolicitationContent[];
    abstract hasStream(streamId: string): boolean;
    abstract hasUnprocessedSession(item: EncryptedContentItem): boolean;
    abstract isUserEntitledToKeyExchange(streamId: string, userId: string, opts?: {
        skipOnChainValidation: boolean;
    }): Promise<boolean>;
    abstract isUserInboxStreamUpToDate(upToDateStreams: Set<string>): boolean;
    abstract onDecryptionError(item: EncryptedContentItem, err: DecryptionSessionError): void;
    abstract sendKeySolicitation(args: KeySolicitationData): Promise<void>;
    abstract sendKeyFulfillment(args: KeyFulfilmentData): Promise<{
        error?: AddEventResponse_Error;
    }>;
    abstract encryptAndShareGroupSessions(args: GroupSessionsData): Promise<void>;
    abstract shouldPauseTicking(): boolean;
    /**
     * uploadDeviceKeys
     * upload device keys to the server
     */
    abstract uploadDeviceKeys(): Promise<void>;
    enqueueNewGroupSessions(sessions: UserInboxPayload_GroupEncryptionSessions, _senderId: string): void;
    enqueueNewEncryptedContent(streamId: string, eventId: string, kind: string, // kind of encrypted data
    encryptedData: EncryptedData): void;
    enqueueKeySolicitation(streamId: string, fromUserId: string, fromUserAddress: Uint8Array, keySolicitation: KeySolicitationContent): void;
    setStreamUpToDate(streamId: string): void;
    retryDecryptionFailures(streamId: string): void;
    start(): void;
    onStart(): void;
    stop(): Promise<void>;
    onStop(): Promise<void>;
    getSizeOfEncryptedСontentQueue(): number;
    get status(): DecryptionStatus;
    private setStatus;
    protected checkStartTicking(): void;
    private stopTicking;
    private getDelayMs;
    private tick;
    /**
     * processNewGroupSession
     * process new group sessions that were sent to our to device stream inbox
     * re-enqueue any decryption failures with matching session id
     */
    private processNewGroupSession;
    /**
     * processEncryptedContentItem
     * try to decrypt encrytped content
     */
    private processEncryptedContentItem;
    /**
     * processDecryptionRetry
     * retry decryption a second time for a failed decryption, keys may have arrived
     */
    private processDecryptionRetry;
    /**
     * processMissingKeys
     * process missing keys and send key solicitations to streams
     */
    private processMissingKeys;
    /**
     * processKeySolicitation
     * process incoming key solicitations and send keys and key fulfillments
     */
    private processKeySolicitation;
    /**
     * can be overridden to add a delay to the key solicitation response
     */
    getRespondDelayMSForKeySolicitation(_streamId: string, _userId: string): number;
    setHighPriorityStreams(streamIds: string[]): void;
}
export declare function makeSessionKeys(sessions: GroupEncryptionSession[]): SessionKeys;
//# sourceMappingURL=decryptionExtensions.d.ts.map
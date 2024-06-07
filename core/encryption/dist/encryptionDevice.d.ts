import { CryptoStore } from './cryptoStore';
import { InboundGroupSession, IOutboundGroupSessionKey } from './encryptionTypes';
import { EncryptionDelegate } from './encryptionDelegate';
import { GroupEncryptionSession } from './olmLib';
/** data stored in the session store about an inbound group session */
export interface InboundGroupSessionData {
    stream_id: string;
    /** pickled InboundGroupSession */
    session: string;
    keysClaimed: Record<string, string>;
    /** whether this session is untrusted. */
    untrusted?: boolean;
}
export interface IDecryptedGroupMessage {
    result: string;
    keysClaimed: Record<string, string>;
    streamId: string;
    untrusted: boolean;
}
export type GroupSessionExtraData = {
    untrusted?: boolean;
};
export declare class EncryptionDevice {
    private delegate;
    private readonly cryptoStore;
    pickleKey: string;
    /** Curve25519 key for the account, unknown until we load the account from storage in init() */
    deviceCurve25519Key: string | null;
    /** Ed25519 key for the account, unknown until we load the account from storage in init() */
    deviceDoNotUseKey: string | null;
    fallbackKey: {
        keyId: string;
        key: string;
    };
    sessionsInProgress: Record<string, Promise<void>>;
    olmPrekeyPromise: Promise<any>;
    private inboundGroupSessionMessageIndexes;
    constructor(delegate: EncryptionDelegate, cryptoStore: CryptoStore);
    /**
     * Iniitialize the Account. Must be called prior to any other operation
     * on the device.
     *
     * Data from an exported device can be provided in order to recreate this device.
     *
     * Attempts to load the Account from the crypto store, or create one otherwise
     * storing the account in storage.
     *
     * Reads the device keys from the Account object.
     *
     * @param fromExportedDevice - data from exported device
     *     that must be re-created.
     *     If present, opts.pickleKey is ignored
     *     (exported data already provides a pickle key)
     * @param pickleKey - pickle key to set instead of default one
     *
     *
     */
    init(): Promise<void>;
    private initializeAccount;
    /**
     * Extract our Account from the crypto store and call the given function
     * with the account object
     * The `account` object is usable only within the callback passed to this
     * function and will be freed as soon the callback returns. It is *not*
     * usable for the rest of the lifetime of the transaction.
     * This function requires a live transaction object from cryptoStore.doTxn()
     * and therefore may only be called in a doTxn() callback.
     *
     * @param txn - Opaque transaction object from cryptoStore.doTxn()
     * @internal
     */
    private getAccount;
    /**
     * Saves an account to the crypto store.
     * This function requires a live transaction object from cryptoStore.doTxn()
     * and therefore may only be called in a doTxn() callback.
     *
     * @param txn - Opaque transaction object from cryptoStore.doTxn()
     * @param Account object
     * @internal
     */
    private storeAccount;
    /**
     * get an OlmUtility and call the given function
     *
     * @returns result of func
     * @internal
     */
    private getUtility;
    /**
     * Signs a message with the ed25519 key for this account.
     *
     * @param message -  message to be signed
     * @returns base64-encoded signature
     */
    sign(message: string): Promise<string>;
    /**
     * Marks all of the fallback keys as published.
     */
    markKeysAsPublished(): Promise<void>;
    /**
     * Generate a new fallback keys
     *
     * @returns Resolved once the account is saved back having generated the key
     */
    generateFallbackKeyIfNeeded(): Promise<void>;
    getFallbackKey(): Promise<{
        keyId: string;
        key: string;
    }>;
    forgetOldFallbackKey(): Promise<void>;
    /**
     * Store an OutboundGroupSession in outboundSessionStore
     *
     */
    private saveOutboundGroupSession;
    /**
     * Extract OutboundGroupSession from the session store and call given fn.
     */
    private getOutboundGroupSession;
    /**
     * Get the session keys for an outbound group session
     *
     * @param sessionId -  the id of the outbound group session
     *
     * @returns current chain index, and
     *     base64-encoded secret key.
     */
    getOutboundGroupSessionKey(streamId: string): Promise<IOutboundGroupSessionKey>;
    /**
     * Generate a new outbound group session
     *
     */
    createOutboundGroupSession(streamId: string): Promise<string>;
    /**
     * Unpickle a session from a sessionData object and invoke the given function.
     * The session is valid only until func returns.
     *
     * @param sessionData - Object describing the session.
     * @param func - Invoked with the unpickled session
     * @returns result of func
     */
    private unpickleInboundGroupSession;
    /**
     * Extract an InboundGroupSession from the crypto store and call the given function
     *
     * @param streamId - The stream ID to extract the session for, or null to fetch
     *     sessions for any room.
     * @param txn - Opaque transaction object from cryptoStore.doTxn()
     * @param func - function to call.
     *
     * @internal
     */
    getInboundGroupSession(streamId: string, sessionId: string): Promise<{
        session: InboundGroupSession | undefined;
        data: InboundGroupSessionData | undefined;
    }>;
    /**
     * Add an inbound group session to the session store
     *
     * @param streamId -     room in which this session will be used
     * @param senderKey -  base64-encoded curve25519 key of the sender
     * @param sessionId -  session identifier
     * @param sessionKey - base64-encoded secret key
     * @param keysClaimed - Other keys the sender claims.
     * @param exportFormat - true if the group keys are in export format
     *    (ie, they lack an ed25519 signature)
     * @param extraSessionData - any other data to be include with the session
     */
    addInboundGroupSession(streamId: string, sessionId: string, sessionKey: string, keysClaimed: Record<string, string>, _exportFormat: boolean, extraSessionData?: GroupSessionExtraData): Promise<void>;
    /**
     * Encrypt an outgoing message with an outbound group session
     *
     * @param sessionId - this id of the session
     * @param payloadString - payload to be encrypted
     *
     * @returns ciphertext
     */
    encryptGroupMessage(payloadString: string, streamId: string): Promise<{
        ciphertext: string;
        sessionId: string;
    }>;
    encryptUsingFallbackKey(theirIdentityKey: string, fallbackKey: string, payload: string): Promise<{
        type: 0 | 1;
        body: string;
    }>;
    /**
     * Decrypt an incoming message using an existing session
     *
     * @param theirDeviceIdentityKey - Curve25519 identity key for the
     *     remote device
     * @param messageType -  messageType field from the received message
     * @param ciphertext - base64-encoded body from the received message
     *
     * @returns decrypted payload.
     */
    decryptMessage(ciphertext: string, theirDeviceIdentityKey: string, messageType?: number): Promise<string>;
    /**
     * Verify an ed25519 signature.
     *
     * @param key - ed25519 key
     * @param message - message which was signed
     * @param signature - base64-encoded signature to be checked
     *
     * @throws Error if there is a problem with the verification. If the key was
     * too small then the message will be "OLM.INVALID_BASE64". If the signature
     * was invalid then the message will be "OLM.BAD_MESSAGE_MAC".
     */
    verifySignature(key: string, message: string, signature: string): void;
    getInboundGroupSessionIds(streamId: string): Promise<string[]>;
    /**
     * Determine if we have the keys for a given group session
     *
     * @param streamId - stream in which the message was received
     * @param senderKey - base64-encoded curve25519 key of the sender
     * @param sessionId - session identifier
     */
    hasInboundSessionKeys(streamId: string, sessionId: string): Promise<boolean>;
    /**
     * Export an inbound group session
     *
     * @param streamId - streamId of session
     * @param sessionId  - session identifier
     * @param sessionData - the session object from the store
     */
    exportInboundGroupSession(streamId: string, sessionId: string): Promise<GroupEncryptionSession | undefined>;
}
//# sourceMappingURL=encryptionDevice.d.ts.map
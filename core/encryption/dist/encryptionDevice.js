// todo: fix lint issues and remove exception see: https://linear.app/hnt-labs/issue/HNT-1721/address-linter-overrides-in-matrix-encryption-code-from-sdk
/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-argument*/
import { GROUP_ENCRYPTION_ALGORITHM } from './olmLib';
import { dlog } from '@river-build/dlog';
const log = dlog('csb:encryption:encryptionDevice');
// The maximum size of an event is 65K, and we base64 the content, so this is a
// reasonable approximation to the biggest plaintext we can encrypt.
const MAX_PLAINTEXT_LENGTH = (65536 * 3) / 4;
function checkPayloadLength(payloadString) {
    if (payloadString === undefined) {
        throw new Error('payloadString undefined');
    }
    if (payloadString.length > MAX_PLAINTEXT_LENGTH) {
        // might as well fail early here rather than letting the olm library throw
        // a cryptic memory allocation error.
        //
        throw new Error(`Message too long (${payloadString.length} bytes). ` +
            `The maximum for an encrypted message is ${MAX_PLAINTEXT_LENGTH} bytes.`);
    }
}
export class EncryptionDevice {
    delegate;
    cryptoStore;
    // https://linear.app/hnt-labs/issue/HNT-4273/pick-a-better-pickle-key-in-olmdevice
    pickleKey = 'DEFAULT_KEY'; // set by consumers
    /** Curve25519 key for the account, unknown until we load the account from storage in init() */
    deviceCurve25519Key = null;
    /** Ed25519 key for the account, unknown until we load the account from storage in init() */
    deviceDoNotUseKey = null;
    // keyId: base64(key)
    fallbackKey = { keyId: '', key: '' };
    // Keep track of sessions that we're starting, so that we don't start
    // multiple sessions for the same device at the same time.
    sessionsInProgress = {}; // set by consumers
    // Used by olm to serialise prekey message decryptions
    // todo: ensure we need this to serialize prekey message given we're using fallback keys
    // not one time keys, which suffer a race condition and expire once used.
    olmPrekeyPromise = Promise.resolve(); // set by consumers
    // Store a set of decrypted message indexes for each group session.
    // This partially mitigates a replay attack where a MITM resends a group
    // message into the room.
    //
    // Keys are strings of form "<senderKey>|<session_id>|<message_index>"
    // Values are objects of the form "{id: <event id>, timestamp: <ts>}"
    inboundGroupSessionMessageIndexes = {};
    constructor(delegate, cryptoStore) {
        this.delegate = delegate;
        this.cryptoStore = cryptoStore;
    }
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
    async init() {
        let e2eKeys;
        if (!this.delegate.initialized) {
            await this.delegate.init();
        }
        const account = this.delegate.createAccount();
        try {
            await this.initializeAccount(account);
            await this.generateFallbackKeyIfNeeded();
            this.fallbackKey = await this.getFallbackKey();
            e2eKeys = JSON.parse(account.identity_keys());
        }
        finally {
            account.free();
        }
        this.deviceCurve25519Key = e2eKeys.curve25519;
        // note jterzis 07/19/23: deprecating ed25519 key in favor of TDK
        // see: https://linear.app/hnt-labs/issue/HNT-1796/tdk-signature-storage-curve25519-key
        this.deviceDoNotUseKey = e2eKeys.ed25519;
        log(`init: deviceCurve25519Key: ${this.deviceCurve25519Key}, fallbackKey ${JSON.stringify(this.fallbackKey)}`);
    }
    async initializeAccount(account) {
        try {
            const pickledAccount = await this.cryptoStore.getAccount();
            account.unpickle(this.pickleKey, pickledAccount);
        }
        catch {
            account.create();
            const pickledAccount = account.pickle(this.pickleKey);
            await this.cryptoStore.storeAccount(pickledAccount);
        }
    }
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
    async getAccount() {
        const pickledAccount = await this.cryptoStore.getAccount();
        const account = this.delegate.createAccount();
        account.unpickle(this.pickleKey, pickledAccount);
        return account;
    }
    /**
     * Saves an account to the crypto store.
     * This function requires a live transaction object from cryptoStore.doTxn()
     * and therefore may only be called in a doTxn() callback.
     *
     * @param txn - Opaque transaction object from cryptoStore.doTxn()
     * @param Account object
     * @internal
     */
    async storeAccount(account) {
        await this.cryptoStore.storeAccount(account.pickle(this.pickleKey));
    }
    /**
     * get an OlmUtility and call the given function
     *
     * @returns result of func
     * @internal
     */
    getUtility(func) {
        const utility = this.delegate.createUtility();
        try {
            return func(utility);
        }
        finally {
            utility.free();
        }
    }
    /**
     * Signs a message with the ed25519 key for this account.
     *
     * @param message -  message to be signed
     * @returns base64-encoded signature
     */
    async sign(message) {
        const account = await this.getAccount();
        return account.sign(message);
    }
    /**
     * Marks all of the fallback keys as published.
     */
    async markKeysAsPublished() {
        const account = await this.getAccount();
        account.mark_keys_as_published();
        await this.storeAccount(account);
    }
    /**
     * Generate a new fallback keys
     *
     * @returns Resolved once the account is saved back having generated the key
     */
    async generateFallbackKeyIfNeeded() {
        try {
            await this.getFallbackKey();
        }
        catch {
            const account = await this.getAccount();
            account.generate_fallback_key();
            await this.storeAccount(account);
        }
    }
    async getFallbackKey() {
        const account = await this.getAccount();
        const record = JSON.parse(account.unpublished_fallback_key());
        const key = Object.values(record.curve25519)[0];
        const keyId = Object.keys(record.curve25519)[0];
        if (!key || !keyId) {
            throw new Error('No fallback key');
        }
        return { key, keyId };
    }
    async forgetOldFallbackKey() {
        const account = await this.getAccount();
        account.forget_old_fallback_key();
        await this.storeAccount(account);
    }
    // Outbound group session
    // ======================
    /**
     * Store an OutboundGroupSession in outboundSessionStore
     *
     */
    async saveOutboundGroupSession(session, streamId) {
        return this.cryptoStore.withGroupSessions(async () => {
            await this.cryptoStore.storeEndToEndOutboundGroupSession(session.session_id(), session.pickle(this.pickleKey), streamId);
        });
    }
    /**
     * Extract OutboundGroupSession from the session store and call given fn.
     */
    async getOutboundGroupSession(streamId) {
        return this.cryptoStore.withGroupSessions(async () => {
            const pickled = await this.cryptoStore.getEndToEndOutboundGroupSession(streamId);
            if (!pickled) {
                throw new Error(`Unknown outbound group session ${streamId}`);
            }
            const session = this.delegate.createOutboundGroupSession();
            session.unpickle(this.pickleKey, pickled);
            return session;
        });
    }
    /**
     * Get the session keys for an outbound group session
     *
     * @param sessionId -  the id of the outbound group session
     *
     * @returns current chain index, and
     *     base64-encoded secret key.
     */
    async getOutboundGroupSessionKey(streamId) {
        const session = await this.getOutboundGroupSession(streamId);
        const chain_index = session.message_index();
        const key = session.session_key();
        session.free();
        return { chain_index, key };
    }
    /**
     * Generate a new outbound group session
     *
     */
    async createOutboundGroupSession(streamId) {
        return await this.cryptoStore.withGroupSessions(async () => {
            // Create an outbound group session
            const session = this.delegate.createOutboundGroupSession();
            const inboundSession = this.delegate.createInboundGroupSession();
            try {
                session.create();
                const sessionId = session.session_id();
                await this.saveOutboundGroupSession(session, streamId);
                // While still inside the transaction, create an inbound counterpart session
                // to make sure that the session is exported at message index 0.
                const key = session.session_key();
                inboundSession.create(key);
                const pickled = inboundSession.pickle(this.pickleKey);
                await this.cryptoStore.storeEndToEndInboundGroupSession(streamId, sessionId, {
                    session: pickled,
                    stream_id: streamId,
                    keysClaimed: {},
                });
                return sessionId;
            }
            catch (e) {
                log('Error creating outbound group session', e);
                throw e;
            }
            finally {
                session.free();
                inboundSession.free();
            }
        });
    }
    // Inbound group session
    // =====================
    /**
     * Unpickle a session from a sessionData object and invoke the given function.
     * The session is valid only until func returns.
     *
     * @param sessionData - Object describing the session.
     * @param func - Invoked with the unpickled session
     * @returns result of func
     */
    unpickleInboundGroupSession(sessionData) {
        const session = this.delegate.createInboundGroupSession();
        session.unpickle(this.pickleKey, sessionData.session);
        return session;
    }
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
    async getInboundGroupSession(streamId, sessionId) {
        const sessionInfo = await this.cryptoStore.getEndToEndInboundGroupSession(streamId, sessionId);
        const session = sessionInfo ? this.unpickleInboundGroupSession(sessionInfo) : undefined;
        return {
            session: session,
            data: sessionInfo,
        };
    }
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
    async addInboundGroupSession(streamId, sessionId, sessionKey, keysClaimed, _exportFormat, extraSessionData = {}) {
        const { session: existingSession, data: existingSessionData } = await this.getInboundGroupSession(streamId, sessionId);
        const session = this.delegate.createInboundGroupSession();
        try {
            log(`Adding group session ${streamId}|${sessionId}`);
            try {
                session.import_session(sessionKey);
            }
            catch {
                session.create(sessionKey);
            }
            if (sessionId != session.session_id()) {
                throw new Error('Mismatched group session ID from streamId: ' + streamId);
            }
            if (existingSession && existingSessionData) {
                log(`Update for group session ${streamId}|${sessionId}`);
                if (existingSession.first_known_index() <= session.first_known_index()) {
                    if (!existingSessionData.untrusted || extraSessionData.untrusted) {
                        // existing session has less-than-or-equal index
                        // (i.e. can decrypt at least as much), and the
                        // new session's trust does not win over the old
                        // session's trust, so keep it
                        log(`Keeping existing group session ${streamId}|${sessionId}`);
                        return;
                    }
                    if (existingSession.first_known_index() < session.first_known_index()) {
                        // We want to upgrade the existing session's trust,
                        // but we can't just use the new session because we'll
                        // lose the lower index. Check that the sessions connect
                        // properly, and then manually set the existing session
                        // as trusted.
                        if (existingSession.export_session(session.first_known_index()) ===
                            session.export_session(session.first_known_index())) {
                            log('Upgrading trust of existing group session ' +
                                `${streamId}|${sessionId} based on newly-received trusted session`);
                            existingSessionData.untrusted = false;
                            await this.cryptoStore.storeEndToEndInboundGroupSession(streamId, sessionId, existingSessionData);
                        }
                        else {
                            log(`Newly-received group session ${streamId}|$sessionId}` +
                                ' does not match existing session! Keeping existing session');
                        }
                        return;
                    }
                    // If the sessions have the same index, go ahead and store the new trusted one.
                }
            }
            log(`Storing group session ${streamId}|${sessionId} with first index ${session.first_known_index()}`);
            const sessionData = Object.assign({}, extraSessionData, {
                stream_id: streamId,
                session: session.pickle(this.pickleKey),
                keysClaimed: keysClaimed,
            });
            await this.cryptoStore.storeEndToEndInboundGroupSession(streamId, sessionId, sessionData);
        }
        finally {
            session.free();
        }
    }
    /**
     * Encrypt an outgoing message with an outbound group session
     *
     * @param sessionId - this id of the session
     * @param payloadString - payload to be encrypted
     *
     * @returns ciphertext
     */
    async encryptGroupMessage(payloadString, streamId) {
        return await this.cryptoStore.withGroupSessions(async () => {
            log(`encrypting msg with group session for stream id ${streamId}`);
            checkPayloadLength(payloadString);
            const session = await this.getOutboundGroupSession(streamId);
            const ciphertext = session.encrypt(payloadString);
            const sessionId = session.session_id();
            await this.saveOutboundGroupSession(session, streamId);
            session.free();
            return { ciphertext, sessionId };
        });
    }
    async encryptUsingFallbackKey(theirIdentityKey, fallbackKey, payload) {
        checkPayloadLength(payload);
        return this.cryptoStore.withAccountTx(async () => {
            const session = this.delegate.createSession();
            try {
                const account = await this.getAccount();
                session.create_outbound(account, theirIdentityKey, fallbackKey);
                const result = session.encrypt(payload);
                return result;
            }
            catch (error) {
                log('Error encrypting message with fallback key', error);
                throw error;
            }
            finally {
                session.free();
            }
        });
    }
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
    async decryptMessage(ciphertext, theirDeviceIdentityKey, messageType = 0) {
        if (messageType !== 0) {
            throw new Error('Only pre-key messages supported');
        }
        checkPayloadLength(ciphertext);
        return await this.cryptoStore.withAccountTx(async () => {
            const account = await this.getAccount();
            const session = this.delegate.createSession();
            const sessionDesc = session.describe();
            log('Session ID ' +
                session.session_id() +
                ' from ' +
                theirDeviceIdentityKey +
                ': ' +
                sessionDesc);
            try {
                session.create_inbound_from(account, theirDeviceIdentityKey, ciphertext);
                await this.storeAccount(account);
                return session.decrypt(messageType, ciphertext);
            }
            catch (e) {
                throw new Error('Error decrypting prekey message: ' + JSON.stringify(e.message));
            }
            finally {
                session.free();
            }
        });
    }
    // Utilities
    // =========
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
    verifySignature(key, message, signature) {
        this.getUtility(function (util) {
            util.ed25519_verify(key, message, signature);
        });
    }
    // Group Sessions
    async getInboundGroupSessionIds(streamId) {
        return await this.cryptoStore.getInboundGroupSessionIds(streamId);
    }
    /**
     * Determine if we have the keys for a given group session
     *
     * @param streamId - stream in which the message was received
     * @param senderKey - base64-encoded curve25519 key of the sender
     * @param sessionId - session identifier
     */
    async hasInboundSessionKeys(streamId, sessionId) {
        const sessionData = await this.cryptoStore.withGroupSessions(async () => {
            return this.cryptoStore.getEndToEndInboundGroupSession(streamId, sessionId);
        });
        if (!sessionData) {
            return false;
        }
        if (streamId !== sessionData.stream_id) {
            log(`[hasInboundSessionKey]: requested keys for inbound group session` +
                `${sessionId}, with incorrect stream id ` +
                `(expected ${sessionData.stream_id}, ` +
                `was ${streamId})`);
            return false;
        }
        else {
            return true;
        }
    }
    /**
     * Export an inbound group session
     *
     * @param streamId - streamId of session
     * @param sessionId  - session identifier
     * @param sessionData - the session object from the store
     */
    async exportInboundGroupSession(streamId, sessionId) {
        const sessionData = await this.cryptoStore.getEndToEndInboundGroupSession(streamId, sessionId);
        if (!sessionData) {
            return undefined;
        }
        const session = this.unpickleInboundGroupSession(sessionData);
        const messageIndex = session.first_known_index();
        const sessionKey = session.export_session(messageIndex);
        session.free();
        return {
            streamId: streamId,
            sessionId: sessionId,
            sessionKey: sessionKey,
            algorithm: GROUP_ENCRYPTION_ALGORITHM,
        };
    }
}
//# sourceMappingURL=encryptionDevice.js.map
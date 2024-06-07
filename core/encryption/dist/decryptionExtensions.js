import { SessionKeys, } from '@river-build/proto';
import { shortenHexString, dlog, dlogError, check, bin_toHexString, } from '@river-build/dlog';
import { GROUP_ENCRYPTION_ALGORITHM } from './olmLib';
export var DecryptionStatus;
(function (DecryptionStatus) {
    DecryptionStatus["initializing"] = "initializing";
    DecryptionStatus["updating"] = "updating";
    DecryptionStatus["processingNewGroupSessions"] = "processingNewGroupSessions";
    DecryptionStatus["decryptingEvents"] = "decryptingEvents";
    DecryptionStatus["retryingDecryption"] = "retryingDecryption";
    DecryptionStatus["requestingKeys"] = "requestingKeys";
    DecryptionStatus["respondingToKeyRequests"] = "respondingToKeyRequests";
    DecryptionStatus["idle"] = "idle";
})(DecryptionStatus || (DecryptionStatus = {}));
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
export class BaseDecryptionExtensions {
    _status = DecryptionStatus.initializing;
    queues = {
        priorityTasks: new Array(),
        newGroupSession: new Array(),
        encryptedContent: new Array(),
        decryptionRetries: new Array(),
        missingKeys: new Array(),
        keySolicitations: new Array(),
    };
    upToDateStreams = new Set();
    highPriorityStreams = new Set();
    decryptionFailures = {}; // streamId: sessionId: EncryptedContentItem[]
    inProgressTick;
    timeoutId;
    delayMs = 15;
    started = false;
    emitter;
    _onStopFn;
    log;
    crypto;
    entitlementDelegate;
    userDevice;
    userId;
    constructor(emitter, crypto, entitlementDelegate, userDevice, userId, upToDateStreams) {
        this.emitter = emitter;
        this.crypto = crypto;
        this.entitlementDelegate = entitlementDelegate;
        this.userDevice = userDevice;
        this.userId = userId;
        // initialize with a set of up-to-date streams
        // ready for processing
        this.upToDateStreams = upToDateStreams;
        const logId = generateLogId(userId, userDevice.deviceKey);
        this.log = {
            debug: dlog('csb:decryption:debug', { defaultEnabled: false }).extend(logId),
            info: dlog('csb:decryption').extend(logId),
            error: dlogError('csb:decryption:error').extend(logId),
        };
        this.log.debug('new DecryptionExtensions', { userDevice });
    }
    enqueueNewGroupSessions(sessions, _senderId) {
        this.queues.newGroupSession.push(sessions);
        this.checkStartTicking();
    }
    enqueueNewEncryptedContent(streamId, eventId, kind, // kind of encrypted data
    encryptedData) {
        this.queues.encryptedContent.push({
            streamId,
            eventId,
            kind,
            encryptedData,
        });
        this.checkStartTicking();
    }
    enqueueKeySolicitation(streamId, fromUserId, fromUserAddress, keySolicitation) {
        if (keySolicitation.deviceKey === this.userDevice.deviceKey) {
            this.log.debug('ignoring key solicitation for our own device');
            return;
        }
        const index = this.queues.keySolicitations.findIndex((x) => x.streamId === streamId && x.solicitation.deviceKey === keySolicitation.deviceKey);
        if (index > -1) {
            this.queues.keySolicitations.splice(index, 1);
        }
        if (keySolicitation.sessionIds.length > 0 || keySolicitation.isNewDevice) {
            this.log.debug('new key solicitation', keySolicitation);
            insertSorted(this.queues.keySolicitations, {
                streamId,
                fromUserId,
                fromUserAddress,
                solicitation: keySolicitation,
                respondAfter: new Date(Date.now() + this.getRespondDelayMSForKeySolicitation(streamId, fromUserId)),
            }, (x) => x.respondAfter);
            this.checkStartTicking();
        }
        else if (index > -1) {
            this.log.debug('cleared key solicitation', keySolicitation);
        }
    }
    setStreamUpToDate(streamId) {
        this.log.debug('streamUpToDate', streamId);
        this.upToDateStreams.add(streamId);
        this.checkStartTicking();
    }
    retryDecryptionFailures(streamId) {
        removeItem(this.queues.missingKeys, (x) => x.streamId === streamId);
        if (this.decryptionFailures[streamId] &&
            Object.keys(this.decryptionFailures[streamId]).length > 0) {
            this.log.info('membership change, re-enqueuing decryption failures for stream', streamId);
            insertSorted(this.queues.missingKeys, { streamId, waitUntil: new Date(Date.now() + 100) }, (x) => x.waitUntil);
            this.checkStartTicking();
        }
    }
    start() {
        check(!this.started, 'start() called twice, please re-instantiate instead');
        this.log.debug('starting');
        this.started = true;
        // let the subclass override and do any custom startup tasks
        this.onStart();
        // enqueue a task to upload device keys
        this.queues.priorityTasks.push(() => this.uploadDeviceKeys());
        // enqueue a task to download new to-device messages
        this.queues.priorityTasks.push(() => this.downloadNewMessages());
        // start the tick loop
        this.checkStartTicking();
    }
    onStart() {
        // let the subclass override and do any custom startup tasks
    }
    async stop() {
        this._onStopFn?.();
        this._onStopFn = undefined;
        // let the subclass override and do any custom shutdown tasks
        await this.onStop();
        await this.stopTicking();
    }
    onStop() {
        // let the subclass override and do any custom shutdown tasks
        return Promise.resolve();
    }
    getSizeOfEncryptedСontentQueue() {
        return this.queues.encryptedContent.length;
    }
    get status() {
        return this._status;
    }
    setStatus(status) {
        if (this._status !== status) {
            this.log.info(`status changed ${status}`);
            this._status = status;
            this.emitter.emit('decryptionExtStatusChanged', status);
        }
    }
    checkStartTicking() {
        if (!this.started ||
            this.timeoutId ||
            !this._onStopFn ||
            !this.isUserInboxStreamUpToDate(this.upToDateStreams) ||
            this.shouldPauseTicking()) {
            return;
        }
        if (!Object.values(this.queues).find((q) => q.length > 0)) {
            this.setStatus(DecryptionStatus.idle);
            return;
        }
        this.timeoutId = setTimeout(() => {
            this.inProgressTick = this.tick();
            this.inProgressTick
                .catch((e) => this.log.error('ProcessTick Error', e))
                .finally(() => {
                this.timeoutId = undefined;
                this.checkStartTicking();
            });
        }, this.getDelayMs());
    }
    async stopTicking() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
        if (this.inProgressTick) {
            try {
                await this.inProgressTick;
            }
            catch (e) {
                this.log.error('ProcessTick Error while stopping', e);
            }
            finally {
                this.inProgressTick = undefined;
            }
        }
    }
    getDelayMs() {
        if (this.queues.newGroupSession.length > 0) {
            return 0;
        }
        else {
            return this.delayMs;
        }
    }
    // just do one thing then return
    tick() {
        const now = new Date();
        const priorityTask = this.queues.priorityTasks.shift();
        if (priorityTask) {
            this.setStatus(DecryptionStatus.updating);
            return priorityTask();
        }
        const session = this.queues.newGroupSession.shift();
        if (session) {
            this.setStatus(DecryptionStatus.processingNewGroupSessions);
            return this.processNewGroupSession(session);
        }
        const encryptedContent = dequeueHighPriority(this.queues.encryptedContent, this.highPriorityStreams);
        if (encryptedContent) {
            this.setStatus(DecryptionStatus.decryptingEvents);
            return this.processEncryptedContentItem(encryptedContent);
        }
        const decryptionRetry = dequeueUpToDate(this.queues.decryptionRetries, now, (x) => x.retryAt, this.upToDateStreams);
        if (decryptionRetry) {
            this.setStatus(DecryptionStatus.retryingDecryption);
            return this.processDecryptionRetry(decryptionRetry);
        }
        const missingKeys = dequeueUpToDate(this.queues.missingKeys, now, (x) => x.waitUntil, this.upToDateStreams);
        if (missingKeys) {
            this.setStatus(DecryptionStatus.requestingKeys);
            return this.processMissingKeys(missingKeys);
        }
        const keySolicitation = dequeueUpToDate(this.queues.keySolicitations, now, (x) => x.respondAfter, this.upToDateStreams);
        if (keySolicitation) {
            this.setStatus(DecryptionStatus.respondingToKeyRequests);
            return this.processKeySolicitation(keySolicitation);
        }
        this.setStatus(DecryptionStatus.idle);
        return Promise.resolve();
    }
    /**
     * processNewGroupSession
     * process new group sessions that were sent to our to device stream inbox
     * re-enqueue any decryption failures with matching session id
     */
    async processNewGroupSession(session) {
        this.log.debug('processNewGroupSession', session);
        // check if this message is to our device
        const ciphertext = session.ciphertexts[this.userDevice.deviceKey];
        if (!ciphertext) {
            this.log.debug('skipping, no session for our device');
            return;
        }
        const streamId = bin_toHexString(session.streamId);
        // check if it contains any keys we need
        const neededKeyIndexs = [];
        for (let i = 0; i < session.sessionIds.length; i++) {
            const sessionId = session.sessionIds[i];
            const hasKeys = await this.crypto.encryptionDevice.hasInboundSessionKeys(streamId, sessionId);
            if (!hasKeys) {
                neededKeyIndexs.push(i);
            }
        }
        if (!neededKeyIndexs.length) {
            this.log.debug('skipping, we have all the keys');
            return;
        }
        // decrypt the message
        const cleartext = await this.crypto.decryptWithDeviceKey(ciphertext, session.senderKey);
        const sessionKeys = SessionKeys.fromJsonString(cleartext);
        check(sessionKeys.keys.length === session.sessionIds.length, 'bad sessionKeys');
        // make group sessions
        const sessions = neededKeyIndexs.map((i) => ({
            streamId: streamId,
            sessionId: session.sessionIds[i],
            sessionKey: sessionKeys.keys[i],
            algorithm: GROUP_ENCRYPTION_ALGORITHM,
        }));
        // import the sessions
        this.log.info('importing group sessions streamId:', session.streamId, 'count: ', sessions.length);
        await this.crypto.importSessionKeys(streamId, sessions);
        // re-enqueue any decryption failures with these ids
        for (const session of sessions) {
            if (this.decryptionFailures[streamId]?.[session.sessionId]) {
                this.queues.encryptedContent.push(...this.decryptionFailures[streamId][session.sessionId]);
                delete this.decryptionFailures[streamId][session.sessionId];
            }
        }
        // if we processed them all, ack the stream
        if (this.queues.newGroupSession.length === 0) {
            await this.ackNewGroupSession(session);
        }
    }
    /**
     * processEncryptedContentItem
     * try to decrypt encrytped content
     */
    async processEncryptedContentItem(item) {
        this.log.debug('processEncryptedContentItem', item);
        try {
            // do the work to decrypt the event
            this.log.debug('decrypting content');
            await this.decryptGroupEvent(item.streamId, item.eventId, item.kind, item.encryptedData);
        }
        catch (err) {
            const sessionNotFound = isSessionNotFoundError(err);
            this.log.debug('failed to decrypt', err, 'sessionNotFound', sessionNotFound);
            // If !sessionNotFound, we want to know more about this error.
            if (!sessionNotFound) {
                this.log.info('failed to decrypt', err, 'streamId', item.streamId);
            }
            this.onDecryptionError(item, {
                missingSession: sessionNotFound,
                kind: item.kind,
                encryptedData: item.encryptedData,
                error: err,
            });
            insertSorted(this.queues.decryptionRetries, {
                streamId: item.streamId,
                event: item,
                retryAt: new Date(Date.now() + 3000), // give it 3 seconds, maybe someone will send us the key
            }, (x) => x.retryAt);
        }
    }
    /**
     * processDecryptionRetry
     * retry decryption a second time for a failed decryption, keys may have arrived
     */
    async processDecryptionRetry(retryItem) {
        const item = retryItem.event;
        try {
            this.log.debug('retrying decryption', item);
            await this.decryptGroupEvent(item.streamId, item.eventId, item.kind, item.encryptedData);
        }
        catch (err) {
            const sessionNotFound = isSessionNotFoundError(err);
            this.log.info('failed to decrypt on retry', err, 'sessionNotFound', sessionNotFound);
            this.onDecryptionError(item, {
                missingSession: sessionNotFound,
                kind: item.kind,
                encryptedData: item.encryptedData,
                error: err,
            });
            if (sessionNotFound) {
                const streamId = item.streamId;
                const sessionId = item.encryptedData.sessionId;
                if (!this.decryptionFailures[streamId]) {
                    this.decryptionFailures[streamId] = { [sessionId]: [item] };
                }
                else if (!this.decryptionFailures[streamId][sessionId]) {
                    this.decryptionFailures[streamId][sessionId] = [item];
                }
                else if (!this.decryptionFailures[streamId][sessionId].includes(item)) {
                    this.decryptionFailures[streamId][sessionId].push(item);
                }
                removeItem(this.queues.missingKeys, (x) => x.streamId === streamId);
                insertSorted(this.queues.missingKeys, { streamId, waitUntil: new Date(Date.now() + 1000) }, (x) => x.waitUntil);
            }
        }
    }
    /**
     * processMissingKeys
     * process missing keys and send key solicitations to streams
     */
    async processMissingKeys(item) {
        this.log.debug('processing missing keys', item);
        const streamId = item.streamId;
        const missingSessionIds = takeFirst(100, Object.keys(this.decryptionFailures[streamId] ?? {}).sort());
        // limit to 100 keys for now todo revisit https://linear.app/hnt-labs/issue/HNT-3936/revisit-how-we-limit-the-number-of-session-ids-that-we-request
        if (!missingSessionIds.length) {
            this.log.debug('processing missing keys', item.streamId, 'no missing keys');
            return;
        }
        if (!this.hasStream(streamId)) {
            this.log.debug('processing missing keys', item.streamId, 'stream not found');
            return;
        }
        const isEntitled = await this.isUserEntitledToKeyExchange(streamId, this.userId, {
            skipOnChainValidation: true,
        });
        if (!isEntitled) {
            this.log.debug('processing missing keys', item.streamId, 'user is not member of stream');
            return;
        }
        const solicitedEvents = this.getKeySolicitations(streamId);
        const existingKeyRequest = solicitedEvents.find((x) => x.deviceKey === this.userDevice.deviceKey);
        if (existingKeyRequest?.isNewDevice ||
            sortedArraysEqual(existingKeyRequest?.sessionIds ?? [], missingSessionIds)) {
            this.log.debug('processing missing keys already requested keys for this session', existingKeyRequest);
            return;
        }
        const knownSessionIds = (await this.crypto.encryptionDevice.getInboundGroupSessionIds(streamId)) ?? [];
        const isNewDevice = knownSessionIds.length === 0;
        this.log.info('requesting keys', item.streamId, 'isNewDevice', isNewDevice, 'sessionIds:', missingSessionIds.length);
        await this.sendKeySolicitation({
            streamId,
            isNewDevice,
            missingSessionIds,
        });
    }
    /**
     * processKeySolicitation
     * process incoming key solicitations and send keys and key fulfilments
     */
    async processKeySolicitation(item) {
        this.log.debug('processing key solicitation', item.streamId, item);
        const streamId = item.streamId;
        check(this.hasStream(streamId), 'stream not found');
        const knownSessionIds = (await this.crypto.encryptionDevice.getInboundGroupSessionIds(streamId)) ?? [];
        knownSessionIds.sort();
        const requestedSessionIds = new Set(item.solicitation.sessionIds.sort());
        const replySessionIds = item.solicitation.isNewDevice
            ? knownSessionIds
            : knownSessionIds.filter((x) => requestedSessionIds.has(x));
        if (replySessionIds.length === 0) {
            this.log.debug('processing key solicitation: no keys to reply with');
            return;
        }
        const isUserEntitledToKeyExchange = await this.isUserEntitledToKeyExchange(streamId, item.fromUserId);
        if (!isUserEntitledToKeyExchange) {
            return;
        }
        const sessions = [];
        for (const sessionId of replySessionIds) {
            const groupSession = await this.crypto.encryptionDevice.exportInboundGroupSession(streamId, sessionId);
            if (groupSession) {
                sessions.push(groupSession);
            }
        }
        this.log.debug('processing key solicitation with', item.streamId, {
            to: item.fromUserId,
            toDevice: item.solicitation.deviceKey,
            requestedCount: item.solicitation.sessionIds.length,
            replyIds: replySessionIds.length,
            sessions: sessions.length,
        });
        if (sessions.length === 0) {
            return;
        }
        await this.sendKeyFulfillment({
            streamId,
            userAddress: item.fromUserAddress,
            deviceKey: item.solicitation.deviceKey,
            sessionIds: item.solicitation.isNewDevice ? [] : sessions.map((x) => x.sessionId),
        });
        await this.encryptAndShareGroupSessions({
            streamId,
            item,
            sessions,
        });
    }
    /**
     * can be overridden to add a delay to the key solicitation response
     */
    getRespondDelayMSForKeySolicitation(_streamId, _userId) {
        return 0;
    }
    setHighPriorityStreams(streamIds) {
        this.highPriorityStreams = new Set(streamIds);
    }
}
export function makeSessionKeys(sessions) {
    const sessionKeys = sessions.map((s) => s.sessionKey);
    return new SessionKeys({
        keys: sessionKeys,
    });
}
// Insert an item into a sorted array
// maintain the sort order
// optimize for the case where the new item is the largest
function insertSorted(items, newItem, dateFn) {
    let position = items.length;
    // Iterate backwards to find the correct position
    for (let i = items.length - 1; i >= 0; i--) {
        if (dateFn(items[i]) <= dateFn(newItem)) {
            position = i + 1;
            break;
        }
    }
    // Insert the item at the correct position
    items.splice(position, 0, newItem);
}
/// Returns the first item from the array,
/// if dateFn is provided, returns the first item where dateFn(item) <= now
function dequeueUpToDate(items, now, dateFn, upToDateStreams) {
    if (items.length === 0) {
        return undefined;
    }
    if (dateFn(items[0]) > now) {
        return undefined;
    }
    const index = items.findIndex((x) => dateFn(x) <= now && upToDateStreams.has(x.streamId));
    if (index === -1) {
        return undefined;
    }
    return items.splice(index, 1)[0];
}
function dequeueHighPriority(items, highPriorityIds) {
    const index = items.findIndex((x) => highPriorityIds.has(x.streamId));
    if (index === -1) {
        return items.shift();
    }
    return items.splice(index, 1)[0];
}
function removeItem(items, predicate) {
    const index = items.findIndex(predicate);
    if (index !== -1) {
        items.splice(index, 1);
    }
}
function sortedArraysEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
function takeFirst(count, array) {
    const result = [];
    for (let i = 0; i < count && i < array.length; i++) {
        result.push(array[i]);
    }
    return result;
}
function isSessionNotFoundError(err) {
    if (err !== null && typeof err === 'object' && 'message' in err) {
        return err.message.includes('Session not found');
    }
    return false;
}
function generateLogId(userId, deviceKey) {
    const shortId = shortenHexString(userId.startsWith('0x') ? userId.slice(2) : userId);
    const shortKey = shortenHexString(deviceKey);
    const logId = `${shortId}:${shortKey}`;
    return logId;
}
//# sourceMappingURL=decryptionExtensions.js.map
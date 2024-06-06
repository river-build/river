import { BaseDecryptionExtensions, DecryptionStatus, makeSessionKeys, } from '../decryptionExtensions';
import { UserInboxPayload_GroupEncryptionSessions, } from '@river-build/proto';
import { bin_fromHexString, bin_toHexString, dlog } from '@river-build/dlog';
import { CryptoStore } from '../cryptoStore';
import EventEmitter from 'events';
import { GroupEncryptionCrypto } from '../groupEncryptionCrypto';
import { customAlphabet } from 'nanoid';
const log = dlog('test:decryptionExtensions:');
describe('TestDecryptionExtensions', () => {
    test('should be able to make key solicitation request', async () => {
        // arrange
        const clientDiscoveryService = {};
        const streamId = genStreamId();
        const alice = genUserId('Alice');
        const aliceUserAddress = stringToArray(alice);
        const bob = genUserId('Bob');
        const bobsPlaintext = "bob's plaintext";
        const { client: aliceClient, decryptionExtension: aliceDex } = await createCryptoMocks(alice, clientDiscoveryService);
        const { crypto: bobCrypto, decryptionExtension: bobDex } = await createCryptoMocks(bob, clientDiscoveryService);
        // act
        aliceDex.start();
        // bob starts the decryption extension
        bobDex.start();
        // bob encrypts a message
        const encryptedData = await bobCrypto.encryptGroupEvent(streamId, bobsPlaintext);
        const sessionId = encryptedData.sessionId;
        // alice doesn't have the session key
        // alice sends a key solicitation request
        const keySolicitationData = {
            deviceKey: aliceDex.userDevice.deviceKey,
            fallbackKey: aliceDex.userDevice.fallbackKey,
            isNewDevice: true,
            sessionIds: [sessionId],
        };
        const keySolicitation = aliceClient.sendKeySolicitation(keySolicitationData);
        // pretend bob receives a key solicitation request from alice, and starts processing it.
        await bobDex.handleKeySolicitationRequest(streamId, alice, aliceUserAddress, keySolicitationData);
        // alice waits for the response
        await keySolicitation;
        // after alice gets the session key,
        // try to decrypt the message
        const decrypted = await aliceDex.crypto.decryptGroupEvent(streamId, encryptedData);
        // stop the decryption extensions
        await bobDex.stop();
        await aliceDex.stop();
        // assert
        expect(decrypted).toBe(bobsPlaintext);
        expect(bobDex.seenStates).toContain(DecryptionStatus.respondingToKeyRequests);
        expect(aliceDex.seenStates).toContain(DecryptionStatus.processingNewGroupSessions);
    });
});
async function createCryptoMocks(userId, clientDiscoveryService) {
    const cryptoStore = new CryptoStore(`db_${userId}`, userId);
    const entitlementDelegate = new MockEntitlementsDelegate();
    const client = new MockGroupEncryptionClient(clientDiscoveryService);
    const crypto = new GroupEncryptionCrypto(client, cryptoStore);
    await crypto.init();
    const userDevice = {
        deviceKey: crypto.encryptionDevice.deviceCurve25519Key,
        fallbackKey: crypto.encryptionDevice.fallbackKey.key,
    };
    const decryptionExtension = new MockDecryptionExtensions(userId, crypto, entitlementDelegate, userDevice, client);
    client.crypto = crypto;
    client.decryptionExtensions = decryptionExtension;
    clientDiscoveryService[userDevice.deviceKey] = client;
    return {
        client,
        crypto,
        cryptoStore,
        decryptionExtension,
        userDevice,
    };
}
class MicroTask {
    resolve;
    startState;
    endState;
    isStarted = false;
    _isCompleted = false;
    constructor(resolve, startState, endState) {
        this.resolve = resolve;
        this.startState = startState;
        this.endState = endState;
    }
    get isCompleted() {
        return this.isCompleted;
    }
    tick(state) {
        if (state === this.startState) {
            this.isStarted = true;
        }
        if (this.isStarted && state === this.endState) {
            this.resolve();
            this._isCompleted;
        }
    }
}
class MockDecryptionExtensions extends BaseDecryptionExtensions {
    inProgress = {};
    client;
    _upToDateStreams;
    constructor(userId, crypto, entitlementDelegate, userDevice, client) {
        const upToDateStreams = new Set();
        super(client, crypto, entitlementDelegate, userDevice, userId, upToDateStreams);
        this._upToDateStreams = upToDateStreams;
        this.client = client;
        this._onStopFn = () => {
            log('onStopFn');
        };
        client.on('decryptionExtStatusChanged', () => {
            this.statusChangedTick();
        });
    }
    seenStates = [];
    shouldPauseTicking() {
        return false;
    }
    newGroupSessions(sessions, senderId) {
        log('newGroupSessions', sessions, senderId);
        const streamId = bin_toHexString(sessions.streamId);
        this.markStreamUpToDate(streamId);
        const p = new Promise((resolve) => {
            this.inProgress[streamId] = new MicroTask(resolve, DecryptionStatus.processingNewGroupSessions, DecryptionStatus.idle);
            // start processing the new sessions
            this.enqueueNewGroupSessions(sessions, senderId);
        });
        return p;
    }
    ackNewGroupSession(session) {
        log('newGroupSessionsDone', session.streamId);
        return Promise.resolve();
    }
    async handleKeySolicitationRequest(streamId, fromUserId, fromUserAddress, keySolicitation) {
        log('keySolicitationRequest', streamId, keySolicitation);
        this.markStreamUpToDate(streamId);
        const p = new Promise((resolve) => {
            this.inProgress[streamId] = new MicroTask(resolve, DecryptionStatus.respondingToKeyRequests, DecryptionStatus.idle);
            // start processing the request
            this.enqueueKeySolicitation(streamId, fromUserId, fromUserAddress, keySolicitation);
        });
        return p;
    }
    hasStream(streamId) {
        log('canProcessStream', streamId, true);
        return this._upToDateStreams.has(streamId);
    }
    decryptGroupEvent(_streamId, _eventId, _kind, _encryptedData) {
        log('decryptGroupEvent');
        return Promise.resolve();
    }
    downloadNewMessages() {
        log('downloadNewMessages');
        return Promise.resolve();
    }
    getKeySolicitations(_streamId) {
        log('getKeySolicitations');
        return [];
    }
    hasUnprocessedSession(_item) {
        log('hasUnprocessedSession');
        return true;
    }
    isUserEntitledToKeyExchange(_streamId, _userId) {
        log('isUserEntitledToKeyExchange');
        return Promise.resolve(true);
    }
    onDecryptionError(_item, _err) {
        log('onDecryptionError', 'item:', _item, 'err:', _err);
    }
    sendKeySolicitation(args) {
        log('sendKeySolicitation', args);
        return Promise.resolve();
    }
    sendKeyFulfillment(args) {
        log('sendKeyFulfillment', args);
        return Promise.resolve({});
    }
    encryptAndShareGroupSessions(args) {
        log('encryptAndSendToGroup');
        return this.client.encryptAndSendMock(args);
    }
    uploadDeviceKeys() {
        log('uploadDeviceKeys');
        return Promise.resolve();
    }
    isUserInboxStreamUpToDate(_upToDateStreams) {
        return true;
    }
    markStreamUpToDate(streamId) {
        this._upToDateStreams.add(streamId);
        this.setStreamUpToDate(streamId);
    }
    statusChangedTick() {
        this.seenStates.push(this.status);
        Object.values(this.inProgress).forEach((t) => {
            t.tick(this.status);
        });
    }
}
class MockGroupEncryptionClient extends EventEmitter {
    clientDiscoveryService;
    shareKeysResponses = {};
    constructor(clientDiscoveryService) {
        super();
        this.clientDiscoveryService = clientDiscoveryService;
    }
    crypto;
    decryptionExtensions;
    get userDevice() {
        return this.crypto
            ? {
                deviceKey: this.crypto.encryptionDevice.deviceCurve25519Key,
                fallbackKey: this.crypto.encryptionDevice.fallbackKey.key,
            }
            : undefined;
    }
    downloadUserDeviceInfo(_userIds, _forceDownload) {
        return Promise.resolve({});
    }
    encryptAndShareGroupSessions(_streamId, _sessions, _devicesInRoom) {
        return Promise.resolve();
    }
    getDevicesInStream(_streamId) {
        return Promise.resolve({});
    }
    sendKeySolicitation(args) {
        // assume the request is sent
        return new Promise((resolve) => {
            // resolve when the response is received
            this.shareKeysResponses[args.deviceKey] = resolve;
        });
    }
    async encryptAndSendMock(args) {
        const { sessions, streamId } = args;
        if (!this.userDevice) {
            throw new Error('no user device');
        }
        // prepare the common parts of the payload
        const streamIdBytes = streamIdToBytes(streamId);
        const sessionIds = sessions.map((s) => s.sessionId);
        const payload = makeSessionKeys(sessions).toJsonString();
        // encrypt and send the payload to each client
        const otherClients = Object.values(this.clientDiscoveryService).filter((c) => c.userDevice?.deviceKey != this.userDevice?.deviceKey);
        const promises = otherClients.map(async (c) => {
            const cipertext = await this.crypto?.encryptWithDeviceKeys(payload, [c.userDevice]);
            const groupSession = new UserInboxPayload_GroupEncryptionSessions({
                streamId: streamIdBytes,
                senderKey: this.userDevice?.deviceKey,
                sessionIds: sessionIds,
                ciphertexts: cipertext,
            });
            // pretend sending the payload to the client
            // ....
            // pretend receiving the response
            // trigger a new group session processing
            await c.decryptionExtensions?.newGroupSessions(groupSession, this.userDevice.deviceKey);
            await c.resolveGroupSessionResponse(args);
        });
        await Promise.all(promises);
    }
    resolveGroupSessionResponse(args) {
        // fake receiving the response
        const resolve = this.shareKeysResponses[args.item.solicitation.deviceKey];
        if (resolve) {
            resolve(args);
        }
        return Promise.resolve();
    }
    sendKeyFulfillment(_args) {
        return Promise.resolve({});
    }
    uploadDeviceKeys() {
        return Promise.resolve();
    }
}
class MockEntitlementsDelegate {
    isEntitled(_spaceId, _channelId, _user, _permission) {
        return Promise.resolve(true);
    }
}
function genUserId(name) {
    return `0x${name}${Date.now()}`;
}
function genStreamId() {
    const hexNanoId = customAlphabet('0123456789abcdef', 64);
    return hexNanoId();
}
function stringToArray(fromString) {
    const uint8Array = new TextEncoder().encode(fromString);
    return uint8Array;
}
function streamIdToBytes(streamId) {
    return bin_fromHexString(streamId);
}
//# sourceMappingURL=decryptionExtensions.test.js.map
import { _impl_makeEvent_impl_, publicKeyToAddress, unpackStreamEnvelopes } from './sign';
import { MembershipOp, SyncOp, } from '@river-build/proto';
import { Client } from './client';
import { genId, makeSpaceStreamId, makeDefaultChannelStreamId, makeUserStreamId, userIdFromAddress, } from './id';
import { getPublicKey, utils } from 'ethereum-cryptography/secp256k1';
import { bin_fromHexString, check, dlog } from '@river-build/dlog';
import { ethers } from 'ethers';
import { RiverDbManager } from './riverDbManager';
import { makeStreamRpcClient } from './makeStreamRpcClient';
import assert from 'assert';
import _ from 'lodash';
import { MockEntitlementsDelegate } from './utils';
import { makeSignerContext } from './signerContext';
import { LocalhostWeb3Provider, createRiverRegistry, } from '@river-build/web3';
import { makeRiverChainConfig } from './riverConfig';
const log = dlog('csb:test:util');
const initTestUrls = async () => {
    const config = makeRiverChainConfig();
    const provider = new LocalhostWeb3Provider(config.rpcUrl);
    const riverRegistry = createRiverRegistry(provider, config.chainConfig);
    const urls = await riverRegistry.getOperationalNodeUrls();
    const refreshNodeUrl = () => riverRegistry.getOperationalNodeUrls();
    log('initTestUrls, RIVER_TEST_CONNECT=', config, 'testUrls=', urls);
    return { testUrls: urls.split(','), refreshNodeUrl };
};
let curTestUrl = -1;
const getNextTestUrl = async () => {
    const { testUrls, refreshNodeUrl } = await initTestUrls();
    if (testUrls.length === 1) {
        log('getNextTestUrl, url=', testUrls[0]);
        return { urls: testUrls[0], refreshNodeUrl };
    }
    else if (testUrls.length > 1) {
        if (curTestUrl < 0) {
            const seed = expect.getState()?.currentTestName;
            if (seed === undefined) {
                curTestUrl = Math.floor(Math.random() * testUrls.length);
                log('getNextTestUrl, setting to random, index=', curTestUrl);
            }
            else {
                curTestUrl =
                    seed
                        .split('')
                        .map((v) => v.charCodeAt(0))
                        .reduce((a, v) => ((a + ((a << 7) + (a << 3))) ^ v) & 0xffff) %
                        testUrls.length;
                log('getNextTestUrl, setting based on test name=', seed, ' index=', curTestUrl);
            }
        }
        curTestUrl = (curTestUrl + 1) % testUrls.length;
        log('getNextTestUrl, url=', testUrls[curTestUrl], 'index=', curTestUrl);
        return { urls: testUrls[curTestUrl], refreshNodeUrl };
    }
    else {
        throw new Error('no test urls');
    }
};
export const makeTestRpcClient = async () => {
    const { urls: url, refreshNodeUrl } = await getNextTestUrl();
    return makeStreamRpcClient(url, undefined, refreshNodeUrl);
};
export const makeEvent_test = async (context, payload, prevMiniblockHash) => {
    return _impl_makeEvent_impl_(context, payload, prevMiniblockHash);
};
export const TEST_ENCRYPTED_MESSAGE_PROPS = {
    sessionId: '',
    ciphertext: '',
    algorithm: '',
    senderKey: '',
};
/**
 * makeUniqueSpaceStreamId - space stream ids are derived from the contract
 * in tests without entitlements there are no contracts, so we use a random id
 */
export const makeUniqueSpaceStreamId = () => {
    return makeSpaceStreamId(genId(40));
};
/**
 *
 * @returns a random user context
 * Done using a worker thread to avoid blocking the main thread
 */
export const makeRandomUserContext = async () => {
    const wallet = ethers.Wallet.createRandom();
    log('makeRandomUserContext', wallet.address);
    return makeUserContextFromWallet(wallet);
};
export const makeRandomUserAddress = () => {
    return publicKeyToAddress(getPublicKey(utils.randomPrivateKey(), false));
};
export const makeUserContextFromWallet = async (wallet) => {
    const userPrimaryWallet = wallet;
    const delegateWallet = ethers.Wallet.createRandom();
    const creatorAddress = publicKeyToAddress(bin_fromHexString(userPrimaryWallet.publicKey));
    log('makeRandomUserContext', userIdFromAddress(creatorAddress));
    return makeSignerContext(userPrimaryWallet, delegateWallet, { days: 1 });
};
export const makeTestClient = async (opts) => {
    const context = opts?.context ?? (await makeRandomUserContext());
    const entitlementsDelegate = opts?.entitlementsDelegate ?? new MockEntitlementsDelegate();
    const deviceId = opts?.deviceId ? `-${opts.deviceId}` : `-${genId(5)}`;
    const userId = userIdFromAddress(context.creatorAddress);
    const dbName = `database-${userId}${deviceId}`;
    const persistenceDbName = `persistence-${userId}${deviceId}`;
    // create a new client with store(s)
    const cryptoStore = RiverDbManager.getCryptoDb(userId, dbName);
    const rpcClient = await makeTestRpcClient();
    return new Client(context, rpcClient, cryptoStore, entitlementsDelegate, persistenceDbName);
};
class DonePromise {
    promise;
    // @ts-ignore: Promise body is executed immediately, so vars are assigned before constructor returns
    resolve;
    // @ts-ignore: Promise body is executed immediately, so vars are assigned before constructor returns
    reject;
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    done() {
        this.resolve('done');
    }
    async wait() {
        return this.promise;
    }
    async expectToSucceed() {
        await expect(this.promise).resolves.toBe('done');
    }
    async expectToFail() {
        await expect(this.promise).rejects.toThrow();
    }
    run(fn) {
        try {
            fn();
        }
        catch (err) {
            this.reject(err);
        }
    }
    runAndDone(fn) {
        try {
            fn();
            this.done();
        }
        catch (err) {
            this.reject(err);
        }
    }
}
export const makeDonePromise = () => {
    return new DonePromise();
};
export const sendFlush = async (client) => {
    const r = await client.info({ debug: ['flush_cache'] });
    assert(r.graffiti === 'cache flushed');
};
export async function* iterableWrapper(iterable) {
    const iterator = iterable[Symbol.asyncIterator]();
    while (true) {
        const result = await iterator.next();
        if (typeof result === 'string') {
            return;
        }
        yield result.value;
    }
}
// For example, use like this:
//
//    joinPayload = lastEventFiltered(
//        unpackStreamEnvelopes(userResponse.stream!),
//        getUserPayload_Membership,
//    )
//
// to get user memebrship payload from a last event containing it, or undefined if not found.
export const lastEventFiltered = (events, f) => {
    let ret = undefined;
    _.forEachRight(events, (v) => {
        const r = f(v);
        if (r !== undefined) {
            ret = r;
            return false;
        }
        return true;
    });
    return ret;
};
// createSpaceAndDefaultChannel creates a space and default channel for a given
// client, on the spaceDapp and the stream node. It creates a user stream, joins
// the user to the space, and starts syncing the client.
export async function createSpaceAndDefaultChannel(client, spaceDapp, wallet, name, membership) {
    const transaction = await spaceDapp.createSpace({
        spaceName: `${name}-space`,
        spaceMetadata: `${name}-space-metadata`,
        channelName: 'general',
        membership,
    }, wallet);
    const receipt = await transaction.wait();
    expect(receipt.status).toEqual(1);
    const spaceAddress = spaceDapp.getSpaceAddress(receipt);
    expect(spaceAddress).toBeDefined();
    const spaceId = makeSpaceStreamId(spaceAddress);
    const channelId = makeDefaultChannelStreamId(spaceAddress);
    await client.initializeUser({ spaceId });
    client.startSync();
    const userStreamId = makeUserStreamId(client.userId);
    const userStreamView = client.stream(userStreamId).view;
    expect(userStreamView).toBeDefined();
    const returnVal = await client.createSpace(spaceId);
    expect(returnVal.streamId).toEqual(spaceId);
    expect(userStreamView.userContent.isMember(spaceId, MembershipOp.SO_JOIN)).toBeTrue();
    const channelReturnVal = await client.createChannel(spaceId, 'general', `${name} general channel properties`, channelId);
    expect(channelReturnVal.streamId).toEqual(channelId);
    expect(userStreamView.userContent.isMember(channelId, MembershipOp.SO_JOIN)).toBeTrue();
    return {
        spaceId,
        defaultChannelId: channelId,
        userStreamView,
    };
}
// createUserStreamAndSyncClient creates a user stream for a given client that
// uses a newly created space as the hint for the user stream, since the stream
// node will not allow the creation of a user stream without a space id.
export async function createUserStreamAndSyncClient(client, spaceDapp, name, membershipInfo, wallet) {
    const transaction = await spaceDapp.createSpace({
        spaceName: `${name}-space`,
        spaceMetadata: `${name}-space-metadata`,
        channelName: 'general',
        membership: membershipInfo,
    }, wallet);
    const receipt = await transaction.wait();
    expect(receipt.status).toEqual(1);
    const spaceAddress = spaceDapp.getSpaceAddress(receipt);
    expect(spaceAddress).toBeDefined();
    const spaceId = makeSpaceStreamId(spaceAddress);
    await client.initializeUser({ spaceId });
}
export async function expectUserCanJoin(spaceId, channelId, name, client, spaceDapp, address, wallet) {
    const joinStart = Date.now();
    const { issued } = await spaceDapp.joinSpace(spaceId, address, wallet);
    expect(issued).toBeTrue();
    log(`${name} joined space ${spaceId}`, Date.now() - joinStart);
    await client.initializeUser({ spaceId });
    client.startSync();
    await expect(client.joinStream(spaceId)).toResolve();
    await expect(client.joinStream(channelId)).toResolve();
    const userStreamView = client.stream(client.userStreamId).view;
    await waitFor(() => {
        expect(userStreamView.userContent.isMember(spaceId, MembershipOp.SO_JOIN)).toBeTrue();
        expect(userStreamView.userContent.isMember(channelId, MembershipOp.SO_JOIN)).toBeTrue();
    });
}
// Hint: pass in the wallets attached to the providers.
export async function linkWallets(rootSpaceDapp, rootWallet, linkedWallet) {
    const walletLink = rootSpaceDapp.getWalletLink();
    let txn;
    try {
        txn = await walletLink.linkWalletToRootKey(rootWallet, linkedWallet);
    }
    catch (err) {
        const parsedError = walletLink.parseError(err);
        log('linkWallets error', parsedError);
    }
    expect(txn).toBeDefined();
    const receipt = await txn?.wait();
    expect(receipt.status).toEqual(1);
}
export function waitFor(callback, options = { timeoutMS: 5000 }) {
    const timeoutContext = new Error('waitFor timed out after ' + options.timeoutMS.toString() + 'ms');
    return new Promise((resolve, reject) => {
        const timeoutMS = options.timeoutMS;
        const pollIntervalMS = Math.min(timeoutMS / 2, 100);
        let lastError = undefined;
        let promiseStatus = 'none';
        const intervalId = setInterval(checkCallback, pollIntervalMS);
        const timeoutId = setInterval(onTimeout, timeoutMS);
        function onDone(result) {
            clearInterval(intervalId);
            clearInterval(timeoutId);
            if (result || promiseStatus === 'resolved') {
                resolve(result);
            }
            else {
                reject(lastError);
            }
        }
        function onTimeout() {
            lastError = lastError ?? timeoutContext;
            onDone();
        }
        function checkCallback() {
            if (promiseStatus === 'pending')
                return;
            try {
                const result = callback();
                if (result && result instanceof Promise) {
                    promiseStatus = 'pending';
                    result.then((res) => {
                        promiseStatus = 'resolved';
                        onDone(res);
                    }, (err) => {
                        promiseStatus = 'rejected';
                        // splat the error to get a stack trace, i don't know why this works
                        lastError = {
                            ...err,
                        };
                    });
                }
                else {
                    promiseStatus = 'resolved';
                    resolve(result);
                }
            }
            catch (err) {
                lastError = err;
            }
        }
    });
}
export async function waitForSyncStreams(syncStreams, matcher) {
    for await (const res of iterableWrapper(syncStreams)) {
        if (await matcher(res)) {
            return res;
        }
    }
    throw new Error('waitFor: timeout');
}
export async function waitForSyncStreamsMessage(syncStreams, message) {
    return waitForSyncStreams(syncStreams, async (res) => {
        if (res.syncOp === SyncOp.SYNC_UPDATE) {
            const stream = res.stream;
            if (stream) {
                const env = await unpackStreamEnvelopes(stream);
                for (const e of env) {
                    if (e.event.payload.case === 'channelPayload') {
                        const p = e.event.payload.value.content;
                        if (p.case === 'message' && p.value.ciphertext === message) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    });
}
export function getChannelMessagePayload(event) {
    if (event?.payload?.case === 'post') {
        if (event.payload.value.content.case === 'text') {
            return event.payload.value.content.value?.body;
        }
    }
    return undefined;
}
export function createEventDecryptedPromise(client, expectedMessageText) {
    const recipientReceivesMessageWithoutError = makeDonePromise();
    client.on('eventDecrypted', (streamId, contentKind, event) => {
        recipientReceivesMessageWithoutError.runAndDone(() => {
            const content = event.decryptedContent;
            expect(content).toBeDefined();
            check(content.kind === 'channelMessage');
            expect(getChannelMessagePayload(content?.content)).toEqual(expectedMessageText);
        });
    });
    return recipientReceivesMessageWithoutError.promise;
}
export function isValidEthAddress(address) {
    const ethAddressRegex = /^(0x)?[0-9a-fA-F]{40}$/;
    return ethAddressRegex.test(address);
}
export const TIERED_PRICING_ORACLE = 'TieredLogPricingOracle';
export const FIXED_PRICING = 'FixedPricing';
export const getDynamicPricingModule = (pricingModules) => {
    return pricingModules.find((module) => module.name === TIERED_PRICING_ORACLE);
};
export const getFixedPricingModule = (pricingModules) => {
    return pricingModules.find((module) => module.name === FIXED_PRICING);
};
//# sourceMappingURL=util.test.js.map
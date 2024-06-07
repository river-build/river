import { makeUserContextFromWallet } from '../util.test';
import { BigNumber, ethers } from 'ethers';
import { makeStreamRpcClient } from '../makeStreamRpcClient';
import { userIdFromAddress } from '../id';
import { Client } from '../client';
import { RiverSDK } from '../testSdk.test_util';
import { RiverDbManager } from '../riverDbManager';
import { MockEntitlementsDelegate } from '../utils';
import { createSpaceDapp } from '@river-build/web3';
import { dlog } from '@river-build/dlog';
import { minimalBalance } from './loadconfig.test_util';
import { makeBaseChainConfig } from '../riverConfig';
const log = dlog('csb:test:loadTests');
export async function createAndStartClient(account, jsonRpcProviderUrl, nodeRpcURL) {
    const wallet = new ethers.Wallet(account.privateKey);
    const provider = new ethers.providers.JsonRpcProvider(jsonRpcProviderUrl);
    const walletWithProvider = wallet.connect(provider);
    const context = await makeUserContextFromWallet(wallet);
    const rpcClient = makeStreamRpcClient(nodeRpcURL);
    const userId = userIdFromAddress(context.creatorAddress);
    const cryptoStore = RiverDbManager.getCryptoDb(userId);
    const client = new Client(context, rpcClient, cryptoStore, new MockEntitlementsDelegate());
    client.setMaxListeners(100);
    await client.initializeUser();
    client.startSync();
    return {
        client: client,
        etherWallet: wallet,
        provider: provider,
        walletWithProvider: walletWithProvider,
    };
}
export async function createAndStartClients(accounts, jsonRpcProviderUrl, nodeRpcURL) {
    const clientPromises = accounts.map(async (account, index) => {
        const clientName = `client_${index}`;
        const clientWalletInfo = await createAndStartClient(account, jsonRpcProviderUrl, nodeRpcURL);
        return [clientName, clientWalletInfo];
    });
    const clientArray = await Promise.all(clientPromises);
    return clientArray.reduce((records, [clientName, clientInfo]) => {
        records[clientName] = clientInfo;
        return records;
    }, {});
}
export async function multipleClientsJoinSpaceAndChannel(clientWalletInfos, spaceId, channelId) {
    const baseConfig = makeBaseChainConfig();
    const clientPromises = Object.keys(clientWalletInfos).map(async (key) => {
        const clientWalletInfo = clientWalletInfos[key];
        const provider = clientWalletInfo.provider;
        const walletWithProvider = clientWalletInfo.walletWithProvider;
        const client = clientWalletInfo.client;
        const spaceDapp = createSpaceDapp(provider, baseConfig.chainConfig);
        const riverSDK = new RiverSDK(spaceDapp, client, walletWithProvider);
        await riverSDK.joinSpace(spaceId);
        if (channelId) {
            await riverSDK.joinChannel(channelId);
        }
    });
    await Promise.all(clientPromises);
}
export async function createClientSpaceAndChannel(account, jsonRpcProviderUrl, nodeRpcURL, createExtraChannel = false) {
    const baseConfig = makeBaseChainConfig();
    const clientWalletInfo = await createAndStartClient(account, jsonRpcProviderUrl, nodeRpcURL);
    const client = clientWalletInfo.client;
    const provider = clientWalletInfo.provider;
    const walletWithProvider = clientWalletInfo.walletWithProvider;
    const spaceDapp = createSpaceDapp(provider, baseConfig.chainConfig);
    const balance = await walletWithProvider.getBalance();
    const minimalWeiValue = BigNumber.from(BigInt(Math.floor(minimalBalance * 1e18)));
    log(`balanceInETH<${walletWithProvider.address}>`, ethers.utils.formatEther(balance));
    expect(balance.gte(minimalWeiValue)).toBeTruthy();
    const riverSDK = new RiverSDK(spaceDapp, client, walletWithProvider);
    // create space
    const createTownReturnVal = await riverSDK.createSpaceWithDefaultChannel('load-tests', '');
    const spaceStreamId = createTownReturnVal.spaceStreamId;
    const spaceId = spaceStreamId;
    let channelId = createTownReturnVal.defaultChannelStreamId;
    if (createExtraChannel) {
        // create channel
        const channelStreamId = await riverSDK.createChannel(spaceStreamId, 'load-tests', 'load-tests topic');
        channelId = channelStreamId;
    }
    return {
        client: client,
        spaceDapp: spaceDapp,
        spaceId: spaceId,
        channelId: channelId,
    };
}
export const startMessageSendingWindow = (contentKind, windowIndex, clients, channelId, messagesSentPerUserMap, windownDuration) => {
    const recipients = clients.map((client) => client.userId);
    for (let i = 0; i < clients.length; i++) {
        const senderClient = clients[i];
        sendMessageAfterRandomDelay(contentKind, senderClient, recipients, channelId, windowIndex.toString(), messagesSentPerUserMap, windownDuration);
    }
};
export const sendMessageAfterRandomDelay = (contentKind, senderClient, recipients, channelId, windowIndex, messagesSentPerUserMap, windownDuration) => {
    const randomDelay = Math.random() * windownDuration;
    setTimeout(() => {
        void sendMessageAsync(contentKind, senderClient, recipients, channelId, windowIndex, messagesSentPerUserMap, randomDelay);
    }, randomDelay);
};
const sendMessageAsync = async (contentKind, senderClient, recipients, streamId, windowIndex, messagesSentPerUserMap, randomDelay) => {
    const randomDelayInSec = (randomDelay / 1000).toFixed(3);
    const prefix = `${streamId}:${Date.now()}`;
    // streamId:startTimestamp:messageBody
    const newMessage = `${prefix}:Message<${contentKind}> from client<${senderClient.userId}>, window<${windowIndex}>, ${getCurrentTime()} with delay ${randomDelayInSec}s`;
    for (const recipientUserId of recipients) {
        if (recipientUserId === senderClient.userId) {
            continue;
        }
        const userStreamKey = getUserStreamKey(recipientUserId, streamId);
        let messagesSet = messagesSentPerUserMap.get(userStreamKey);
        if (!messagesSet) {
            messagesSet = new Set();
            messagesSentPerUserMap.set(userStreamKey, messagesSet);
        }
        messagesSet.add(newMessage);
    }
    await senderClient.sendMessage(streamId, newMessage);
};
export function getCurrentTime() {
    const currentDate = new Date();
    const isoFormattedTime = currentDate.toISOString();
    return isoFormattedTime;
}
export function wait(durationMS) {
    return new Promise((resolve) => {
        setTimeout(resolve, durationMS);
    });
}
export function getUserStreamKey(userId, streamId) {
    return `${userId}_${streamId}`;
}
// inputString starts with 'streamId:startTimestamp:messageBody'
export function extractComponents(inputString) {
    const firstColon = inputString.indexOf(':');
    const secondColon = inputString.indexOf(':', firstColon + 1);
    if (firstColon === -1 || secondColon === -1) {
        throw new Error('Invalid input format');
    }
    const streamId = inputString.substring(0, firstColon);
    const startTimestampStr = inputString.substring(firstColon + 1, secondColon);
    const startTimestamp = Number(startTimestampStr);
    const messageBody = inputString.substring(secondColon + 1, secondColon);
    return { streamId, startTimestamp, messageBody };
}
export function getRandomElement(arr) {
    if (arr.length === 0) {
        return undefined;
    }
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}
export function getRandomSubset(arr, subsetSize) {
    if (arr.length === 0 || subsetSize <= 0) {
        return [];
    }
    if (subsetSize >= arr.length) {
        return [...arr];
    }
    const shuffled = arr.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, subsetSize);
}
//# sourceMappingURL=load.test_util.js.map
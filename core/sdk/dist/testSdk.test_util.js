import { Permission, NoopRuleData, getFilteredRolesFromSpace, ETH_ADDRESS, } from '@river-build/web3';
import { makeDefaultChannelStreamId, makeSpaceStreamId, makeUniqueChannelStreamId } from './id';
import { BigNumber, ethers } from 'ethers';
import { dlog } from '@river-build/dlog';
const log = dlog('csb:test:synthetic');
export class RiverSDK {
    spaceDapp;
    client;
    walletWithProvider;
    constructor(spaceDapp, client, walletWithProvider) {
        this.spaceDapp = spaceDapp;
        this.client = client;
        this.walletWithProvider = walletWithProvider;
    }
    async createChannel(spaceId, channelName, channelTopic) {
        const channelStreamId = makeUniqueChannelStreamId(spaceId);
        const filteredRoles = await getFilteredRolesFromSpace(this.spaceDapp, spaceId);
        const roleIds = [];
        for (const r of filteredRoles) {
            roleIds.push(BigNumber.from(r.roleId).toNumber());
        }
        const transaction = await this.spaceDapp.createChannel(spaceId, channelName, channelStreamId, roleIds, this.walletWithProvider);
        await transaction.wait();
        await this.client.createChannel(spaceId, channelName, channelTopic, channelStreamId);
        await this.client.joinStream(channelStreamId);
        return channelStreamId;
    }
    async createSpaceWithDefaultChannel(spaceName, spaceMetadata, defaultChannelName = 'general') {
        log('Creating space: ');
        const membershipInfo = {
            settings: {
                name: 'Everyone',
                symbol: 'MEMBER',
                price: 0,
                maxSupply: 1000,
                duration: 0,
                currency: ETH_ADDRESS,
                feeRecipient: this.client.userId,
                freeAllocation: 0,
                pricingModule: ethers.constants.AddressZero,
            },
            permissions: [Permission.Read, Permission.Write, Permission.AddRemoveChannels],
            requirements: {
                everyone: true,
                users: [],
                ruleData: NoopRuleData,
            },
        };
        const createSpaceTransaction = await this.spaceDapp.createSpace({
            spaceName: spaceName,
            spaceMetadata: spaceMetadata,
            channelName: defaultChannelName,
            membership: membershipInfo,
        }, this.walletWithProvider);
        const receipt = await createSpaceTransaction.wait();
        const spaceAddress = this.spaceDapp.getSpaceAddress(receipt);
        expect(spaceAddress).toBeDefined();
        const spaceId = makeSpaceStreamId(spaceAddress);
        const channelId = makeDefaultChannelStreamId(spaceAddress);
        const spaceStreamId = await this.client.createSpace(spaceId);
        log('Created space by client: ', spaceStreamId);
        await this.client.joinStream(spaceStreamId.streamId);
        await this.client.createChannel(spaceId, defaultChannelName, '', channelId);
        log('Created channel by client: ', channelId);
        // await this.client.joinStream(channelId.networkId)
        return {
            spaceStreamId: spaceId,
            defaultChannelStreamId: channelId,
        };
    }
    async createSpaceAndChannel(spaceName, spaceMetadata, channelName) {
        log('Creating space: ', spaceName, ' with channel: ', channelName);
        const membershipInfo = {
            settings: {
                name: 'Everyone',
                symbol: 'MEMBER',
                price: 0,
                maxSupply: 1000,
                duration: 0,
                currency: ETH_ADDRESS,
                feeRecipient: this.client.userId,
                freeAllocation: 0,
                pricingModule: ethers.constants.AddressZero,
            },
            permissions: [Permission.Read, Permission.Write, Permission.AddRemoveChannels],
            requirements: {
                everyone: true,
                users: [],
                ruleData: NoopRuleData,
            },
        };
        log('transaction start creating space');
        const createSpaceTransaction = await this.spaceDapp.createSpace({
            spaceName: spaceName,
            spaceMetadata: spaceMetadata,
            channelName: channelName,
            membership: membershipInfo,
        }, this.walletWithProvider);
        const receipt = await createSpaceTransaction.wait();
        log('transaction receipt', receipt);
        if (receipt.status !== 1) {
            throw new Error('Failed to create space');
        }
        const spaceAddress = this.spaceDapp.getSpaceAddress(receipt);
        if (!spaceAddress) {
            throw new Error('Failed to get space address');
        }
        const spaceId = makeSpaceStreamId(spaceAddress);
        const channelId = makeDefaultChannelStreamId(spaceAddress);
        const spaceStreamId = await this.client.createSpace(spaceId);
        await this.client.joinStream(spaceStreamId.streamId);
        await this.client.createChannel(spaceId, channelName, '', channelId);
        // await this.client.joinStream(channelId.networkId)
        return {
            spaceStreamId: spaceId,
            defaultChannelStreamId: channelId,
        };
    }
    //TODO: make it nice - it is just a hack
    async joinSpace(spaceId) {
        const hasMembership = await this.spaceDapp.hasSpaceMembership(spaceId, this.walletWithProvider.address);
        if (!hasMembership) {
            // mint membership
            const { issued } = await this.spaceDapp.joinSpace(spaceId, this.walletWithProvider.address, this.walletWithProvider);
            expect(issued).toBe(true);
        }
        await this.client.joinStream(spaceId);
    }
    //TODO: make it nice - it is just a hack
    async joinChannel(channelId) {
        await this.client.joinStream(channelId);
    }
    async leaveChannel(channelId) {
        await this.client.leaveStream(channelId);
    }
    //TODO: make it nice - it is just a hack
    async getAvailableChannels(spaceId) {
        const streamStateView = await this.client.getStream(spaceId);
        const result = new Map();
        streamStateView.spaceContent.spaceChannelsMetadata.forEach((channelProperties, id) => {
            result.set(id, 'id');
        });
        return result;
    }
    async sendTextMessage(channelId, message) {
        await this.client.sendMessage(channelId, message);
    }
}
export class SpacesWithChannels {
    records = [];
    // Add a new record to the array
    addRecord(key, values) {
        this.records.push([key, values]);
    }
    // Get all records
    getRecords() {
        return this.records;
    }
    // Get values for a specific key
    getValuesForKey(key) {
        const record = this.records.find((pair) => pair[0] === key);
        return record ? record[1] : undefined;
    }
    // Add an element to the proper second array based on the value of the element in the first array
    addChannelToSpace(key, elementToAdd) {
        const record = this.records.find((pair) => pair[0] === key);
        if (record) {
            record[1].push(elementToAdd);
        }
        else {
            this.records.push([key, [elementToAdd]]);
        }
    }
}
export class ChannelSpacePairs {
    records = [];
    // Add a new record to the array
    addRecord(key, values) {
        this.records.push([key, values]);
    }
    // Get all records
    getRecords() {
        return this.records;
    }
    // Get values for a specific key
    getValuesForKey(key) {
        const record = this.records.find((pair) => pair[0] === key);
        return record ? record[1] : undefined;
    }
    recoverFromJSON(json) {
        const data = JSON.parse(json);
        //eslint-disable-next-line
        this.records = data.records;
    }
}
export class ChannelTrackingInfo {
    channelId;
    tracked;
    numUsersJoined;
    constructor(channelId) {
        this.channelId = channelId;
        this.tracked = false;
        this.numUsersJoined = 0;
    }
    getChannelId() {
        return this.channelId;
    }
    getTracked() {
        return this.tracked;
    }
    getNumUsersJoined() {
        return this.numUsersJoined;
    }
    setChannelId(channelId) {
        this.channelId = channelId;
    }
    setTracked(tracked) {
        this.tracked = tracked;
    }
    setNumUsersJoined(numUsersJoined) {
        this.numUsersJoined = numUsersJoined;
    }
}
export function startsWithSubstring(strA, strB) {
    return strA.startsWith(strB);
}
export function getRandomInt(n) {
    // Generate a random decimal number between 0 (inclusive) and 1 (exclusive)
    const randomDecimal = Math.random();
    // Scale the random number to the range [0, n)
    const randomInt = Math.floor(randomDecimal * n);
    return randomInt;
}
export async function pauseForXMiliseconds(x) {
    await new Promise((resolve) => setTimeout(resolve, x));
}
//# sourceMappingURL=testSdk.test_util.js.map
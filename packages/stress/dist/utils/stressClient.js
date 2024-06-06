import { Client as StreamsClient, makeSpaceStreamId, makeDefaultChannelStreamId, isDefined, makeUserStreamId, streamIdAsBytes, makeUniqueChannelStreamId, } from '@river/sdk';
import { makeConnection } from './connection';
import { CryptoStore } from '@river-build/encryption';
import { ETH_ADDRESS, NoopRuleData, Permission, SpaceDapp, getDynamicPricingModule, } from '@river-build/web3';
import { dlogger, shortenHexString } from '@river-build/dlog';
import { waitFor } from './waitFor';
const logger = dlogger('stress:stressClient');
export async function makeStressClient(config, clientIndex, wallet) {
    const connection = await makeConnection(config, wallet);
    const cryptoDb = new CryptoStore(`crypto-${connection.userId}`, connection.userId);
    const spaceDapp = new SpaceDapp(connection.config.base.chainConfig, connection.baseProvider);
    const delegate = {
        isEntitled: async (spaceId, channelId, user, permission) => {
            if (config.environmentId === 'local_single_ne') {
                return true;
            }
            else if (channelId && spaceId) {
                return spaceDapp.isEntitledToChannel(spaceId, channelId, user, permission);
            }
            else if (spaceId) {
                return spaceDapp.isEntitledToSpace(spaceId, user, permission);
            }
            else {
                return true;
            }
        },
    };
    const streamsClient = new StreamsClient(connection.signerContext, connection.rpcClient, cryptoDb, delegate);
    return new StressClient(config, clientIndex, connection, spaceDapp, streamsClient);
}
export class StressClient {
    config;
    clientIndex;
    connection;
    spaceDapp;
    streamsClient;
    constructor(config, clientIndex, connection, spaceDapp, streamsClient) {
        this.config = config;
        this.clientIndex = clientIndex;
        this.connection = connection;
        this.spaceDapp = spaceDapp;
        this.streamsClient = streamsClient;
    }
    get logId() {
        return `client${this.clientIndex}:${shortenHexString(this.connection.userId)}`;
    }
    async fundWallet() {
        await this.connection.baseProvider.fundWallet();
    }
    async waitFor(condition, opts) {
        opts = opts ?? {};
        opts.logId = opts.logId ? `${opts.logId}:${this.logId}` : this.logId;
        return waitFor(condition, opts);
    }
    async userExists(inUserId) {
        const userId = inUserId ?? this.connection.userId;
        const userStreamId = makeUserStreamId(userId);
        const response = await this.streamsClient.rpcClient.getStream({
            streamId: streamIdAsBytes(userStreamId),
            optional: true,
        });
        return response.stream !== undefined;
    }
    async isMemberOf(streamId, inUserId) {
        const userId = inUserId ?? this.connection.userId;
        const stream = this.streamsClient.stream(streamId);
        const streamStateView = stream?.view ?? (await this.streamsClient.getStream(streamId));
        return streamStateView.userIsEntitledToKeyExchange(userId);
    }
    async createSpace(spaceName) {
        const dynamicPricingModule = await getDynamicPricingModule(this.spaceDapp);
        const membershipInfo = {
            settings: {
                name: 'Everyone',
                symbol: 'MEMBER',
                price: 0,
                maxSupply: 1000,
                duration: 0,
                currency: ETH_ADDRESS,
                feeRecipient: this.connection.userId,
                freeAllocation: 0,
                pricingModule: dynamicPricingModule.module,
            },
            permissions: [Permission.Read, Permission.Write],
            requirements: {
                everyone: true,
                users: [],
                ruleData: NoopRuleData,
            },
        };
        const transaction = await this.spaceDapp.createSpace({
            spaceName,
            spaceMetadata: spaceName,
            channelName: 'general',
            membership: membershipInfo,
        }, this.connection.baseProvider.wallet);
        const receipt = await transaction.wait();
        logger.log('transaction receipt', receipt);
        const spaceAddress = this.spaceDapp.getSpaceAddress(receipt);
        if (!spaceAddress) {
            throw new Error('Space address not found');
        }
        logger.log('spaceAddress', spaceAddress);
        const spaceId = makeSpaceStreamId(spaceAddress);
        const defaultChannelId = makeDefaultChannelStreamId(spaceAddress);
        logger.log('spaceId, defaultChannelId', { spaceId, defaultChannelId });
        await this.startStreamsClient({ spaceId });
        await this.streamsClient.createSpace(spaceId);
        await this.streamsClient.createChannel(spaceId, 'general', '', defaultChannelId);
        return { spaceId, defaultChannelId };
    }
    async createChannel(spaceId, channelName) {
        const channelId = makeUniqueChannelStreamId(spaceId);
        const roles = await this.spaceDapp.getRoles(spaceId);
        const tx = await this.spaceDapp.createChannel(spaceId, channelName, channelId, roles.filter((role) => role.name !== 'Owner').map((role) => role.roleId), this.connection.baseProvider.wallet);
        const receipt = await tx.wait();
        logger.log('createChannel receipt', receipt);
        await this.streamsClient.createChannel(spaceId, channelName, '', channelId);
        return channelId;
    }
    async startStreamsClient(metadata) {
        if (isDefined(this.streamsClient.userStreamId)) {
            return;
        }
        await this.streamsClient.initializeUser(metadata);
        this.streamsClient.startSync();
    }
    async sendMessage(channelId, message, options) {
        const eventId = await this.streamsClient.sendChannelMessage_Text(channelId, {
            threadId: options?.threadId,
            threadPreview: options?.threadId ? '🙉' : undefined,
            replyId: options?.replyId,
            replyPreview: options?.replyId ? '🙈' : undefined,
            content: {
                body: message,
                mentions: options?.mentions ?? [],
                attachments: [],
            },
        });
        return eventId;
    }
    async sendReaction(channelId, refEventId, reaction) {
        const eventId = await this.streamsClient.sendChannelMessage_Reaction(channelId, {
            reaction,
            refEventId,
        });
        return eventId;
    }
    async joinSpace(spaceId, opts) {
        if (opts?.skipMintMembership !== true) {
            const { issued } = await this.spaceDapp.joinSpace(spaceId, this.connection.wallet.address, this.connection.baseProvider.wallet);
            logger.log('joinSpace transaction', issued);
        }
        await this.startStreamsClient({ spaceId });
        await this.streamsClient.joinStream(spaceId);
        await this.streamsClient.joinStream(makeDefaultChannelStreamId(spaceId));
    }
    async stop() {
        await this.streamsClient.stop();
    }
}
//# sourceMappingURL=stressClient.js.map
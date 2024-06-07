/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/**
 * @group with-entitilements
 */
import { makeUserContextFromWallet, makeTestClient, getDynamicPricingModule } from './util.test';
import { makeDefaultChannelStreamId, makeSpaceStreamId } from './id';
import { ethers } from 'ethers';
import { ETH_ADDRESS, LocalhostWeb3Provider, NoopRuleData, Permission, createSpaceDapp, } from '@river-build/web3';
import { makeBaseChainConfig } from './riverConfig';
import { dlog } from '@river-build/dlog';
const log = dlog('csb:test:mediaWithEntitlements');
describe('mediaWithEntitlements', () => {
    let bobClient;
    let bobWallet;
    let bobContext;
    let aliceClient;
    let aliceWallet;
    let aliceContext;
    const baseConfig = makeBaseChainConfig();
    beforeEach(async () => {
        bobWallet = ethers.Wallet.createRandom();
        bobContext = await makeUserContextFromWallet(bobWallet);
        bobClient = await makeTestClient({ context: bobContext });
        await bobClient.initializeUser();
        bobClient.startSync();
        aliceWallet = ethers.Wallet.createRandom();
        aliceContext = await makeUserContextFromWallet(aliceWallet);
        aliceClient = await makeTestClient({
            context: aliceContext,
        });
    });
    test('clientCanOnlyCreateMediaStreamIfMemberOfSpaceAndChannel', async () => {
        log('start clientCanOnlyCreateMediaStreamIfMemberOfSpaceAndChannel');
        /**
         * Setup
         * Bob creates a space and a channel, both on chain and in River
         */
        const provider = new LocalhostWeb3Provider(baseConfig.rpcUrl, bobWallet);
        await provider.fundWallet();
        const spaceDapp = createSpaceDapp(provider, baseConfig.chainConfig);
        const pricingModules = await spaceDapp.listPricingModules();
        const dynamicPricingModule = getDynamicPricingModule(pricingModules);
        expect(dynamicPricingModule).toBeDefined();
        // create a space stream,
        const membershipInfo = {
            settings: {
                name: 'Everyone',
                symbol: 'MEMBER',
                price: 0,
                maxSupply: 1000,
                duration: 0,
                currency: ETH_ADDRESS,
                feeRecipient: bobClient.userId,
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
        log('transaction start bob creating space');
        const transaction = await spaceDapp.createSpace({
            spaceName: 'space-name',
            spaceMetadata: 'bobs-space-metadata',
            channelName: 'general',
            membership: membershipInfo,
        }, provider.wallet);
        const receipt = await transaction.wait();
        log('transaction receipt', receipt);
        const spaceAddress = spaceDapp.getSpaceAddress(receipt);
        expect(spaceAddress).toBeDefined();
        const spaceStreamId = makeSpaceStreamId(spaceAddress);
        const channelId = makeDefaultChannelStreamId(spaceAddress);
        await bobClient.createSpace(spaceStreamId);
        await bobClient.createChannel(spaceStreamId, 'Channel', 'Topic', channelId);
        /**
         * Real test starts here
         * Bob is a member of the channel and can therefore create a media stream
         */
        await expect(bobClient.createMediaStream(channelId, spaceStreamId, 10)).toResolve();
        await bobClient.stop();
        await aliceClient.initializeUser();
        aliceClient.startSync();
        // Alice is NOT a member of the channel is prevented from creating a media stream
        await expect(aliceClient.createMediaStream(channelId, spaceStreamId, 10)).toReject();
        await aliceClient.stop();
    });
});
//# sourceMappingURL=mediaWithEntitlements.test.js.map
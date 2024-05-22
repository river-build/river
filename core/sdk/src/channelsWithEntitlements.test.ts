/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/**
 * @group with-entitilements
 */

import {
    getChannelMessagePayload,
    getDynamicPricingModule,
    makeTestClient,
    makeUserContextFromWallet,
    waitFor,
    getNftRuleData,
    createRole,
    createChannel,
} from './util.test'
import { dlog } from '@river-build/dlog'
import { makeDefaultChannelStreamId, makeSpaceStreamId, makeUserStreamId } from './id'
import { MembershipOp } from '@river-build/proto'
import { ethers } from 'ethers'
import {
    ETH_ADDRESS,
    LocalhostWeb3Provider,
    MembershipStruct,
    NoopRuleData,
    Permission,
    createSpaceDapp,
    getContractAddress,
    publicMint,
} from '@river-build/web3'
import { makeBaseChainConfig } from './riverConfig'

const log = dlog('csb:test:channelsWithEntitlements')

describe('channelsWithEntitlements', () => {
    test.skip('channel join gated on nft', async () => {
        // Have bob establish a new town with a default channel and an nft-gated channel.
        const baseConfig = makeBaseChainConfig()
        const bobsWallet = ethers.Wallet.createRandom()
        const bobsContext = await makeUserContextFromWallet(bobsWallet)
        const bobProvider = new LocalhostWeb3Provider(baseConfig.rpcUrl, bobsWallet)
        await bobProvider.fundWallet()
        const spaceDapp = createSpaceDapp(bobProvider, baseConfig.chainConfig)

        // create bob's user stream
        const bob = await makeTestClient({ context: bobsContext })
        const bobsUserStreamId = makeUserStreamId(bob.userId)
        await expect(bob.initializeUser()).toResolve()
        bob.startSync()

        const pricingModules = await spaceDapp.listPricingModules()
        const dynamicPricingModule = getDynamicPricingModule(pricingModules)
        expect(dynamicPricingModule).toBeDefined()

        // create a space stream
        log('Bob created user, about to create space')
        const membershipInfo: MembershipStruct = {
            settings: {
                name: 'Everyone',
                symbol: 'MEMBER',
                price: 0,
                maxSupply: 1000,
                duration: 0,
                currency: ETH_ADDRESS,
                feeRecipient: bob.userId,
                freeAllocation: 0,
                pricingModule: dynamicPricingModule!.module,
            },
            permissions: [Permission.Read, Permission.Write],
            requirements: {
                everyone: true,
                users: [],
                ruleData: NoopRuleData,
            },
        }
        log('transaction start bob creating space')
        const transaction = await spaceDapp.createSpace(
            {
                spaceName: 'bobs-space-metadata',
                spaceMetadata: 'bobs-space-metadata',
                channelName: 'general', // default channel name
                membership: membershipInfo,
            },
            bobProvider.wallet,
        )
        const receipt = await transaction.wait()
        expect(receipt.status).toEqual(1)
        const spaceAddress = spaceDapp.getSpaceAddress(receipt)
        expect(spaceAddress).toBeDefined()

        // On the river node, establish the space and default channel streams.
        const spaceId = makeSpaceStreamId(spaceAddress!)
        const defaultChannelId = makeDefaultChannelStreamId(spaceAddress!)
        const returnVal = await bob.createSpace(spaceId)
        expect(returnVal.streamId).toEqual(spaceId)

        // Now there must be "joined space" event in the user stream.
        const bobUserStreamView = bob.stream(bobsUserStreamId)!.view
        expect(bobUserStreamView).toBeDefined()
        expect(bobUserStreamView.userContent.isMember(spaceId, MembershipOp.SO_JOIN)).toBe(true)

        // create the channel
        log('Bob created space, about to create default channel')
        const channelReturnVal = await bob.createChannel(
            spaceId,
            'general',
            'Bobs channel properties',
            defaultChannelId,
        )
        expect(channelReturnVal.streamId).toEqual(defaultChannelId)

        // Sanity check: Bob should be a member of the space and the default channel.
        await waitFor(() => {
            expect(bobUserStreamView.userContent.isMember(spaceId, MembershipOp.SO_JOIN)).toBe(true)
            expect(
                bobUserStreamView.userContent.isMember(defaultChannelId, MembershipOp.SO_JOIN),
            ).toBe(true)
        })

        // Create nft-gated role
        const testNftAddress = await getContractAddress('TestNFT')
        const { roleId, error: roleError } = await createRole(
            spaceDapp,
            bobProvider,
            spaceId,
            'nft-gated read role',
            [Permission.Read],
            [],
            getNftRuleData(testNftAddress),
            bobProvider.wallet,
        )
        expect(roleError).toBeUndefined()
        log('roleId', roleId)

        // Attach above role to a new channel created on-chain
        const { channelId, error: channelError } = await createChannel(
            spaceDapp,
            bobProvider,
            spaceId,
            'nft-gated-channel',
            [roleId!.valueOf()],
            bobProvider.wallet,
        )
        expect(channelError).toBeUndefined()
        log('channelId', channelId)

        // Then, establish channel stream on the river node.
        const { streamId: channelStreamId } = await bob.createChannel(
            spaceId,
            'nft-gated-channel',
            '',
            channelId!,
        )
        expect(channelStreamId).toEqual(channelId)
        // As the space owner, Bob should be able to join the nft-gated channel.
        await expect(bob.joinStream(channelId!)).toResolve()

        // Create alice and add to space. Alice should be able to join default
        // channel but not the nft-gated channel.
        const alicesWallet = ethers.Wallet.createRandom()
        const alicesContext = await makeUserContextFromWallet(alicesWallet)
        const aliceProvider = new LocalhostWeb3Provider(baseConfig.rpcUrl, alicesWallet)
        await aliceProvider.fundWallet()
        const alice = await makeTestClient({
            context: alicesContext,
        })
        await alice.initializeUser()
        alice.startSync()
        log('Alice created user, about to join space', { alicesUserId: alice.userId })

        // first join the space on chain
        const aliceSpaceDapp = createSpaceDapp(aliceProvider, baseConfig.chainConfig)
        log('transaction start alice joining space')
        const { issued } = await aliceSpaceDapp.joinSpace(
            spaceId,
            alicesWallet.address,
            aliceProvider.wallet,
        )
        expect(issued).toBe(true)

        await expect(alice.joinStream(spaceId)).toResolve()
        await expect(alice.joinStream(defaultChannelId)).toResolve()

        // Alice should not be able to join the nft-gated channel since she does not have
        // the required NFT token.
        await expect(alice.joinStream(channelId!)).rejects.toThrow(
            expect.objectContaining({
                message: expect.stringContaining('7:PERMISSION_DENIED'),
            }),
        )
    })

    // Banning with entitlements — users need permission to ban other users.
    test('adminsCanRedactChannelMessages', async () => {
        log('start adminsCanRedactChannelMessages')
        // set up the web3 provider and spacedapp
        const baseConfig = makeBaseChainConfig()
        const bobsWallet = ethers.Wallet.createRandom()
        const bobsContext = await makeUserContextFromWallet(bobsWallet)
        const bobProvider = new LocalhostWeb3Provider(baseConfig.rpcUrl, bobsWallet)
        await bobProvider.fundWallet()
        const spaceDapp = createSpaceDapp(bobProvider, baseConfig.chainConfig)

        // create a user stream
        const bob = await makeTestClient({ context: bobsContext })
        const bobsUserStreamId = makeUserStreamId(bob.userId)
        await expect(bob.initializeUser()).toResolve()
        bob.startSync()

        const pricingModules = await spaceDapp.listPricingModules()
        const dynamicPricingModule = getDynamicPricingModule(pricingModules)
        expect(dynamicPricingModule).toBeDefined()

        // create a space stream,
        log('Bob created user, about to create space')
        // first on the blockchain
        const membershipInfo: MembershipStruct = {
            settings: {
                name: 'Everyone',
                symbol: 'MEMBER',
                price: 0,
                maxSupply: 1000,
                duration: 0,
                currency: ETH_ADDRESS,
                feeRecipient: bob.userId,
                freeAllocation: 0,
                pricingModule: dynamicPricingModule!.module,
            },
            permissions: [Permission.Read, Permission.Write],
            requirements: {
                everyone: true,
                users: [],
                ruleData: NoopRuleData,
            },
        }
        log('transaction start bob creating space')
        const transaction = await spaceDapp.createSpace(
            {
                spaceName: 'bobs-space-metadata',
                spaceMetadata: 'bobs-space-metadata',
                channelName: 'general', // default channel name
                membership: membershipInfo,
            },
            bobProvider.wallet,
        )
        const receipt = await transaction.wait()
        log('transaction receipt', receipt)
        expect(receipt.status).toEqual(1)
        const spaceAddress = spaceDapp.getSpaceAddress(receipt)
        expect(spaceAddress).toBeDefined()
        const spaceId = makeSpaceStreamId(spaceAddress!)
        const channelId = makeDefaultChannelStreamId(spaceAddress!)
        // then on the river node
        const returnVal = await bob.createSpace(spaceId)
        expect(returnVal.streamId).toEqual(spaceId)
        // Now there must be "joined space" event in the user stream.
        const bobUserStreamView = bob.stream(bobsUserStreamId)!.view
        expect(bobUserStreamView).toBeDefined()
        expect(bobUserStreamView.userContent.isMember(spaceId, MembershipOp.SO_JOIN)).toBe(true)

        // create the channel
        log('Bob created space, about to create channel')
        const channelProperties = 'Bobs channel properties'
        const channelReturnVal = await bob.createChannel(
            spaceId,
            'general',
            channelProperties,
            channelId,
        )
        expect(channelReturnVal.streamId).toEqual(channelId)

        await waitFor(() => {
            expect(bobUserStreamView.userContent.isMember(spaceId, MembershipOp.SO_JOIN)).toBe(true)
            expect(bobUserStreamView.userContent.isMember(channelId, MembershipOp.SO_JOIN)).toBe(
                true,
            )
        })

        // join alice
        const alicesWallet = ethers.Wallet.createRandom()
        const alicesContext = await makeUserContextFromWallet(alicesWallet)
        const aliceProvider = new LocalhostWeb3Provider(baseConfig.rpcUrl, alicesWallet)
        await aliceProvider.fundWallet()
        const alice = await makeTestClient({
            context: alicesContext,
        })
        await alice.initializeUser()
        alice.startSync()
        log('Alice created user, about to join space', { alicesUserId: alice.userId })

        // first join the space on chain
        const aliceSpaceDapp = createSpaceDapp(aliceProvider, baseConfig.chainConfig)
        log('transaction start alice joining space')
        const { issued } = await aliceSpaceDapp.joinSpace(
            spaceId,
            alicesWallet.address,
            aliceProvider.wallet,
        )
        expect(issued).toBe(true)

        await expect(alice.joinStream(spaceId)).toResolve()
        await expect(alice.joinStream(channelId)).toResolve()

        const aliceUserStreamView = alice.stream(alice.userStreamId!)!.view
        await waitFor(() => {
            expect(aliceUserStreamView.userContent.isMember(spaceId, MembershipOp.SO_JOIN)).toBe(
                true,
            )
            expect(aliceUserStreamView.userContent.isMember(channelId, MembershipOp.SO_JOIN)).toBe(
                true,
            )
        })

        // Alice says something bad
        const stream = await alice.waitForStream(channelId)
        await alice.sendMessage(channelId, 'Very bad message!')
        let eventId: string | undefined
        await waitFor(() => {
            const event = stream.view.timeline.find(
                (e) =>
                    getChannelMessagePayload(e.localEvent?.channelMessage) === 'Very bad message!',
            )
            expect(event).toBeDefined()
            eventId = event?.hashStr
        })

        expect(stream).toBeDefined()
        expect(eventId).toBeDefined()

        await expect(bob.redactMessage(channelId, eventId!)).toResolve()
        await expect(alice.redactMessage(channelId, eventId!)).rejects.toThrow(
            expect.objectContaining({
                message: expect.stringContaining('7:PERMISSION_DENIED'),
            }),
        )

        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done')
    })
})

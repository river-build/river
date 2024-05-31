/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/**
 * @group with-entitilements
 */

import {
    getChannelMessagePayload,
    waitFor,
    getNftRuleData,
    createRole,
    createChannel,
    setupWalletsAndContexts,
    createSpaceAndDefaultChannel,
    expectUserCanJoin,
    everyoneMembershipStruct,
    linkWallets,
    getLinkedWallets,
} from './util.test'
import { MembershipOp } from '@river-build/proto'
import { makeUserStreamId } from './id'
import { dlog } from '@river-build/dlog'
import { NoopRuleData, Permission, getContractAddress, publicMint } from '@river-build/web3'

const log = dlog('csb:test:channelsWithEntitlements')

describe('channelsWithEntitlements', () => {
    test('channel join gated on nft - join fail', async () => {
        const {
            alice,
            bob,
            alicesWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()

        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            'bob',
            await everyoneMembershipStruct(bobSpaceDapp, bob),
        )

        // Create nft-gated role
        const testNftAddress = await getContractAddress('TestNFT')
        const { roleId, error: roleError } = await createRole(
            bobSpaceDapp,
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
            bobSpaceDapp,
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
            'talk about nfts here',
            channelId!,
        )
        expect(channelStreamId).toEqual(channelId)
        // As the space owner, Bob should be able to join the nft-gated channel even if he doesn't have the nft.
        await expect(bob.joinStream(channelId!)).toResolve()

        // Alice should have no issue joining the space and default channel.
        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // Alice should not be able to join the nft-gated channel since she does not have
        // the required NFT token.
        await expect(alice.joinStream(channelId!)).rejects.toThrow(
            expect.objectContaining({
                message: expect.stringContaining('7:PERMISSION_DENIED'),
            }),
        )

        await bob.stopSync()
        await alice.stopSync()
    })

    test('channel join gated on nft - join pass', async () => {
        const {
            alice,
            bob,
            alicesWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()

        const membershipInfo = await everyoneMembershipStruct(bobSpaceDapp, bob)
        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            'bob',
            membershipInfo,
        )

        // Create nft-gated role
        const testNftAddress = await getContractAddress('TestNFT')
        const { roleId, error: roleError } = await createRole(
            bobSpaceDapp,
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
            bobSpaceDapp,
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
            'talk about nfts here',
            channelId!,
        )
        expect(channelStreamId).toEqual(channelId)
        // As the space owner, Bob should be able to join the nft-gated channel even if he doesn't have the nft.
        await expect(bob.joinStream(channelId!)).toResolve()

        // Alice should have no issue joining the space and default channel.
        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // Mint an nft for alice - she should be able to join now
        log('Minting NFT for Alice', testNftAddress, alicesWallet.address)
        await publicMint('TestNFT', alicesWallet.address as `0x${string}`)

        // Alice should not be able to join the nft-gated channel since she does not have
        // the required NFT token.
        await expect(alice.joinStream(channelId!)).toResolve()

        await bob.stopSync()
        await alice.stopSync()
    })

    test('channel gated on user entitlement - pass', async () => {
        const {
            alice,
            bob,
            alicesWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()

        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            'bob',
            await everyoneMembershipStruct(bobSpaceDapp, bob),
        )

        // Create user entitlement gated role
        const { roleId, error: roleError } = await createRole(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'nft-gated read role',
            [Permission.Read],
            [alicesWallet.address],
            NoopRuleData,
            bobProvider.wallet,
        )
        expect(roleError).toBeUndefined()
        log('roleId', roleId)

        // Attach above role to a new channel created on-chain
        const { channelId, error: channelError } = await createChannel(
            bobSpaceDapp,
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
            'talk about nfts here',
            channelId!,
        )
        expect(channelStreamId).toEqual(channelId)
        // As the space owner, Bob should be able to join the nft-gated channel even if he doesn't have the nft.
        await expect(bob.joinStream(channelId!)).toResolve()

        // Alice should have no issue joining the space and default channel.
        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // Validate alice can join the channel, alice's user stream should have the join
        await expect(alice.joinStream(channelId!)).toResolve()
        const aliceUserStreamView = (await alice.waitForStream(makeUserStreamId(alice.userId))!)
            .view
        // Wait for alice's user stream to have the join
        await waitFor(() =>
            aliceUserStreamView.userContent.isMember(channelId!, MembershipOp.SO_JOIN),
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('channel gated on user entitlement - fail', async () => {
        const {
            alice,
            bob,
            alicesWallet,
            carolsWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()

        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            'bob',
            await everyoneMembershipStruct(bobSpaceDapp, bob),
        )

        // Create user entitlement gated role
        const { roleId, error: roleError } = await createRole(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'nft-gated read role',
            [Permission.Read],
            [carolsWallet.address],
            NoopRuleData,
            bobProvider.wallet,
        )
        expect(roleError).toBeUndefined()
        log('roleId', roleId)

        // Attach above role to a new channel created on-chain
        const { channelId, error: channelError } = await createChannel(
            bobSpaceDapp,
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
            'talk about nfts here',
            channelId!,
        )
        expect(channelStreamId).toEqual(channelId)
        // As the space owner, Bob should be able to join the nft-gated channel even if he doesn't have the nft.
        await expect(bob.joinStream(channelId!)).toResolve()

        // Alice should have no issue joining the space and default channel.
        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        await expect(alice.joinStream(channelId!)).rejects.toThrow(/7:PERMISSION_DENIED/)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('channel gated on user entitlement with linked wallets - root passes with linked wallet whitelisted', async () => {
        const {
            alice,
            bob,
            alicesWallet,
            carolsWallet,
            carolProvider,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()

        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            'bob',
            await everyoneMembershipStruct(bobSpaceDapp, bob),
        )

        // Link carol's wallet to alice's as root
        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        // Create user entitlement gated role
        const { roleId, error: roleError } = await createRole(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'nft-gated read role',
            [Permission.Read],
            [carolsWallet.address], // whitelist carol wallet
            NoopRuleData,
            bobProvider.wallet,
        )
        expect(roleError).toBeUndefined()
        log('roleId', roleId)

        // Attach above role to a new channel created on-chain
        const { channelId, error: channelError } = await createChannel(
            bobSpaceDapp,
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
            'talk about nfts here',
            channelId!,
        )
        expect(channelStreamId).toEqual(channelId)
        // As the space owner, Bob should be able to join the user-gated channel even if he's not whitelisted'.
        await expect(bob.joinStream(channelId!)).toResolve()

        // Alice should have no issue joining the space and default channel.
        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // Validate alice can join the channel, alice's user stream should have the join
        await expect(alice.joinStream(channelId!)).toResolve()
        const aliceUserStreamView = (await alice.waitForStream(makeUserStreamId(alice.userId))!)
            .view
        // Wait for alice's user stream to have the join
        await waitFor(() =>
            aliceUserStreamView.userContent.isMember(channelId!, MembershipOp.SO_JOIN),
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('channel gated on user entitlement with linked wallets - linked wallet passes with root whitelisted', async () => {
        const {
            alice,
            bob,
            alicesWallet,
            bobsWallet,
            carolsWallet,
            carolProvider,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
            carolSpaceDapp,
        } = await setupWalletsAndContexts()

        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            'bob',
            await everyoneMembershipStruct(bobSpaceDapp, bob),
        )

        // Link alice's wallet to Carol's wallet as root
        log('Linking wallets', carolProvider.wallet.address, aliceProvider.wallet.address)
        log('raw', carolsWallet.address, alicesWallet.address)
        await linkWallets(carolSpaceDapp, carolProvider.wallet, aliceProvider.wallet)
        expect(await getLinkedWallets(carolSpaceDapp, carolProvider.wallet)).toEqual([
            alicesWallet.address,
        ])

        // Create user entitlement gated role
        const { roleId, error: roleError } = await createRole(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'user-gated read role',
            [Permission.Read],
            [carolsWallet.address], // whitelist carol wallet
            NoopRuleData,
            bobProvider.wallet,
        )
        expect(roleError).toBeUndefined()
        expect(roleId).toBeDefined()
        log('roleId', roleId)

        // Attach above role to a new channel created on-chain
        const { channelId, error: channelError } = await createChannel(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'user-gated-channel',
            [roleId!.valueOf()],
            bobProvider.wallet,
        )
        expect(channelError).toBeUndefined()
        expect(channelId).toBeDefined()
        log('channelId', channelId)

        // Then, establish channel stream on the river node.
        const { streamId: channelStreamId } = await bob.createChannel(
            spaceId,
            'user-gated-channel',
            'talk about cool stuff here',
            channelId!,
        )
        expect(channelStreamId).toEqual(channelId)
        log('created channel on stream node', channelId)

        // As the space owner, Bob should be able to join the nft-gated channel even if he doesn't have the nft.
        log(
            'bob joining user-gated-channel',
            bobProvider.wallet.address,
            bobsWallet.address,
            channelId,
        )
        await expect(bob.joinStream(channelId!)).toResolve()
        log(
            'bob joined user-gated-channel',
            bobProvider.wallet.address,
            bobsWallet.address,
            channelId,
        )
        // Alice should have no issue joining the space and default channel.
        log(
            'alice joining space',
            spaceId,
            defaultChannelId,
            alicesWallet.address,
            aliceProvider.wallet.address,
        )
        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // // Validate alice can join the channel, alice's user stream should have the join
        log('alice joining user-gated-channel', channelId, spaceId, alicesWallet.address)
        await expect(alice.joinStream(channelId!)).toResolve()
        // const aliceUserStreamView = (await alice.waitForStream(makeUserStreamId(alice.userId))!).view
        // // Wait for alice's user stream to have the join
        // await waitFor(() => aliceUserStreamView.userContent.isMember(channelId!, MembershipOp.SO_JOIN))

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done linked-wallet-whitelist', Date.now() - doneStart)
    })

    // Banning with entitlements — users need permission to ban other users.
    test('adminsCanRedactChannelMessages', async () => {
        // log('start adminsCanRedactChannelMessages')
        // // set up the web3 provider and spacedapp
        const {
            alice,
            bob,
            alicesWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()

        const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            'bob',
            await everyoneMembershipStruct(bobSpaceDapp, bob),
        )
        bob.startSync()

        // // Alice should have no issue joining the space and default channel.
        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // Alice says something bad
        const stream = await alice.waitForStream(defaultChannelId)
        await alice.sendMessage(defaultChannelId, 'Very bad message!')
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

        await expect(bob.redactMessage(defaultChannelId, eventId!)).toResolve()
        await expect(alice.redactMessage(defaultChannelId, eventId!)).rejects.toThrow(
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

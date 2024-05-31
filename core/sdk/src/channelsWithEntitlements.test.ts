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
} from './util.test'
import { MembershipOp } from '@river-build/proto'
import { makeUserStreamId } from './id'
import { dlog } from '@river-build/dlog'
import {
    NoopRuleData,
    IRuleEntitlement,
    Permission,
    getContractAddress,
    publicMint,
} from '@river-build/web3'

const log = dlog('csb:test:channelsWithEntitlements')

// pass in users as 'alice', 'bob', 'carol' - b/c their wallets are created here
async function setupChannelWithCustomRole(
    userNames: string[],
    ruleData: IRuleEntitlement.RuleDataStruct,
) {
    const {
        alice,
        bob,
        alicesWallet,
        bobsWallet,
        carolsWallet,
        aliceProvider,
        bobProvider,
        carolProvider,
        aliceSpaceDapp,
        bobSpaceDapp,
        carolSpaceDapp,
    } = await setupWalletsAndContexts()

    const userNameToWallet: Record<string, string> = {
        alice: alicesWallet.address,
        bob: bobsWallet.address,
        carol: carolsWallet.address,
    }
    const users = userNames.map((user) => userNameToWallet[user])

    const { spaceId, defaultChannelId } = await createSpaceAndDefaultChannel(
        bob,
        bobSpaceDapp,
        bobProvider.wallet,
        'bob',
        await everyoneMembershipStruct(bobSpaceDapp, bob),
    )

    const { roleId, error: roleError } = await createRole(
        bobSpaceDapp,
        bobProvider,
        spaceId,
        'nft-gated read role',
        [Permission.Read],
        users,
        ruleData,
        bobProvider.wallet,
    )
    expect(roleError).toBeUndefined()
    log('roleId', roleId)

    // Create a channel gated by the above role in the space contract.
    const { channelId, error: channelError } = await createChannel(
        bobSpaceDapp,
        bobProvider,
        spaceId,
        'custom-role-gated-channel',
        [roleId!.valueOf()],
        bobProvider.wallet,
    )
    expect(channelError).toBeUndefined()
    log('channelId', channelId)

    // Then, establish a stream for the channel on the river node.
    const { streamId: channelStreamId } = await bob.createChannel(
        spaceId,
        'nft-gated-channel',
        'talk about nfts here',
        channelId!,
    )
    expect(channelStreamId).toEqual(channelId)
    // As the space owner, Bob should always be able to join the channel regardless of the custom role.
    await expect(bob.joinStream(channelId!)).toResolve()

    // Join alice to the town so she can attempt to join the role-gated channel.
    // Alice should have no issue joining the space and default channel for an "everyone" towne.
    await expectUserCanJoin(
        spaceId,
        defaultChannelId,
        'alice',
        alice,
        aliceSpaceDapp,
        alicesWallet.address,
        aliceProvider.wallet,
    )

    return {
        alice,
        bob,
        alicesWallet,
        bobsWallet,
        carolsWallet,
        aliceProvider,
        bobProvider,
        carolProvider,
        aliceSpaceDapp,
        bobSpaceDapp,
        carolSpaceDapp,
        spaceId,
        defaultChannelId,
        channelId,
        roleId,
    }
}

describe('channelsWithEntitlements', () => {
    test('channel join gated on nft - join fail', async () => {
        const testNftAddress = await getContractAddress('TestNFT')
        const { alice, bob, channelId } = await setupChannelWithCustomRole(
            [],
            getNftRuleData(testNftAddress),
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
        const testNftAddress = await getContractAddress('TestNFT')
        const { alice, alicesWallet, bob, channelId } = await setupChannelWithCustomRole(
            [],
            getNftRuleData(testNftAddress),
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
        const { alice, bob, channelId } = await setupChannelWithCustomRole(['alice'], NoopRuleData)

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
        const { alice, bob, channelId } = await setupChannelWithCustomRole(['carol'], NoopRuleData)

        await expect(alice.joinStream(channelId!)).rejects.toThrow(/7:PERMISSION_DENIED/)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('channel gated on user entitlement with linked wallets - root passes with linked wallet whitelisted', async () => {
        const { alice, aliceSpaceDapp, aliceProvider, carolProvider, bob, channelId } =
            await setupChannelWithCustomRole(['carol'], NoopRuleData)

        // Link carol's wallet to alice's as root
        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

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
        const { alice, carolSpaceDapp, aliceProvider, carolProvider, bob, channelId } =
            await setupChannelWithCustomRole(['carol'], NoopRuleData)
        // Link alice's wallet to Carol's wallet as root
        await linkWallets(carolSpaceDapp, carolProvider.wallet, aliceProvider.wallet)

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

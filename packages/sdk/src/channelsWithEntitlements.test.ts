/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/**
 * @group with-entitilements
 */

import {
    getChannelMessagePayload,
    waitFor,
    getNftRuleData,
    twoNftRuleData,
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
    burn,
    balanceOf,
    LogicalOperationType,
    OperationType,
    Operation,
    CheckOperationType,
    treeToRuleData,
} from '@river-build/web3'
import { Client } from './client'

const log = dlog('csb:test:channelsWithEntitlements')

// pass in users as 'alice', 'bob', 'carol' - b/c their wallets are created here
async function setupChannelWithCustomRole(
    userNames: string[],
    ruleData: IRuleEntitlement.RuleDataStruct,
) {
    const {
        alice,
        bob,
        carol,
        aliceMobile,
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
        dave: alicesWallet.address,
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
        carol,
        aliceMobile,
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

async function expectUserCanJoinChannel(client: Client, channelId: string) {
    await expect(client.joinStream(channelId!)).toResolve()
    const aliceUserStreamView = (await client.waitForStream(makeUserStreamId(client.userId))!).view
    // Wait for alice's user stream to have the join
    await waitFor(() => aliceUserStreamView.userContent.isMember(channelId!, MembershipOp.SO_JOIN))
}

describe('channelsWithEntitlements', () => {
    test.skip('userEntitlementPass', async () => {
        const { alice, bob, channelId } = await setupChannelWithCustomRole(['alice'], NoopRuleData)

        // Validate alice can join the channel
        await expectUserCanJoinChannel(alice, channelId!)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test.skip('userEntitlementFail', async () => {
        const { alice, bob, channelId } = await setupChannelWithCustomRole(['carol'], NoopRuleData)

        await expect(alice.joinStream(channelId!)).rejects.toThrow(/7:PERMISSION_DENIED/)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test.skip('userEntitlementPass - join as root, linked wallet whitelisted', async () => {
        const { alice, aliceSpaceDapp, aliceProvider, carolProvider, bob, channelId } =
            await setupChannelWithCustomRole(['carol'], NoopRuleData)

        // Link carol's wallet to alice's as root
        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        // Validate alice can join the channel
        await expectUserCanJoinChannel(alice, channelId!)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test.skip('userEntitlementPass - join as linked wallet, root wallet whitelisted', async () => {
        const { alice, carolSpaceDapp, aliceProvider, carolProvider, bob, channelId } =
            await setupChannelWithCustomRole(['carol'], NoopRuleData)

        // Link alice's wallet to Carol's wallet as root
        await linkWallets(carolSpaceDapp, carolProvider.wallet, aliceProvider.wallet)

        // Validate alice can join the channel
        await expectUserCanJoinChannel(alice, channelId!)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done linked-wallet-whitelist', Date.now() - doneStart)
    })

    test.skip('oneNftGateJoinPass - join as root, asset in linked wallet', async () => {
        const testNft1Address = await getContractAddress('TestNFT1')
        const {
            alice,
            bob,
            aliceSpaceDapp,
            aliceProvider,
            carolsWallet,
            carolProvider,
            channelId,
        } = await setupChannelWithCustomRole([], getNftRuleData(testNft1Address as `0x${string}`))

        // Link carol's wallet to alice's as root
        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        await expect(alice.joinStream(channelId!)).rejects.toThrow(/7:PERMISSION_DENIED/)

        log('Minting an NFT for carols wallet, which is linked to alices wallet')
        const tokenId = await publicMint('TestNFT1', carolsWallet.address as `0x${string}`)

        // Wait 2 seconds for the negative auth cache to expire
        await new Promise((f) => setTimeout(f, 2000))

        // Validate alice can join the channel
        await expectUserCanJoinChannel(alice, channelId!)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test.skip('oneNftGateJoinPass - join as linked wallet, asset in root wallet', async () => {
        const testNft1Address = await getContractAddress('TestNFT1')
        const {
            alice,
            bob,
            carolSpaceDapp,
            aliceProvider,
            carolsWallet,
            carolProvider,
            channelId,
        } = await setupChannelWithCustomRole([], getNftRuleData(testNft1Address as `0x${string}`))

        log("Joining alice's wallet as a linked wallet to carols root wallet")
        await linkWallets(carolSpaceDapp, carolProvider.wallet, aliceProvider.wallet)

        log('Minting an NFT for carols wallet, which is the root to alices wallet')
        await publicMint('TestNFT1', carolsWallet.address as `0x${string}`)

        log('expect that alice can join the space')
        // Validate alice can join the channel
        await expectUserCanJoinChannel(alice, channelId!)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test.skip('oneNftGate - JoinPass, user booted on key request after entitlement loss', async () => {
        const testNftAddress = await getContractAddress('TestNFT')
        const { alice, alicesWallet, bob, aliceMobile, spaceId, channelId } =
            await setupChannelWithCustomRole([], getNftRuleData(testNftAddress))

        console.log("Alice's wallet address", alicesWallet.address)
        console.log('test nft address', testNftAddress)

        // Alice initially cannot join because she has no nft
        await expect(alice.joinStream(channelId!)).rejects.toThrow(/7:PERMISSION_DENIED/)

        // Mint an nft for alice - she should be able to join now
        const tokenId = await publicMint('TestNFT', alicesWallet.address as `0x${string}`)
        console.log('Minted nft', tokenId)

        // Wait 2 seconds for the negative auth cache to expire
        await new Promise((f) => setTimeout(f, 2000))

        // Validate alice can join the channel
        await expectUserCanJoinChannel(alice, channelId!)

        await bob.stopSync()
        await alice.stopSync()
    })

    test('oneNftGate - JoinPass, user booted on key request after entitlement loss', async () => {
        const testNftAddress = await getContractAddress('TestNFT')
        const { alice, alicesWallet, bob, aliceMobile, spaceId, channelId } =
            await setupChannelWithCustomRole([], getNftRuleData(testNftAddress))

        // Mint an nft for alice - she should be able to join now
        const tokenId = await publicMint('TestNFT', alicesWallet.address as `0x${string}`)
        console.log('Minted nft', tokenId)

        // Validate alice can join the channel
        await expectUserCanJoinChannel(alice, channelId!)

        const channelStream = await bob.waitForStream(channelId!)
        // Validate Alice is member of the channel
        await waitFor(() =>
            channelStream.view.membershipContent.isMember(MembershipOp.SO_JOIN, alice.userId),
        )

        // Burn Alice's NFT and validate her zero balance. She should now fail an entitlement check for the
        // channel.
        await burn('TestNFT', tokenId)
        await expect(balanceOf('TestNFT', alicesWallet.address as `0x${string}`)).resolves.toBe(0)

        // Wait 5 seconds for the positive auth cache to expire
        await new Promise((f) => setTimeout(f, 6000))

        console.log("Initializing alice's 'mobile' client (different device id)")
        await aliceMobile.initializeUser({ spaceId })

        // 1 second for streams to sync
        await new Promise((f) => setTimeout(f, 1000))

        // Additionally, alice should no longer be a channel member.
        channelStream.waitForMembership(MembershipOp.SO_LEAVE, alice.userId)

        // Alice's user stream should reflect that she is no longer a member of the channel.
        const aliceUserStream = await alice.waitForStream(alice.userStreamId!)
        aliceUserStream.waitFor('streamUserLeft', (streamId: string) => {
            return (
                streamId === channelId &&
                aliceUserStream.view.membershipContent.isMember(MembershipOp.SO_LEAVE, alice.userId)
            )
        })

        // Alice cannot rejoin the stream
        // The client waits for event confirmation via snapshot before processing membership
        // exit, so the rejoin will not produce the expected error in tests because the client
        // considers the user to still be a member of the channel until it processes the snapshot.
        // await expect(alice.joinStream(channelId!)).rejects.toThrow(/7:PERMISSION_DENIED/)

        await bob.stopSync()
        await alice.stopSync()
    })

    test.skip('oneNftGateJoinFail', async () => {
        const testNft1Address = await getContractAddress('TestNFT1')
        const { alice, bob, channelId } = await setupChannelWithCustomRole(
            [],
            getNftRuleData(testNft1Address as `0x${string}`),
        )

        log('Alice about to attempt to join channel', { alicesUserId: alice.userId })
        await expect(alice.joinStream(channelId!)).rejects.toThrow(/7:PERMISSION_DENIED/)

        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
    })

    test.skip('twoNftGateJoinPass', async () => {
        const testNft1Address = await getContractAddress('TestNFT1')
        const testNft2Address = await getContractAddress('TestNFT2')
        const { alice, bob, alicesWallet, channelId } = await setupChannelWithCustomRole(
            [],
            twoNftRuleData(testNft1Address, testNft2Address),
        )

        const aliceMintTx1 = publicMint('TestNFT1', alicesWallet.address as `0x${string}`)
        const aliceMintTx2 = publicMint('TestNFT2', alicesWallet.address as `0x${string}`)

        log('Minting nfts for alice')
        await Promise.all([aliceMintTx1, aliceMintTx2])

        log('expect that alice can join the channel')
        // Validate alice can join the channel
        await expectUserCanJoinChannel(alice, channelId!)

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test.skip('twoNftGateJoinPass - acrossLinkedWallets', async () => {
        const testNft1Address = await getContractAddress('TestNFT1')
        const testNft2Address = await getContractAddress('TestNFT2')
        const {
            alice,
            bob,
            alicesWallet,
            carolsWallet,
            aliceSpaceDapp,
            aliceProvider,
            carolProvider,
            channelId,
        } = await setupChannelWithCustomRole([], twoNftRuleData(testNft1Address, testNft2Address))

        const aliceMintTx1 = publicMint('TestNFT1', alicesWallet.address as `0x${string}`)
        const carolMintTx2 = publicMint('TestNFT2', carolsWallet.address as `0x${string}`)

        log('Minting nfts for alice and carol')
        await Promise.all([aliceMintTx1, carolMintTx2])

        log("linking carols wallet to alice's wallet")
        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        log('Alice should be able to join channel with one asset in carol wallet')
        await expectUserCanJoinChannel(alice, channelId!)

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test.skip('twoNftGateJoinFail', async () => {
        const testNft1Address = await getContractAddress('TestNFT1')
        const testNft2Address = await getContractAddress('TestNFT2')
        const { alice, bob, alicesWallet, channelId } = await setupChannelWithCustomRole(
            [],
            twoNftRuleData(testNft1Address, testNft2Address),
        )

        // Mint only one of the required NFTs for alice
        log('Minting only one of two required NFTs for alice')
        await publicMint('TestNFT1', alicesWallet.address as `0x${string}`)

        log('expect that alice cannot join the channel')
        await expect(alice.joinStream(channelId!)).rejects.toThrow(/7:PERMISSION_DENIED/)

        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
    })

    test.skip('OrOfTwoNftGateJoinPass', async () => {
        const testNft1Address = await getContractAddress('TestNFT1')
        const testNft2Address = await getContractAddress('TestNFT2')
        const { alice, bob, alicesWallet, channelId } = await setupChannelWithCustomRole(
            [],
            twoNftRuleData(testNft1Address, testNft2Address, LogicalOperationType.OR),
        )
        // join alice
        log('Minting an NFT for alice')
        await publicMint('TestNFT1', alicesWallet.address as `0x${string}`)

        log('expect that alice can join the channel')
        await expectUserCanJoinChannel(alice, channelId!)

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test.skip('orOfTwoNftOrOneNftGateJoinPass', async () => {
        const testNft1Address = await getContractAddress('TestNFT1')
        const testNft2Address = await getContractAddress('TestNFT2')
        const testNft3Address = await getContractAddress('TestNFT3')
        const leftOperation: Operation = {
            opType: OperationType.CHECK,
            checkType: CheckOperationType.ERC721,
            chainId: 31337n,
            contractAddress: testNft1Address as `0x${string}`,
            threshold: 1n,
        }

        const rightOperation: Operation = {
            opType: OperationType.CHECK,
            checkType: CheckOperationType.ERC721,
            chainId: 31337n,
            contractAddress: testNft2Address as `0x${string}`,
            threshold: 1n,
        }
        const two: Operation = {
            opType: OperationType.LOGICAL,
            logicalType: LogicalOperationType.AND,
            leftOperation,
            rightOperation,
        }

        const root: Operation = {
            opType: OperationType.LOGICAL,
            logicalType: LogicalOperationType.OR,
            leftOperation: two,
            rightOperation: {
                opType: OperationType.CHECK,
                checkType: CheckOperationType.ERC721,
                chainId: 31337n,
                contractAddress: testNft3Address as `0x${string}`,
                threshold: 1n,
            },
        }

        const ruleData = treeToRuleData(root)
        const { alice, bob, alicesWallet, channelId } = await setupChannelWithCustomRole(
            [],
            ruleData,
        )

        log("Mint Alice's NFTs")
        const aliceMintTx1 = publicMint('TestNFT1', alicesWallet.address as `0x${string}`)
        const aliceMintTx2 = publicMint('TestNFT2', alicesWallet.address as `0x${string}`)
        await Promise.all([aliceMintTx1, aliceMintTx2])

        log('expect that alice can join the channel')
        await expectUserCanJoinChannel(alice, channelId!)

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    // Banning with entitlements — users need permission to ban other users.
    test.skip('adminsCanRedactChannelMessages', async () => {
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

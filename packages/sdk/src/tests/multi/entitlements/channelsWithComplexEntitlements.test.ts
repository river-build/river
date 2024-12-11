/**
 * @group with-entitlements
 */

import {
    getNftRuleData,
    twoNftRuleData,
    createRole,
    createChannel,
    setupWalletsAndContexts,
    createSpaceAndDefaultChannel,
    expectUserCanJoin,
    everyoneMembershipStruct,
    linkWallets,
    setupChannelWithCustomRole,
    expectUserCanJoinChannel,
    expectUserCannotJoinChannel,
} from '../../testUtils'
import { dlog } from '@river-build/dlog'
import {
    Address,
    Permission,
    TestERC721,
    LogicalOperationType,
    OperationType,
    Operation,
    CheckOperationType,
    treeToRuleData,
    encodeThresholdParams,
    createExternalNFTStruct,
} from '@river-build/web3'

const log = dlog('csb:test:channelsWithComplexEntitlements')

describe('channelsWithComplexEntitlements', () => {
    test('User who satisfies only one role ruledata requirement can join channel', async () => {
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

        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const testNft1Address = await TestERC721.getContractAddress('TestNFT1')
        const testNft2Address = await TestERC721.getContractAddress('TestNFT2')

        const { roleId: nft1RoleId, error: roleError } = await createRole(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'gated role',
            [Permission.Read],
            [],
            getNftRuleData(testNft1Address),
            bobProvider.wallet,
        )
        expect(roleError).toBeUndefined()

        const { roleId: nft2RoleId, error: roleError2 } = await createRole(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'gated role',
            [Permission.Read],
            [],
            getNftRuleData(testNft2Address),
            bobProvider.wallet,
        )
        expect(roleError2).toBeUndefined()

        // Create a channel gated by the both role in the space contract.
        const { channelId, error: channelError } = await createChannel(
            bobSpaceDapp,
            bobProvider,
            spaceId,
            'double-role-gated-channel',
            [nft1RoleId!.valueOf(), nft2RoleId!.valueOf()],
            bobProvider.wallet,
        )
        expect(channelError).toBeUndefined()

        // Then, establish a stream for the channel on the river node.
        const { streamId: channelStreamId } = await bob.createChannel(
            spaceId,
            'double-role-gated-channel',
            'user only needs a single role to get into this channel',
            channelId!,
        )
        expect(channelStreamId).toEqual(channelId)

        // Mint an NFT for alice so that she satisfies the second role
        await TestERC721.publicMint('TestNFT2', alicesWallet.address as Address)

        // Join alice to the channel
        await expectUserCanJoinChannel(alice, aliceSpaceDapp, spaceId, channelId!)
    })

    test('user with only one entitlement from 3-nested NFT rule data can join channel', async () => {
        const testNft1 = 'TestNft1'
        const testNft2 = 'TestNft2'
        const testNft3 = 'TestNft3'
        const testNftAddress = await TestERC721.getContractAddress(testNft1)
        const testNftAddress2 = await TestERC721.getContractAddress(testNft2)
        const testNftAddress3 = await TestERC721.getContractAddress(testNft3)

        const ruleData = createExternalNFTStruct([testNftAddress, testNftAddress2, testNftAddress3])
        const {
            alice,
            alicesWallet,
            aliceSpaceDapp,
            bob,
            carol,
            carolsWallet,
            carolSpaceDapp,
            spaceId,
            defaultChannelId,
            channelId,
        } = await setupChannelWithCustomRole([], ruleData)

        // Set up additional users
        const {
            alice: dave,
            alicesWallet: davesWallet,
            aliceSpaceDapp: daveSpaceDapp,
            aliceProvider: daveProvider,
        } = await setupWalletsAndContexts()
        // Add Dave to the space
        await expectUserCanJoin(
            spaceId,
            defaultChannelId,
            'dave',
            dave,
            daveSpaceDapp,
            davesWallet.address,
            daveProvider.wallet,
        )

        // Alice initially cannot join because she has no nft
        await expectUserCannotJoinChannel(alice, aliceSpaceDapp, spaceId, channelId!)

        // Alice, Carol and Dave will each have one of the three NFTs, all should be able to join.
        // Mint an nft for alice - she should be able to join now
        await TestERC721.publicMint(testNft1, alicesWallet.address as Address)

        // Wait 2 seconds for the negative auth cache on the client to expire
        await new Promise((f) => setTimeout(f, 2000))

        // Validate alice can join the channel
        await expectUserCanJoinChannel(alice, aliceSpaceDapp, spaceId, channelId!)

        // Mint an nft for carol - she should be able to join now
        await TestERC721.publicMint(testNft2, carolsWallet.address as Address)

        // Validate carol can join the channel
        await expectUserCanJoinChannel(carol, carolSpaceDapp, spaceId, channelId!)

        // Mint an nft for dave - he should be able to join now
        await TestERC721.publicMint(testNft3, davesWallet.address as Address)

        // Validate dave can join the channel
        await expectUserCanJoinChannel(dave, daveSpaceDapp, spaceId, channelId!)

        await bob.stopSync()
        await alice.stopSync()
        await carol.stopSync()
        await dave.stopSync()
    })

    test('twoNftGateJoinPass', async () => {
        const testNft1Address = await TestERC721.getContractAddress('TestNFT1')
        const testNft2Address = await TestERC721.getContractAddress('TestNFT2')
        const { alice, bob, alicesWallet, aliceSpaceDapp, spaceId, channelId } =
            await setupChannelWithCustomRole([], twoNftRuleData(testNft1Address, testNft2Address))

        const aliceMintTx1 = TestERC721.publicMint('TestNFT1', alicesWallet.address as Address)
        const aliceMintTx2 = TestERC721.publicMint('TestNFT2', alicesWallet.address as Address)

        log('Minting nfts for alice')
        await Promise.all([aliceMintTx1, aliceMintTx2])

        log('expect that alice can join the channel')
        // Validate alice can join the channel
        await expectUserCanJoinChannel(alice, aliceSpaceDapp, spaceId, channelId!)

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('twoNftGateJoinPass - acrossLinkedWallets', async () => {
        const testNft1Address = await TestERC721.getContractAddress('TestNFT1')
        const testNft2Address = await TestERC721.getContractAddress('TestNFT2')
        const {
            alice,
            bob,
            alicesWallet,
            carolsWallet,
            aliceSpaceDapp,
            aliceProvider,
            carolProvider,
            spaceId,
            channelId,
        } = await setupChannelWithCustomRole([], twoNftRuleData(testNft1Address, testNft2Address))

        const aliceMintTx1 = TestERC721.publicMint('TestNFT1', alicesWallet.address as Address)
        const carolMintTx2 = TestERC721.publicMint('TestNFT2', carolsWallet.address as Address)

        log('Minting nfts for alice and carol')
        await Promise.all([aliceMintTx1, carolMintTx2])

        log("linking carols wallet to alice's wallet")
        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        log('Alice should be able to join channel with one asset in carol wallet')
        await expectUserCanJoinChannel(alice, aliceSpaceDapp, spaceId, channelId!)

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('twoNftGateJoinFail', async () => {
        const testNft1Address = await TestERC721.getContractAddress('TestNFT1')
        const testNft2Address = await TestERC721.getContractAddress('TestNFT2')
        const { alice, aliceSpaceDapp, bob, alicesWallet, spaceId, channelId } =
            await setupChannelWithCustomRole([], twoNftRuleData(testNft1Address, testNft2Address))

        // Mint only one of the required NFTs for alice
        log('Minting only one of two required NFTs for alice')
        await TestERC721.publicMint('TestNFT1', alicesWallet.address as Address)

        log('expect that alice cannot join the channel')
        await expectUserCannotJoinChannel(alice, aliceSpaceDapp, spaceId, channelId!)

        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
    })

    test('OrOfTwoNftGateJoinPass', async () => {
        const testNft1Address = await TestERC721.getContractAddress('TestNFT1')
        const testNft2Address = await TestERC721.getContractAddress('TestNFT2')
        const { alice, bob, alicesWallet, aliceSpaceDapp, spaceId, channelId } =
            await setupChannelWithCustomRole(
                [],
                twoNftRuleData(testNft1Address, testNft2Address, LogicalOperationType.OR),
            )
        // join alice
        log('Minting an NFT for alice')
        await TestERC721.publicMint('TestNFT1', alicesWallet.address as Address)

        log('expect that alice can join the channel')
        await expectUserCanJoinChannel(alice, aliceSpaceDapp, spaceId, channelId!)

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('orOfTwoNftOrOneNftGateJoinPass', async () => {
        const testNft1Address = await TestERC721.getContractAddress('TestNFT1')
        const testNft2Address = await TestERC721.getContractAddress('TestNFT2')
        const testNft3Address = await TestERC721.getContractAddress('TestNFT3')
        const params = encodeThresholdParams({ threshold: 1n })
        const leftOperation: Operation = {
            opType: OperationType.CHECK,
            checkType: CheckOperationType.ERC721,
            chainId: 31337n,
            contractAddress: testNft1Address,
            params,
        }

        const rightOperation: Operation = {
            opType: OperationType.CHECK,
            checkType: CheckOperationType.ERC721,
            chainId: 31337n,
            contractAddress: testNft2Address,
            params,
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
                contractAddress: testNft3Address,
                params,
            },
        }

        const ruleData = treeToRuleData(root)
        const { alice, bob, alicesWallet, aliceSpaceDapp, spaceId, channelId } =
            await setupChannelWithCustomRole([], ruleData)

        log("Mint Alice's NFTs")
        const aliceMintTx1 = TestERC721.publicMint('TestNFT1', alicesWallet.address as Address)
        const aliceMintTx2 = TestERC721.publicMint('TestNFT2', alicesWallet.address as Address)
        await Promise.all([aliceMintTx1, aliceMintTx2])

        log('expect that alice can join the channel')
        await expectUserCanJoinChannel(alice, aliceSpaceDapp, spaceId, channelId!)

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })
})

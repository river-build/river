/**
 * @group with-entitilements
 */

import {
    getDynamicPricingModule,
    everyoneMembershipStruct,
    waitFor,
    createUserStreamAndSyncClient,
    createSpaceAndDefaultChannel,
    expectUserCanJoin,
    setupWalletsAndContexts,
    linkWallets,
    getNftRuleData,
    twoNftRuleData,
    getXchainSupportedRpcUrlsForTesting,
    erc20CheckOp,
    customCheckOp,
    nativeCoinBalanceCheckOp,
    oneEth,
    twoEth,
    threeEth,
    oneHalfEth,
} from './util.test'
import { dlog } from '@river-build/dlog'
import { MembershipOp } from '@river-build/proto'
import { Client } from './client'
import {
    Address,
    CheckOperationType,
    ETH_ADDRESS,
    LogicalOperationType,
    MembershipStruct,
    NoopRuleData,
    Operation,
    OperationType,
    Permission,
    TestCustomEntitlement,
    TestERC20,
    TestERC721,
    TestEthBalance,
    treeToRuleData,
    IRuleEntitlementV2Base,
    ISpaceDapp,
    encodeRuleDataV2,
    encodeThresholdParams,
} from '@river-build/web3'

const log = dlog('csb:test:spaceWithEntitlements')

// Users need to be mapped from 'alice', 'bob', etc to their wallet addresses,
// because the wallets are created within this helper method.
async function createTownWithRequirements(requirements: {
    everyone: boolean
    users: string[]
    ruleData: IRuleEntitlementV2Base.RuleDataV2Struct
}) {
    const {
        alice,
        bob,
        carol,
        aliceSpaceDapp,
        bobSpaceDapp,
        carolSpaceDapp,
        aliceProvider,
        bobProvider,
        carolProvider,
        alicesWallet,
        bobsWallet,
        carolsWallet,
    } = await setupWalletsAndContexts()

    const pricingModules = await bobSpaceDapp.listPricingModules()
    const dynamicPricingModule = getDynamicPricingModule(pricingModules)
    expect(dynamicPricingModule).toBeDefined()

    const userNameToWallet: Record<string, string> = {
        alice: alicesWallet.address,
        bob: bobsWallet.address,
        carol: carolsWallet.address,
    }
    requirements.users = requirements.users.map((user) => userNameToWallet[user])

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
            everyone: requirements.everyone,
            users: requirements.users,
            ruleData: encodeRuleDataV2(requirements.ruleData),
        },
    }

    // This helper method validates that the owner can join the space and default channel.
    const {
        spaceId,
        defaultChannelId: channelId,
        userStreamView: bobUserStreamView,
    } = await createSpaceAndDefaultChannel(
        bob,
        bobSpaceDapp,
        bobProvider.wallet,
        'bobs',
        membershipInfo,
    )

    // Validate that owner passes entitlement check
    const entitledWallet = await bobSpaceDapp.getEntitledWalletForJoiningSpace(
        spaceId,
        bobsWallet.address,
        getXchainSupportedRpcUrlsForTesting(),
    )
    expect(entitledWallet).toBeDefined()

    return {
        alice,
        bob,
        carol,
        aliceSpaceDapp,
        bobSpaceDapp,
        carolSpaceDapp,
        aliceProvider,
        bobProvider,
        carolProvider,
        alicesWallet,
        bobsWallet,
        carolsWallet,
        spaceId,
        channelId,
        bobUserStreamView,
    }
}

async function expectUserCannotJoinSpace(
    spaceId: string,
    client: Client,
    spaceDapp: ISpaceDapp,
    address: string,
) {
    // Check that the local evaluation of the user's entitlements for joining the space
    // fails.
    const entitledWallet = await spaceDapp.getEntitledWalletForJoiningSpace(
        spaceId,
        address,
        getXchainSupportedRpcUrlsForTesting(),
    )
    expect(entitledWallet).toBeUndefined()
    await expect(client.joinStream(spaceId)).rejects.toThrow(/PERMISSION_DENIED/)
}

describe('spaceWithEntitlements', () => {
    let testNft1Address: string, testNft2Address: string, testNft3Address: string
    beforeAll(async () => {
        ;[testNft1Address, testNft2Address, testNft3Address] = await Promise.all([
            TestERC721.getContractAddress('TestNFT1'),
            TestERC721.getContractAddress('TestNFT2'),
            TestERC721.getContractAddress('TestNFT3'),
        ])
    })

    test('banned user not entitled to join space', async () => {
        const {
            alice,
            alicesWallet,
            aliceSpaceDapp,
            bob,
            bobSpaceDapp,
            bobProvider,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: true,
            users: [],
            ruleData: NoopRuleData,
        })

        // Have alice join the space so we can ban her
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            bobProvider.wallet,
        )

        const tx = await bobSpaceDapp.banWalletAddress(
            spaceId,
            alicesWallet.address,
            bobProvider.wallet,
        )
        await tx.wait()

        // Wait 2 seconds for the banning cache to expire on the stream node
        await new Promise((f) => setTimeout(f, 2000))

        // Alice no longer satisfies space entitlements
        const entitledWallet = await aliceSpaceDapp.getEntitledWalletForJoiningSpace(
            spaceId,
            alicesWallet.address,
            getXchainSupportedRpcUrlsForTesting(),
        )
        expect(entitledWallet).toBeUndefined()

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    // Banning with entitlements — users need permission to ban other users.
    test('ownerCanBanOtherUsers', async () => {
        log('start ownerCanBanOtherUsers')
        const {
            alice,
            bob,
            aliceSpaceDapp,
            aliceProvider,
            alicesWallet,
            spaceId,
            channelId,
            bobUserStreamView,
        } = await createTownWithRequirements({
            everyone: true,
            users: [],
            ruleData: NoopRuleData,
        })

        log('Alice should be able to join space')
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // Alice cannot kick Bob
        log('Alice cannot kick bob')
        await expect(alice.removeUser(spaceId, bob.userId)).rejects.toThrow(/7:PERMISSION_DENIED/)

        // Bob is still a a member — Alice can't kick him because he's the owner
        await waitFor(() => {
            expect(bobUserStreamView.userContent.isMember(spaceId, MembershipOp.SO_JOIN)).toBeTrue()
            expect(
                bobUserStreamView.userContent.isMember(channelId, MembershipOp.SO_JOIN),
            ).toBeTrue()
        })

        // Bob kicks Alice!
        log('Bob kicks Alice')
        await expect(bob.removeUser(spaceId, alice.userId)).toResolve()

        // Alice is no longer a member of the space or channel
        log('Alice is no longer a member of the space or channel')
        const aliceUserStreamView = alice.stream(alice.userStreamId!)!.view
        await waitFor(() => {
            expect(
                aliceUserStreamView.userContent.isMember(spaceId, MembershipOp.SO_JOIN),
            ).toBeFalse()
            expect(
                aliceUserStreamView.userContent.isMember(channelId, MembershipOp.SO_JOIN),
            ).toBeFalse()
        })

        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done')
    })

    test('userEntitlementPass', async () => {
        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId, channelId } =
            await createTownWithRequirements({
                everyone: false,
                users: ['alice'],
                ruleData: NoopRuleData,
            })

        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('userEntitlementFail', async () => {
        const { alice, bob, aliceSpaceDapp, alicesWallet, aliceProvider, spaceId } =
            await createTownWithRequirements({
                everyone: false,
                users: ['carol'], // not alice!
                ruleData: NoopRuleData,
            })

        // Alice cannot join the space in the contract.
        const { issued } = await aliceSpaceDapp.joinSpace(
            spaceId,
            alicesWallet.address,
            aliceProvider.wallet,
        )
        expect(issued).toBe(false)

        // Have alice create a user stream attached to her own space.
        // Then she will attempt to join the space from the client, which should also fail.
        await createUserStreamAndSyncClient(
            alice,
            aliceSpaceDapp,
            'alice',
            await everyoneMembershipStruct(aliceSpaceDapp, alice),
            aliceProvider.wallet,
        )

        // Alice cannot join the space on the stream node.
        await expectUserCannotJoinSpace(spaceId, alice, aliceSpaceDapp, alicesWallet.address)

        // Kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    // This test is commented out as the membership joinSpace does not check linked wallets
    // against the user entitlement.
    test('userEntitlementPass - join as root, linked wallet whitelisted', async () => {
        const {
            alice,
            bob,
            aliceSpaceDapp,
            alicesWallet,
            aliceProvider,
            carolProvider,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: ['carol'], // not alice!
            ruleData: NoopRuleData,
        })
        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        // Alice should be able to join the space on the stream node.
        log('Alice should be able to join space', spaceId)
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // Kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    // This test is commented out as the membership joinSpace does not check linked wallets
    // against the user entitlement.
    test('userEntitlementPass - join as linked wallet, root wallet whitelisted', async () => {
        const {
            alice,
            bob,
            aliceSpaceDapp,
            carolSpaceDapp,
            aliceProvider,
            alicesWallet,
            carolProvider,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: ['carol'], // not alice!
            ruleData: NoopRuleData,
        })

        await linkWallets(carolSpaceDapp, carolProvider.wallet, aliceProvider.wallet)

        // Alice should be able to join the space on the stream node.
        log('Alice should be able to join space', spaceId)
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // Kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('oneNftGateJoinPass - join as root, asset in linked wallet', async () => {
        const {
            alice,
            bob,
            aliceSpaceDapp,
            aliceProvider,
            alicesWallet,
            carolsWallet,
            carolProvider,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: [],
            ruleData: getNftRuleData(testNft1Address as Address),
        })

        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        // join alice
        log('Minting an NFT for carols wallet, which is linked to alices wallet')
        await TestERC721.publicMint('TestNFT1', carolsWallet.address as Address)

        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('oneNftGateJoinPass - join as linked wallet, asset in root wallet', async () => {
        const {
            alice,
            bob,
            aliceSpaceDapp,
            aliceProvider,
            alicesWallet,
            carolsWallet,
            carolProvider,
            carolSpaceDapp,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: [],
            ruleData: getNftRuleData(testNft1Address as Address),
        })

        log("Joining alice's wallet as a linked wallet to carols root wallet")
        await linkWallets(carolSpaceDapp, carolProvider.wallet, aliceProvider.wallet)

        // join alice
        log('Minting an NFT for carols wallet, which is the root to alices wallet')
        await TestERC721.publicMint('TestNFT1', carolsWallet.address as Address)

        log('expect that alice can join the space')
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test.only('oneNftGateJoinPass', async () => {
        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId, channelId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData: getNftRuleData(testNft1Address as Address),
            })

        // join alice
        log('Minting an NFT for alice')
        await TestERC721.publicMint('TestNFT1', alicesWallet.address as Address)

        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('oneNftGateJoinFail', async () => {
        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData: getNftRuleData(testNft1Address as Address),
            })

        log('Alice about to attempt to join space', { alicesUserId: alice.userId })
        const { issued } = await aliceSpaceDapp.joinSpace(
            spaceId,
            alicesWallet.address,
            aliceProvider.wallet,
        )
        expect(issued).toBe(false)

        // Have alice create a user stream attached to her own space.
        // Then she will attempt to join the space from the client, which should fail.
        await createUserStreamAndSyncClient(
            alice,
            aliceSpaceDapp,
            'alice',
            await everyoneMembershipStruct(aliceSpaceDapp, alice),
            aliceProvider.wallet,
        )

        // Alice cannot join the space on the stream node.
        await expectUserCannotJoinSpace(spaceId, alice, aliceSpaceDapp, alicesWallet.address)

        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
    })

    test('twoNftGateJoinPass', async () => {
        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId, channelId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData: twoNftRuleData(testNft1Address, testNft2Address),
            })

        const aliceMintTx1 = TestERC721.publicMint('TestNFT1', alicesWallet.address as Address)
        const aliceMintTx2 = TestERC721.publicMint('TestNFT2', alicesWallet.address as Address)

        log('Minting nfts for alice')
        await Promise.all([aliceMintTx1, aliceMintTx2])

        log('Alice should be able to join space')
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('twoNftGateJoinPass - acrossLinkedWallets', async () => {
        const {
            alice,
            bob,
            aliceSpaceDapp,
            aliceProvider,
            carolProvider,
            alicesWallet,
            carolsWallet,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: [],
            ruleData: twoNftRuleData(testNft1Address, testNft2Address),
        })

        const aliceMintTx1 = TestERC721.publicMint('TestNFT1', alicesWallet.address as Address)
        const carolMintTx2 = TestERC721.publicMint('TestNFT2', carolsWallet.address as Address)

        log('Minting nfts for alice and carol')
        await Promise.all([aliceMintTx1, carolMintTx2])

        log("linking carols wallet to alice's wallet")
        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        log('Alice should be able to join space with one asset in carol wallet')
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('twoNftGateJoinFail', async () => {
        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData: twoNftRuleData(testNft1Address, testNft2Address),
            })

        // join alice
        log('Minting an NFT for alice')
        await TestERC721.publicMint('TestNFT1', alicesWallet.address as Address)

        // first join the space on chain
        const aliceJoinStart = Date.now()
        log('transaction start Alice joining space')
        const { issued } = await aliceSpaceDapp.joinSpace(
            spaceId,
            alicesWallet.address,
            aliceProvider.wallet,
        )
        expect(issued).toBe(false)
        log('Alice failed to join space and has a MembershipNFT', Date.now() - aliceJoinStart)

        // Have alice create her own space so she can initialize her user stream.
        // Then she will attempt to join the space from the client, which should fail.
        await createUserStreamAndSyncClient(
            alice,
            aliceSpaceDapp,
            'alice',
            await everyoneMembershipStruct(aliceSpaceDapp, alice),
            aliceProvider.wallet,
        )
        // Alice cannot join the space on the stream node.
        await expectUserCannotJoinSpace(spaceId, alice, aliceSpaceDapp, alicesWallet.address)

        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
    })

    test('OrOfTwoNftGateJoinPass', async () => {
        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId, channelId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData: twoNftRuleData(testNft1Address, testNft2Address, LogicalOperationType.OR),
            })

        // join alice
        log('Minting an NFT for alice')
        await TestERC721.publicMint('TestNFT1', alicesWallet.address as Address)

        // first join the space on chain
        log('Expect alice can join space')
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('orOfTwoNftOrOneNftGateJoinPass', async () => {
        const params = encodeThresholdParams({ threshold: 1n })
        const leftOperation: Operation = {
            opType: OperationType.CHECK,
            checkType: CheckOperationType.ERC721,
            chainId: 31337n,
            contractAddress: testNft1Address as Address,
            params,
        }

        const rightOperation: Operation = {
            opType: OperationType.CHECK,
            checkType: CheckOperationType.ERC721,
            chainId: 31337n,
            contractAddress: testNft2Address as Address,
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
                contractAddress: testNft3Address as Address,
                params,
            },
        }

        const ruleData = treeToRuleData(root)
        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId, channelId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData,
            })

        log("Mint Alice's NFTs")
        const aliceMintTx1 = TestERC721.publicMint('TestNFT1', alicesWallet.address as Address)
        const aliceMintTx2 = TestERC721.publicMint('TestNFT2', alicesWallet.address as Address)
        await Promise.all([aliceMintTx1, aliceMintTx2])

        log('expect alice can join space')
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        // kill the clients
        const doneStart = Date.now()
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('erc20GateJoinPass', async () => {
        const ruleData = treeToRuleData(await erc20CheckOp('TestERC20', 50n))

        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId, channelId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData,
            })

        // join alice
        log('Minting 100 ERC20 tokens for alice')
        await TestERC20.publicMint('TestERC20', alicesWallet.address as Address, 100)

        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('erc20GateJoinFail', async () => {
        const ruleData = treeToRuleData(await erc20CheckOp('TestERC20', 50n))

        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData,
            })

        // Have alice create her own space so she can initialize her user stream.
        // Then she will attempt to join the space from the client, which should fail.
        await createUserStreamAndSyncClient(
            alice,
            aliceSpaceDapp,
            'alice',
            await everyoneMembershipStruct(aliceSpaceDapp, alice),
            aliceProvider.wallet,
        )

        await expectUserCannotJoinSpace(spaceId, alice, aliceSpaceDapp, alicesWallet.address)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('erc20GateJoinPass - join as root, asset in linked wallet', async () => {
        const ruleData = treeToRuleData(await erc20CheckOp('TestERC20', 50n))
        const {
            alice,
            bob,
            aliceSpaceDapp,
            aliceProvider,
            alicesWallet,
            carolsWallet,
            carolProvider,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: [],
            ruleData: ruleData,
        })

        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        // join alice
        log('Minting 50 ERC20 tokens for carols wallet, which is linked to alices wallet')
        await TestERC20.publicMint('TestERC20', carolsWallet.address as Address, 50)

        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('erc20GateJoinPass - join as linked wallet, asset in root wallet', async () => {
        const ruleData = treeToRuleData(await erc20CheckOp('TestERC20', 50n))
        const {
            alice,
            bob,
            aliceSpaceDapp,
            aliceProvider,
            alicesWallet,
            carolsWallet,
            carolProvider,
            carolSpaceDapp,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: [],
            ruleData: ruleData,
        })

        log("Joining alice's wallet as a linked wallet to carols root wallet")
        await linkWallets(carolSpaceDapp, carolProvider.wallet, aliceProvider.wallet)

        // join alice
        log('Minting an NFT for carols wallet, which is the root to alices wallet')
        await TestERC20.publicMint('TestERC20', carolsWallet.address as Address, 50)

        log('expect that alice can join the space')
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('erc20GateJoinPass - assets across wallets', async () => {
        const ruleData = treeToRuleData(await erc20CheckOp('TestERC20', 50n))
        const {
            alice,
            bob,
            aliceSpaceDapp,
            aliceProvider,
            alicesWallet,
            carolsWallet,
            carolProvider,
            carolSpaceDapp,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: [],
            ruleData: ruleData,
        })

        log("Joining alice's wallet as a linked wallet to carols root wallet")
        await linkWallets(carolSpaceDapp, carolProvider.wallet, aliceProvider.wallet)

        // join alice
        log('Minting an NFT for carols wallet, which is the root to alices wallet')
        await TestERC20.publicMint('TestERC20', carolsWallet.address as Address, 25)
        await TestERC20.publicMint('TestERC20', alicesWallet.address as Address, 25)

        log('expect that alice can join the space')
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('customEntitlementGateJoinPass', async () => {
        const ruleData = treeToRuleData(await customCheckOp('TestCustom'))

        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId, channelId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData,
            })

        // set alice as entitled; she should be able to join.
        await TestCustomEntitlement.setEntitled(
            'TestCustom',
            [alicesWallet.address as Address],
            true,
        )

        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('customEntitlementGateJoinFail', async () => {
        const ruleData = treeToRuleData(await customCheckOp('TestCustom'))
        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData,
            })

        // Have alice create her own space so she can initialize her user stream.
        // Then she will attempt to join the space from the client, which should fail.
        await createUserStreamAndSyncClient(
            alice,
            aliceSpaceDapp,
            'alice',
            await everyoneMembershipStruct(aliceSpaceDapp, alice),
            aliceProvider.wallet,
        )

        await expectUserCannotJoinSpace(spaceId, alice, aliceSpaceDapp, alicesWallet.address)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('customEntitlementGateJoinPass - join as root, asset in linked wallet', async () => {
        const ruleData = treeToRuleData(await customCheckOp('TestCustom'))
        const {
            alice,
            bob,
            aliceSpaceDapp,
            aliceProvider,
            alicesWallet,
            carolsWallet,
            carolProvider,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: [],
            ruleData: ruleData,
        })

        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        // join alice
        log("Setting carol's wallet as entitled")
        await TestCustomEntitlement.setEntitled(
            'TestCustom',
            [carolsWallet.address as Address],
            true,
        )

        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('customEntitlementGateJoinPass - join as linked wallet, asset in root wallet', async () => {
        const contractName = 'TestCustom'
        const customAddress = await TestCustomEntitlement.getContractAddress(contractName)
        const op: Operation = {
            opType: OperationType.CHECK,
            checkType: CheckOperationType.ISENTITLED,
            chainId: 31337n,
            contractAddress: customAddress,
            params: '0x',
        }
        const ruleData = treeToRuleData(op)
        const {
            alice,
            bob,
            aliceSpaceDapp,
            aliceProvider,
            alicesWallet,
            carolsWallet,
            carolProvider,
            carolSpaceDapp,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: [],
            ruleData: ruleData,
        })

        log("Joining alice's wallet as a linked wallet to carols root wallet")
        await linkWallets(carolSpaceDapp, carolProvider.wallet, aliceProvider.wallet)

        // join alice
        log("Setting carol's linked wallet as entitled")
        await TestCustomEntitlement.setEntitled(
            contractName,
            [carolsWallet.address as Address],
            true,
        )

        log('expect that alice can join the space')
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('ethBalanceGateJoinPass', async () => {
        const ruleData = treeToRuleData(nativeCoinBalanceCheckOp(oneEth))

        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId, channelId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData,
            })

        await TestEthBalance.setBalance(alicesWallet.address as Address, twoEth)

        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('ethBalanceGateJoinFail', async () => {
        const ruleData = treeToRuleData(nativeCoinBalanceCheckOp(oneEth))

        const { alice, bob, aliceSpaceDapp, aliceProvider, alicesWallet, spaceId } =
            await createTownWithRequirements({
                everyone: false,
                users: [],
                ruleData,
            })

        // Explicitly set alice's balance to not enough, but not zero, since she has to pay to join
        // the town.
        await TestEthBalance.setBalance(alicesWallet.address as Address, oneHalfEth)

        // Have alice create her own space so she can initialize her user stream.
        // Then she will attempt to join the space from the client, which should fail
        // for permissions reasons.
        await createUserStreamAndSyncClient(
            alice,
            aliceSpaceDapp,
            'alice',
            await everyoneMembershipStruct(aliceSpaceDapp, alice),
            aliceProvider.wallet,
        )

        await expectUserCannotJoinSpace(spaceId, alice, aliceSpaceDapp, alicesWallet.address)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('eth balance gate join pass - join as root, linked wallet entitled', async () => {
        const ruleData = treeToRuleData(nativeCoinBalanceCheckOp(threeEth))
        const {
            alice,
            bob,
            aliceSpaceDapp,
            aliceProvider,
            carolsWallet,
            alicesWallet,
            carolProvider,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: [],
            ruleData,
        })

        // Link carol's wallet to alice's as root
        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        // Alice's wallet balance is insufficient, but carol's is enough.
        await TestEthBalance.setBalance(alicesWallet.address as Address, oneHalfEth)
        await TestEthBalance.setBalance(carolsWallet.address as Address, threeEth)

        // Validate alice can join the space
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('eth balance gated join pass - join as linked wallet, assets in root wallet', async () => {
        const ruleData = treeToRuleData(nativeCoinBalanceCheckOp(oneEth))
        const {
            alice,
            bob,
            aliceSpaceDapp,
            carolSpaceDapp,
            aliceProvider,
            alicesWallet,
            carolsWallet,
            carolProvider,
            spaceId,
            channelId,
        } = await createTownWithRequirements({
            everyone: false,
            users: [],
            ruleData,
        })

        log("Joining alice's wallet as a linked wallet to carol's root wallet")
        await linkWallets(carolSpaceDapp, carolProvider.wallet, aliceProvider.wallet)

        log("Setting carol and alice's wallet balances to 2ETH and .5ETH, respectively")
        await TestEthBalance.setBalance(carolsWallet.address as Address, twoEth)
        await TestEthBalance.setBalance(alicesWallet.address as Address, oneHalfEth)

        log('expect that alice can join the space')
        // Validate alice can join the space
        await expectUserCanJoin(
            spaceId,
            channelId,
            'alice',
            alice,
            aliceSpaceDapp,
            alicesWallet.address,
            aliceProvider.wallet,
        )

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })

    test('eth balance gate join fail - insufficient assets across wallets', async () => {
        const ruleData = treeToRuleData(nativeCoinBalanceCheckOp(threeEth))
        const {
            alice,
            bob,
            carol,
            aliceSpaceDapp,
            carolSpaceDapp,
            aliceProvider,
            carolsWallet,
            alicesWallet,
            carolProvider,
            spaceId,
        } = await createTownWithRequirements({
            everyone: false,
            users: [],
            ruleData,
        })
        // Link carol's wallet to alice's as root
        await linkWallets(aliceSpaceDapp, aliceProvider.wallet, carolProvider.wallet)

        // Set wallet balances to sum to < 3ETH but also be nonzero, as they have to pay to join the town.
        await TestEthBalance.setBalance(carolsWallet.address as Address, oneHalfEth)
        await TestEthBalance.setBalance(alicesWallet.address as Address, oneHalfEth)

        // Have alice and carol create their own space so they can initialize their user streams.
        // Then they will attempt to join the space from the client, which should fail
        // for permissions reasons.
        await createUserStreamAndSyncClient(
            alice,
            aliceSpaceDapp,
            'alice',
            await everyoneMembershipStruct(aliceSpaceDapp, alice),
            aliceProvider.wallet,
        )
        await createUserStreamAndSyncClient(
            carol,
            carolSpaceDapp,
            'carol',
            await everyoneMembershipStruct(carolSpaceDapp, carol),
            carolProvider.wallet,
        )

        log('expect neither alice nor carol can join the space')
        await expectUserCannotJoinSpace(spaceId, alice, aliceSpaceDapp, alicesWallet.address)
        await expectUserCannotJoinSpace(spaceId, carol, carolSpaceDapp, carolsWallet.address)

        const doneStart = Date.now()
        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
        log('Done', Date.now() - doneStart)
    })
})

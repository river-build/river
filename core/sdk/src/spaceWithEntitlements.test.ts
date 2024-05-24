/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/**
 * @group with-entitilements
 */

import {
    getDynamicPricingModule,
    makeDonePromise,
    makeTestClient,
    makeUserContextFromWallet,
    waitFor,
    createUserStreamAndSyncClient,
    createSpaceAndDefaultChannel,
    expectUserCanJoin,
} from './util.test'
import { Client } from './client'
import { dlog } from '@river-build/dlog'
import { makeDefaultChannelStreamId, makeSpaceStreamId, makeUserStreamId } from './id'
import { MembershipOp } from '@river-build/proto'
import { ethers } from 'ethers'
import {
    CheckOperationType,
    ETH_ADDRESS,
    LocalhostWeb3Provider,
    LogicalOperationType,
    MembershipStruct,
    NoopRuleData,
    Operation,
    OperationType,
    Permission,
    createSpaceDapp,
    getContractAddress,
    publicMint,
    treeToRuleData,
    ISpaceDapp,
} from '@river-build/web3'
import { makeBaseChainConfig } from './riverConfig'

const log = dlog('csb:test:spaceWithEntitlements')

async function setupWalletsAndContexts() {
    const baseConfig = makeBaseChainConfig()

    const [alicesWallet, bobsWallet] = await Promise.all([
        ethers.Wallet.createRandom(),
        ethers.Wallet.createRandom(),
    ])

    const [alicesContext, bobsContext] = await Promise.all([
        makeUserContextFromWallet(alicesWallet),
        makeUserContextFromWallet(bobsWallet),
    ])

    const aliceProvider = new LocalhostWeb3Provider(baseConfig.rpcUrl, alicesWallet)
    const bobProvider = new LocalhostWeb3Provider(baseConfig.rpcUrl, bobsWallet)

    await Promise.all([aliceProvider.fundWallet(), bobProvider.fundWallet()])

    const bobSpaceDapp = createSpaceDapp(bobProvider, baseConfig.chainConfig)
    const aliceSpaceDapp = createSpaceDapp(aliceProvider, baseConfig.chainConfig)

    // create a user
    const [alice, bob] = await Promise.all([
        makeTestClient({
            context: alicesContext,
        }),
        makeTestClient({ context: bobsContext }),
    ])

    return {
        alice,
        bob,
        alicesWallet,
        bobsWallet,
        alicesContext,
        bobsContext,
        aliceProvider,
        bobProvider,
        aliceSpaceDapp,
        bobSpaceDapp,
    }
}

describe('spaceWithEntitlements', () => {
    let testNft1Address: string, testNft2Address: string, testNft3Address: string
    beforeAll(async () => {
        ;[testNft1Address, testNft2Address, testNft3Address] = await Promise.all([
            getContractAddress('TestNFT1'),
            getContractAddress('TestNFT2'),
            getContractAddress('TestNFT3'),
        ])
    })

    // Banning with entitlements — users need permission to ban other users.
    test('ownerCanBanOtherUsers', async () => {
        log('start ownerCanBanOtherUsers')
        // set up the web3 provider and spacedap
        const baseConfig = makeBaseChainConfig()

        const bobsWallet = ethers.Wallet.createRandom()
        const bobsContext = await makeUserContextFromWallet(bobsWallet)
        const bobProvider = new LocalhostWeb3Provider(baseConfig.rpcUrl, bobsWallet)
        await bobProvider.fundWallet()
        const bobSpaceDapp = createSpaceDapp(bobProvider, baseConfig.chainConfig)

        // create a user stream
        const bob = await makeTestClient({ context: bobsContext })
        const bobsUserStreamId = makeUserStreamId(bob.userId)

        const pricingModules = await bobSpaceDapp.listPricingModules()
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

        // join alice
        const alicesWallet = ethers.Wallet.createRandom()
        const alicesContext = await makeUserContextFromWallet(alicesWallet)
        const alice = await makeTestClient({
            context: alicesContext,
        })

        const aliceProvider = new LocalhostWeb3Provider(baseConfig.rpcUrl, alicesWallet)
        await aliceProvider.fundWallet()

        const aliceSpaceDapp = createSpaceDapp(aliceProvider, baseConfig.chainConfig)

        // await expect(alice.joinStream(spaceId)).rejects.toThrow() // todo

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

    test('oneNftGateJoinPass - linkedWallet', async () => {
        const createAliceAndBobStart = Date.now()

        const {
            alice,
            bob,
            alicesWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()

        log('createAliceAndBobStart took', Date.now() - createAliceAndBobStart)

        const listPricingModulesStart = Date.now()
        const pricingModules = await bobSpaceDapp.listPricingModules()
        const dynamicPricingModule = getDynamicPricingModule(pricingModules)
        expect(dynamicPricingModule).toBeDefined()

        log('listPricingModules took', Date.now() - listPricingModulesStart)

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
                everyone: false,
                users: [],
                ruleData: {
                    operations: [{ opType: OperationType.CHECK, index: 0 }],
                    checkOperations: [
                        {
                            opType: CheckOperationType.ERC721,
                            chainId: 31337n,
                            contractAddress: testNft1Address,
                            threshold: 1n,
                        },
                    ],
                    logicalOperations: [],
                },
            },
        }

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

        // join alice
        console.log('Minting an NFT for alice')
        await publicMint('TestNFT1', alicesWallet.address as `0x${string}`)

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

    test('oneNftGateJoinPass', async () => {
        const createAliceAndBobStart = Date.now()

        const {
            alice,
            bob,
            alicesWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()

        log('createAliceAndBobStart took', Date.now() - createAliceAndBobStart)

        const listPricingModulesStart = Date.now()
        const pricingModules = await bobSpaceDapp.listPricingModules()
        const dynamicPricingModule = getDynamicPricingModule(pricingModules)
        expect(dynamicPricingModule).toBeDefined()

        log('listPricingModules took', Date.now() - listPricingModulesStart)

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
                everyone: false,
                users: [],
                ruleData: {
                    operations: [{ opType: OperationType.CHECK, index: 0 }],
                    checkOperations: [
                        {
                            opType: CheckOperationType.ERC721,
                            chainId: 31337n,
                            contractAddress: testNft1Address,
                            threshold: 1n,
                        },
                    ],
                    logicalOperations: [],
                },
            },
        }

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

        // join alice
        console.log('Minting an NFT for alice')
        await publicMint('TestNFT1', alicesWallet.address as `0x${string}`)

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
        const createAliceAndBobStart = Date.now()

        const {
            alice,
            bob,
            alicesWallet,
            bobsWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()

        log('createAliceAndBobStart took', Date.now() - createAliceAndBobStart)
        log('aliceWallet', alicesWallet.address)

        const listPricingModulesStart = Date.now()
        const pricingModules = await bobSpaceDapp.listPricingModules()
        const dynamicPricingModule = getDynamicPricingModule(pricingModules)
        expect(dynamicPricingModule).toBeDefined()

        log('listPricingModules took', Date.now() - listPricingModulesStart)

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
                everyone: false,
                users: [],
                ruleData: {
                    operations: [{ opType: OperationType.CHECK, index: 0 }],
                    checkOperations: [
                        {
                            opType: CheckOperationType.ERC721,
                            chainId: 31337n,
                            contractAddress: testNft1Address,
                            threshold: 1n,
                        },
                    ],
                    logicalOperations: [],
                },
            },
        }
        log('transaction start bob creating space')
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

        log('Alice about to join space', { alicesUserId: alice.userId })

        // first join the space on chain
        const aliceJoinStart = Date.now()
        log('transaction start Alice joining space')

        const { issued } = await aliceSpaceDapp.joinSpace(
            spaceId,
            alicesWallet.address,
            aliceProvider.wallet,
        )
        expect(issued).toBe(false)
        log(
            'Alice correctly failed to join space and has a MembershipNFT',
            Date.now() - aliceJoinStart,
        )

        // Have alice create a user stream attached to her own space.
        // Then she will attempt to join the space from the client, which should fail.
        await createUserStreamAndSyncClient(
            alice,
            aliceSpaceDapp,
            'alice',
            membershipInfo,
            aliceProvider.wallet,
        )

        // Alice cannot join the space on the stream node.
        await expect(alice.joinStream(spaceId)).rejects.toThrow(/PERMISSION_DENIED/)

        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
    })

    test('twoNftGateJoinPass', async () => {
        const createAliceAndBobStart = Date.now()

        const {
            alice,
            bob,
            alicesWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()

        const aliceMintTx1 = publicMint('TestNFT1', alicesWallet.address as `0x${string}`)
        const aliceMintTx2 = publicMint('TestNFT2', alicesWallet.address as `0x${string}`)

        log('createAliceAndBobStart took', Date.now() - createAliceAndBobStart)

        const listPricingModulesStart = Date.now()
        const pricingModules = await bobSpaceDapp.listPricingModules()
        const dynamicPricingModule = getDynamicPricingModule(pricingModules)
        expect(dynamicPricingModule).toBeDefined()

        log('listPricingModules took', Date.now() - listPricingModulesStart)

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
        const root: Operation = {
            opType: OperationType.LOGICAL,
            logicalType: LogicalOperationType.AND,
            leftOperation,
            rightOperation,
        }

        const ruleData = treeToRuleData(root)

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
                everyone: false,
                users: [],
                ruleData,
            },
        }
        log('transaction start bob creating space')
        const createSpaceStart = Date.now()
        const transaction = await bobSpaceDapp.createSpace(
            {
                spaceName: 'bobs-space-metadata',
                spaceMetadata: 'bobs-space-metadata',
                channelName: 'general', // default channel name
                membership: membershipInfo,
            },
            bobProvider.wallet,
        )
        log('transaction took', Date.now() - createSpaceStart)
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

    async function twoNftMembershipInfo(
        spaceDapp: ISpaceDapp,
        client: Client,
        nft1Address: string,
        nft2Address: string,
        logOpType: LogicalOperationType.AND | LogicalOperationType.OR = LogicalOperationType.AND,
    ): Promise<MembershipStruct> {
        const listPricingModulesStart = Date.now()
        const pricingModules = await spaceDapp.listPricingModules()
        const dynamicPricingModule = getDynamicPricingModule(pricingModules)
        expect(dynamicPricingModule).toBeDefined()

        const leftOperation: Operation = {
            opType: OperationType.CHECK,
            checkType: CheckOperationType.ERC721,
            chainId: 31337n,
            contractAddress: nft1Address as `0x${string}`,
            threshold: 1n,
        }

        const rightOperation: Operation = {
            opType: OperationType.CHECK,
            checkType: CheckOperationType.ERC721,
            chainId: 31337n,
            contractAddress: nft2Address as `0x${string}`,
            threshold: 1n,
        }
        const root: Operation = {
            opType: OperationType.LOGICAL,
            logicalType: logOpType,
            leftOperation,
            rightOperation,
        }

        const ruleData = treeToRuleData(root)

        return {
            settings: {
                name: 'Everyone',
                symbol: 'MEMBER',
                price: 0,
                maxSupply: 1000,
                duration: 0,
                currency: ETH_ADDRESS,
                feeRecipient: client.userId,
                freeAllocation: 0,
                pricingModule: dynamicPricingModule!.module,
            },
            permissions: [Permission.Read, Permission.Write],
            requirements: {
                everyone: false,
                users: [],
                ruleData,
            },
        }
    }

    test('twoNftGateJoinFail', async () => {
        const createAliceAndBobStart = Date.now()
        const {
            alice,
            bob,
            alicesWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()
        log('createAliceAndBobStart took', Date.now() - createAliceAndBobStart)

        const membershipInfo = await twoNftMembershipInfo(
            bobSpaceDapp,
            bob,
            testNft1Address,
            testNft2Address,
        )

        const {
            spaceId,
            defaultChannelId: channelId,
            userStreamView: bobUserStreamView,
        } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            'bob',
            membershipInfo,
        )

        // join alice
        log('Minting an NFT for alice')
        await publicMint('TestNFT1', alicesWallet.address as `0x${string}`)

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
            membershipInfo,
            aliceProvider.wallet,
        )
        // Alice cannot join the space on the stream node.
        await expect(alice.joinStream(spaceId)).rejects.toThrow('PERMISSION_DENIED')

        // kill the clients
        await bob.stopSync()
        await alice.stopSync()
    })

    test('OrOfTwoNftGateJoinPass', async () => {
        const createAliceAndBobStart = Date.now()

        const {
            alice,
            bob,
            alicesWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()
        log('createAliceAndBobStart took', Date.now() - createAliceAndBobStart)

        const membershipInfo = await twoNftMembershipInfo(
            bobSpaceDapp,
            bob,
            testNft1Address,
            testNft2Address,
            LogicalOperationType.OR,
        )

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

        // join alice
        log('Minting an NFT for alice')
        await publicMint('TestNFT1', alicesWallet.address as `0x${string}`)

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
        const createAliceAndBobStart = Date.now()

        const {
            alice,
            bob,
            alicesWallet,
            aliceProvider,
            bobProvider,
            aliceSpaceDapp,
            bobSpaceDapp,
        } = await setupWalletsAndContexts()

        const aliceMintTx1 = publicMint('TestNFT1', alicesWallet.address as `0x${string}`)
        const aliceMintTx2 = publicMint('TestNFT2', alicesWallet.address as `0x${string}`)

        log('createAliceAndBobStart took', Date.now() - createAliceAndBobStart)

        const listPricingModulesStart = Date.now()
        const pricingModules = await bobSpaceDapp.listPricingModules()
        const dynamicPricingModule = getDynamicPricingModule(pricingModules)
        expect(dynamicPricingModule).toBeDefined()

        log('listPricingModules took', Date.now() - listPricingModulesStart)

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

        // create a space stream,
        log('Bob created user, about to create space', ruleData, ruleData)
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
                everyone: false,
                users: [],
                ruleData,
            },
        }
        const {
            spaceId,
            defaultChannelId: channelId,
            userStreamView: bobUserStreamView,
        } = await createSpaceAndDefaultChannel(
            bob,
            bobSpaceDapp,
            bobProvider.wallet,
            'bob',
            membershipInfo,
        )

        log("Mint Alice's NFTs")
        await Promise.all([aliceMintTx1, aliceMintTx2])

        // first join the space on chain
        const aliceJoinStart = Date.now()

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
})

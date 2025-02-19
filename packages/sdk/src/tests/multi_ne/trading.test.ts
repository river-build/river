import { Client } from '../../client'
import { makeUniqueChannelStreamId } from '../../id'
import {
    getXchainConfigForTesting,
    makeTestClient,
    makeUniqueSpaceStreamId,
    makeUserContextFromWallet,
    waitFor,
} from '../testUtils'
import { ContractReceipt } from '../../types'
import { PlainMessage } from '@bufbuild/protobuf'
import { bin_fromHexString } from '@river-build/dlog'
import { ethers } from 'ethers'
import { BlockchainTransaction_Transfer } from '@river-build/proto'
import { Address, TestERC20 } from '@river-build/web3'
import { bytesToHex } from 'ethereum-cryptography/utils'

describe('Trading', () => {
    const tokenName = 'Erc20 token test'
    let bobsClient: Client
    const bobWallet = ethers.Wallet.createRandom()
    let bobAddress: Address

    let aliceClient: Client
    const aliceWallet = ethers.Wallet.createRandom()
    let aliceAddress: Address

    let charlieClient: Client

    let spaceId!: string
    let channelId!: string
    let threadParentId!: string
    let tokenAddress: string
    let receipt: ContractReceipt
    const amountToTransfer = 10n

    const provider = new ethers.providers.StaticJsonRpcProvider(
        getXchainConfigForTesting().supportedRpcUrls[31337],
    )

    beforeAll(async () => {
        // boilerplate — create clients, join streams, etc.
        const bobContext = await makeUserContextFromWallet(bobWallet)
        bobsClient = await makeTestClient({ context: bobContext })
        await bobsClient.initializeUser()
        bobsClient.startSync()
        bobAddress = ('0x' + bytesToHex(bobsClient.signerContext.creatorAddress)) as Address

        const aliceContext = await makeUserContextFromWallet(aliceWallet)
        aliceClient = await makeTestClient({ context: aliceContext })
        await aliceClient.initializeUser()
        aliceClient.startSync()
        aliceAddress = ('0x' + bytesToHex(aliceClient.signerContext.creatorAddress)) as Address

        spaceId = makeUniqueSpaceStreamId()
        await bobsClient.createSpace(spaceId)
        channelId = makeUniqueChannelStreamId(spaceId)
        await bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId)
        await aliceClient.joinStream(spaceId)
        await aliceClient.joinStream(channelId)

        charlieClient = await makeTestClient()
        await charlieClient.initializeUser()
        charlieClient.startSync()
        await charlieClient.joinStream(spaceId)
        await charlieClient.joinStream(channelId)

        const result = await bobsClient.sendMessage(channelId, 'try out this token: $yo!')
        threadParentId = result.eventId

        /* Time to perform an on-chain transaction! We utilize the fact that transfers emit 
        a Transfer event, Transfer(address,address,amount) to be precise. Regardless of how 
        the tx was made (dex, transfer etc), an event will be available in the tx logs!
        here we go, Bob transfers an amount of tokens to Alice.
        */
        tokenAddress = await TestERC20.getContractAddress(tokenName)
        await TestERC20.publicMint(tokenName, bobAddress, 100)
        const { transactionHash } = await TestERC20.transfer(
            tokenName,
            aliceAddress,
            bobWallet.privateKey as `0x${string}`,
            amountToTransfer,
        )

        const transaction = await provider.getTransaction(transactionHash)
        const transactionReceipt = await provider.getTransactionReceipt(transactionHash)

        receipt = {
            from: transaction.from,
            to: transaction.to!,
            transactionHash: transaction.hash,
            blockNumber: transaction.blockNumber!,
            logs: transactionReceipt.logs,
        }
    })

    test('should reject token transfers where the amount doesnt match the transferred amount', async () => {
        // this is a transfer event with an amount that doesn't match the amount transferred
        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: 9n.toString(),
            address: bin_fromHexString(tokenAddress),
            sender: bin_fromHexString(bobsClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
        }

        await expect(
            bobsClient.addTransaction_Transfer(31337, receipt, transferEvent),
        ).rejects.toThrow('matching transfer event not found in receipt logs')
    })

    test('should reject token transfers where the user is neither the sender nor the recipient', async () => {
        // this is a transfer event from charlie, he's barely a member of the channel
        // and he's not the sender nor the recipient
        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: amountToTransfer.toString(),
            address: bin_fromHexString(tokenAddress),
            sender: bin_fromHexString(charlieClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
        }

        await expect(
            charlieClient.addTransaction_Transfer(31337, receipt, transferEvent),
        ).rejects.toThrow('matching transfer event not found in receipt logs')
    })

    test('should accept token transfers where the user == from', async () => {
        // this is a transfer event from bob, he's the sender (from)
        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: amountToTransfer.toString(),
            address: bin_fromHexString(tokenAddress),
            sender: bin_fromHexString(bobsClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
        }

        const { eventId } = await bobsClient.addTransaction_Transfer(31337, receipt, transferEvent)
        expect(eventId).toBeDefined()

        await waitFor(() =>
            expect(
                bobsClient.streams.get(channelId)?.view.timeline.some((m) => m.hashStr === eventId),
            ).toBeDefined(),
        )
    })

    test('should accept token transfers where the user == to', async () => {
        // this is a transfer event to alice, she's the recipient (to)
        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: amountToTransfer.toString(),
            address: bin_fromHexString(tokenAddress),
            sender: bin_fromHexString(aliceClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
        }

        const { eventId } = await aliceClient.addTransaction_Transfer(31337, receipt, transferEvent)
        expect(eventId).toBeDefined()

        await waitFor(() =>
            expect(
                bobsClient.streams.get(channelId)?.view.timeline.some((m) => m.hashStr === eventId),
            ).toBeDefined(),
        )
    })

    test('should reject duplicate transfers', async () => {
        // alice can't add the same transfer event twice
        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: amountToTransfer.toString(),
            address: bin_fromHexString(tokenAddress),
            sender: bin_fromHexString(aliceClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
        }

        await expect(
            aliceClient.addTransaction_Transfer(31337, receipt, transferEvent),
        ).rejects.toThrow('duplicate transaction')
    })
})

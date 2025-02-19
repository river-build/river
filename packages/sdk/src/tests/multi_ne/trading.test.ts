import { Client } from '../../client'
import { makeUniqueChannelStreamId } from '../../id'
import {
    getXchainConfigForTesting,
    makeTestClient,
    makeUniqueSpaceStreamId,
    makeUserContextFromWallet,
    waitFor,
} from '../testUtils'
import { ContractReceipt, StreamTimelineEvent } from '../../types'
import { PlainMessage } from '@bufbuild/protobuf'
import { bin_fromHexString } from '@river-build/dlog'
import { ethers } from 'ethers'
import { BlockchainTransaction_Transfer } from '@river-build/proto'
import { TestERC20 } from '@river-build/web3'

describe('Trading', () => {
    const tokenName = 'Erc20 token test'
    let bobClient: Client
    const bobWallet = ethers.Wallet.createRandom()

    let aliceClient: Client
    const aliceWallet = ethers.Wallet.createRandom()

    let charlieClient: Client

    let spaceId!: string
    let channelId!: string
    let threadParentId!: string
    let tokenAddress: string
    let buyReceipt: ContractReceipt
    let sellReceipt: ContractReceipt
    const amountToTransfer = 10n

    const provider = new ethers.providers.StaticJsonRpcProvider(
        getXchainConfigForTesting().supportedRpcUrls[31337],
    )

    beforeAll(async () => {
        // boilerplate — create clients, join streams, etc.
        const bobContext = await makeUserContextFromWallet(bobWallet)
        bobClient = await makeTestClient({ context: bobContext })
        await bobClient.initializeUser()
        bobClient.startSync()

        const aliceContext = await makeUserContextFromWallet(aliceWallet)
        aliceClient = await makeTestClient({ context: aliceContext })
        await aliceClient.initializeUser()
        aliceClient.startSync()

        spaceId = makeUniqueSpaceStreamId()
        await bobClient.createSpace(spaceId)
        channelId = makeUniqueChannelStreamId(spaceId)
        await bobClient.createChannel(spaceId, 'Channel', 'Topic', channelId)
        await aliceClient.joinStream(spaceId)
        await aliceClient.joinStream(channelId)

        charlieClient = await makeTestClient()
        await charlieClient.initializeUser()
        charlieClient.startSync()
        await charlieClient.joinStream(spaceId)
        await charlieClient.joinStream(channelId)

        const result = await bobClient.sendMessage(channelId, 'try out this token: $yo!')
        threadParentId = result.eventId

        /* Time to perform an on-chain transaction! We utilize the fact that transfers emit 
        a Transfer event, Transfer(address,address,amount) to be precise. Regardless of how 
        the tx was made (dex, transfer etc), an event will be available in the tx logs!
        here we go, Bob transfers an amount of tokens to Alice.
        */
        tokenAddress = await TestERC20.getContractAddress(tokenName)
        await TestERC20.publicMint(tokenName, bobClient.userId as `0x${string}`, 100)
        const { transactionHash: sellTransactionHash } = await TestERC20.transfer(
            tokenName,
            aliceClient.userId as `0x${string}`,
            bobWallet.privateKey as `0x${string}`,
            amountToTransfer,
        )

        const sellTransaction = await provider.getTransaction(sellTransactionHash)
        const sellTransactionReceipt = await provider.getTransactionReceipt(sellTransactionHash)

        sellReceipt = {
            from: sellTransaction.from,
            to: sellTransaction.to!,
            transactionHash: sellTransaction.hash,
            blockNumber: sellTransaction.blockNumber!,
            logs: sellTransactionReceipt.logs,
        }

        const { transactionHash: buyTransactionHash } = await TestERC20.transfer(
            tokenName,
            aliceClient.userId as `0x${string}`,
            bobWallet.privateKey as `0x${string}`,
            amountToTransfer,
        )

        const buyTransaction = await provider.getTransaction(buyTransactionHash)
        const buyTransactionReceipt = await provider.getTransactionReceipt(buyTransactionHash)

        buyReceipt = {
            from: buyTransaction.from,
            to: buyTransaction.to!,
            transactionHash: buyTransaction.hash,
            blockNumber: buyTransaction.blockNumber!,
            logs: buyTransactionReceipt.logs,
        }
    })

    test('should reject token transfers where the amount doesnt match the transferred amount', async () => {
        // this is a transfer event with an amount that doesn't match the amount transferred
        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: 9n.toString(),
            address: bin_fromHexString(tokenAddress),
            sender: bin_fromHexString(bobClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
            isBuy: false,
        }

        await expect(
            bobClient.addTransaction_Transfer(31337, sellReceipt, transferEvent),
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
            isBuy: true,
        }

        await expect(
            charlieClient.addTransaction_Transfer(31337, buyReceipt, transferEvent),
        ).rejects.toThrow('matching transfer event not found in receipt logs')
    })

    test('should reject token transfers where the user claims to be the buyer but is the seller', async () => {
        // this is a transfer event from charlie, he's barely a member of the channel
        // and he's not the sender nor the recipient
        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: amountToTransfer.toString(),
            address: bin_fromHexString(tokenAddress),
            sender: bin_fromHexString(bobClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
            isBuy: true,
        }

        await expect(
            bobClient.addTransaction_Transfer(31337, buyReceipt, transferEvent),
        ).rejects.toThrow('matching transfer event not found in receipt logs')
    })

    test('should reject token transfers where the user claims to be the seller but is the seller', async () => {
        // this is a transfer event from charlie, he's barely a member of the channel
        // and he's not the sender nor the recipient
        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: amountToTransfer.toString(),
            address: bin_fromHexString(tokenAddress),
            sender: bin_fromHexString(aliceClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
            isBuy: false,
        }

        await expect(
            aliceClient.addTransaction_Transfer(31337, sellReceipt, transferEvent),
        ).rejects.toThrow('matching transfer event not found in receipt logs')
    })

    test('should accept token transfers where the user == from and isBuy == false', async () => {
        // this is a transfer event from bob, he's the sender (from)
        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: amountToTransfer.toString(),
            address: bin_fromHexString(tokenAddress),
            sender: bin_fromHexString(bobClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
            isBuy: false,
        }

        const { eventId } = await bobClient.addTransaction_Transfer(
            31337,
            sellReceipt,
            transferEvent,
        )
        expect(eventId).toBeDefined()

        await waitFor(() =>
            expect(extractMemberBlockchainTransactions(bobClient, channelId).length).toBe(1),
        )
    })

    test('should accept token transfers where the user == to and isBuy == true', async () => {
        // this is a transfer event to alice, she's the recipient (to)
        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: amountToTransfer.toString(),
            address: bin_fromHexString(tokenAddress),
            sender: bin_fromHexString(aliceClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
            isBuy: true,
        }

        const { eventId } = await aliceClient.addTransaction_Transfer(
            31337,
            buyReceipt,
            transferEvent,
        )
        expect(eventId).toBeDefined()

        await waitFor(() =>
            expect(extractMemberBlockchainTransactions(aliceClient, channelId).length).toBe(2),
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
            isBuy: true,
        }

        await expect(
            aliceClient.addTransaction_Transfer(31337, buyReceipt, transferEvent),
        ).rejects.toThrow('duplicate transaction')
    })

    test('alice sees transfer event in her user stream', async () => {
        await waitFor(() => {
            const streamId = aliceClient.userStreamId!
            const stream = aliceClient.streams.get(streamId)
            if (!stream) throw new Error('no stream found')

            const transferEvents = extractBlockchainTransactionTransferEvents(stream.view.timeline)
            expect(transferEvents.length).toBe(1)
            const event0 = transferEvents[0]
            expect(BigInt(event0!.amount)).toBe(amountToTransfer)
        })
    })

    test('bob sees transfer event in his user stream', async () => {
        await waitFor(() => {
            const streamId = bobClient.userStreamId!
            const stream = bobClient.streams.get(streamId)
            if (!stream) throw new Error('no stream found')

            const transferEvents = extractBlockchainTransactionTransferEvents(stream.view.timeline)
            expect(transferEvents.length).toBe(1)
            const event0 = transferEvents[0]
            expect(BigInt(event0!.amount)).toBe(amountToTransfer)
            expect(new Uint8Array(event0!.sender)).toEqual(bin_fromHexString(bobClient.userId))
        })
    })

    test('bob sees both transfer events in the channel stream', async () => {
        await waitFor(() => {
            const transferEvents = extractMemberBlockchainTransactions(aliceClient, channelId)
            expect(transferEvents.length).toBe(2)
            const [event0, event1] = [transferEvents[0], transferEvents[1]]
            expect(BigInt(event0!.amount)).toBe(amountToTransfer)
            expect(new Uint8Array(event0!.sender)).toEqual(bin_fromHexString(bobClient.userId))
            expect(event0!.isBuy).toBe(false)
            expect(BigInt(event1!.amount)).toBe(amountToTransfer)
            expect(new Uint8Array(event1!.sender)).toEqual(bin_fromHexString(aliceClient.userId))
            expect(event1!.isBuy).toBe(true)
        })
    })
})

function extractBlockchainTransactionTransferEvents(timeline: StreamTimelineEvent[]) {
    return timeline
        .map((e) => {
            if (
                e.remoteEvent?.event.payload.case === 'userPayload' &&
                e.remoteEvent?.event.payload.value.content.case === 'blockchainTransaction' &&
                e.remoteEvent?.event.payload.value.content.value.content.case === 'transfer'
            ) {
                return e.remoteEvent?.event.payload.value.content.value.content.value
            }
            return undefined
        })
        .filter((e) => e !== undefined)
}

function extractMemberBlockchainTransactions(client: Client, channelId: string) {
    const stream = client.streams.get(channelId)
    if (!stream) throw new Error('no stream found')

    return stream.view.timeline
        .map((e) => {
            if (
                e.remoteEvent?.event.payload.case === 'memberPayload' &&
                e.remoteEvent?.event.payload.value.content.case === 'memberBlockchainTransaction' &&
                e.remoteEvent.event.payload.value.content.value.transaction?.content.case ===
                    'transfer'
            ) {
                return e.remoteEvent.event.payload.value.content.value.transaction.content.value
            }
            return undefined
        })
        .filter((e) => e !== undefined)
}

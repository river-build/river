import { Client } from '../../client'
import { makeUniqueChannelStreamId } from '../../id'
import {
    getXchainConfigForTesting,
    makeRandomUserAddress,
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

        charlieClient = await makeTestClient()
        spaceId = makeUniqueSpaceStreamId()
        await bobsClient.createSpace(spaceId)
        channelId = makeUniqueChannelStreamId(spaceId)
        await bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId)
        await aliceClient.joinStream(spaceId)
        await aliceClient.joinStream(channelId)

        const result = await bobsClient.sendMessage(channelId, 'try out this token: $yo!')
        threadParentId = result.eventId

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

    test('should accept token transfers where the user is the sender', async () => {
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

    test('should accept token transfers where the user is the recipient', async () => {
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
})

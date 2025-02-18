import { Client } from '../../client'
import { makeUniqueChannelStreamId } from '../../id'
import { makeTestClient, makeUniqueSpaceStreamId } from '../testUtils'
import { ContractReceipt } from '../../types'
import { PlainMessage } from '@bufbuild/protobuf'

import { bin_fromHexString } from '@river-build/dlog'
import { ethers } from 'ethers'
import { BlockchainTransaction_Transfer } from '@river-build/proto'

describe('Trading', () => {
    let bobsClient: Client
    let spaceId!: string
    let channelId!: string
    let threadParentId!: string
    beforeAll(async () => {
        bobsClient = await makeTestClient()
        await bobsClient.initializeUser()
        bobsClient.startSync()

        spaceId = makeUniqueSpaceStreamId()
        await bobsClient.createSpace(spaceId)
        channelId = makeUniqueChannelStreamId(spaceId)
        await bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId)

        const result = await bobsClient.sendMessage(channelId, 'Very bad message!')
        threadParentId = result.eventId
    })

    test('should accept token transfers', async () => {
        const sepoliaUrl = 'https://sepolia.base.org'
        const provider = new ethers.providers.StaticJsonRpcProvider(sepoliaUrl)
        const tokenAddress = '0xe4ab69c077896252fafbd49efd26b5d171a32410'
        const txHash = '0x3d9ef1ad272f2036c1d6e2109dfb32cb8b470822dc91b2aff571d84a08e204ee'
        const transaction = await provider.getTransaction(txHash)
        const transactionReceipt = await provider.getTransactionReceipt(txHash)

        const amount = 25000000000000000000n
        const receipt: ContractReceipt = {
            from: transaction.from,
            to: transaction.to!,
            transactionHash: transaction.hash,
            blockNumber: transaction.blockNumber!,
            logs: transactionReceipt.logs,
        }

        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: amount.toString(),
            address: bin_fromHexString(tokenAddress),
            sender: bin_fromHexString(bobsClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
        }

        const res = await bobsClient.addTransaction_Transfer(84532, receipt, transferEvent)
        expect(res).toBeDefined()
    })
})

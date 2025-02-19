import { Client } from '../../client'
import { makeTestClient, makeUniqueSpaceStreamId } from '../testUtils'
import { makeUniqueChannelStreamId } from '../../id'
import { PlainMessage } from '@bufbuild/protobuf'
import { BlockchainTransaction_Transfer } from '@river-build/proto'
import { SolanaTransactionReceipt } from '../../types'
import { bin_fromHexString, bin_fromString } from '@river-build/dlog'

describe('Trading Solana', () => {
    let bobClient: Client
    let aliceClient: Client

    let spaceId!: string
    let channelId!: string
    let threadParentId!: string

    beforeAll(async () => {
        bobClient = await makeTestClient()
        await bobClient.initializeUser()
        bobClient.startSync()
        aliceClient = await makeTestClient()
        await aliceClient.initializeUser()
        aliceClient.startSync()
        spaceId = makeUniqueSpaceStreamId()
        await bobClient.createSpace(spaceId)
        channelId = makeUniqueChannelStreamId(spaceId)
        await bobClient.createChannel(spaceId, 'Channel', 'Topic', channelId)
        await aliceClient.joinStream(spaceId)
        await aliceClient.joinStream(channelId)

        const result = await bobClient.sendMessage(channelId, 'try out this token: $yo!')
        threadParentId = result.eventId
    })

    test('Solana transactions are accepted if the amount, mint and owner are valid', async () => {
        const signature =
            '4uPV4YciNkRoRqaN5bsDw4HzPTCuavM94sbdaZPkaVVEXkyaNNT4KLpuvwBsyJUkzzzjLXpVx88dRswJ6tRp41VG'

        const receipt: SolanaTransactionReceipt = {
            transaction: { signatures: [signature] },
            meta: {
                preTokenBalances: [
                    {
                        amount: { amount: '4804294168682', decimals: 9 },
                        mint: '2HQXvda5sUjGLRKLG6LEqSctARYJboufSfG2Qciqmoon',
                        owner: '3cfwgyZY7uLNEv72etBQArWSoTzmXEm7aUmW3xE5xG4P',
                    },
                ],
                postTokenBalances: [
                    {
                        amount: { amount: '0', decimals: 9 },
                        mint: '2HQXvda5sUjGLRKLG6LEqSctARYJboufSfG2Qciqmoon',
                        owner: '3cfwgyZY7uLNEv72etBQArWSoTzmXEm7aUmW3xE5xG4P',
                    },
                ],
            },
            slot: 123n,
        }

        const transferEvent: PlainMessage<BlockchainTransaction_Transfer> = {
            amount: 4804294168682n.toString(),
            address: bin_fromString('2HQXvda5sUjGLRKLG6LEqSctARYJboufSfG2Qciqmoon'),
            sender: bin_fromHexString(bobClient.userId),
            messageId: bin_fromHexString(threadParentId),
            channelId: bin_fromHexString(channelId),
            isBuy: false,
        }

        await bobClient.addTransaction_Transfer(1151111081099710, receipt, transferEvent)
    })
})

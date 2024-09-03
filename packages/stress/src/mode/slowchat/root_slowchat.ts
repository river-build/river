import { RiverConfig } from '@river-build/sdk'
import { Wallet } from 'ethers'
import { dlogger } from '@river-build/dlog'
import { getChatConfig } from '../common/common'
import { makeStressClient } from '../../utils/stressClient'
import { kickoffChat } from '../chat/kickoffChat'
import { slowChat } from './slowChat'
import { waitForAllIn } from './waitForAllIn'
import { joinSlowChat } from './joinSlowChat'

/*
 * Starts a slowchat stress test.
 * This test generates a range of wallets from a seed phrase and logs the addresses.
 * loop over wallets one by one
 */
export async function startStressSlowChat(opts: {
    config: RiverConfig
    processIndex: number
    rootWallet: Wallet
}) {
    const logger = dlogger(`stress:run:${opts.processIndex}`)
    logger.log('startStressSlowChat')
    const chatConfig = getChatConfig(opts)

    const clients = await Promise.all(
        chatConfig.localClients.wallets.map((wallet, i) =>
            makeStressClient(
                opts.config,
                chatConfig.localClients.startIndex + i,
                wallet,
                chatConfig.globalPersistedStore,
            ),
        ),
    )

    if (chatConfig.processIndex === 0) {
        await kickoffChat(clients[0], chatConfig)
    }

    for (const client of clients) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        await joinSlowChat(client, chatConfig)
    }

    await waitForAllIn(clients[0], chatConfig)

    const results = await Promise.allSettled(clients.map((client) => slowChat(client, chatConfig)))

    results.forEach((r, index) => {
        if (r.status === 'rejected') {
            logger.error(`${clients[index].logId} error calling chitChat`, r.reason)
        }
    })

    logger.log('done')

    for (let i = 0; i < clients.length; i += 1) {
        const client = clients[i]
        logger.log(`stopping ${client.logId}`)
        await client.stop()
    }

    await chatConfig.globalPersistedStore?.close()
}

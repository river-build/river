import 'fake-indexeddb/auto' // used to mock indexdb in dexie, don't remove

import { ethers } from 'ethers'
import { env } from './environment'
import { Bot } from '@river-build/sdk'


async function main() {
    console.log(
        '\nstarting bot \nriver env:',
        env.RIVER_ENV,
        '\nspace id:',
        env.SPACE_ID,
        '\nchannel id:',
        env.CHANNEL_ID,
    )

    const spaceId = env.SPACE_ID
    const channelId = env.CHANNEL_ID
    const bot = new Bot(ethers.Wallet.fromMnemonic(env.MNEMONIC))
    const syncAgent = await bot.makeSyncAgent()
    await syncAgent.start()
    
    // stop the sync agent on SIGINT and SIGTERM
    process.on('SIGINT', async () => {
        await syncAgent.stop()
        process.exit()
    })
    process.on('SIGTERM', async () => {
        await syncAgent.stop()
        process.exit()
    })
    
    // make sure the spaces are loaded
    await syncAgent.spaces.when((spaces) => {
        return spaces.status === 'loaded'
    })
    
    const channel = syncAgent.spaces.getSpace(spaceId).getChannel(channelId)
    let latestEventTimestamp = BigInt(new Date().getTime())
    
    while (true) {
        try {
            await channel.timeline.events.when(
                (events) => {
                    const event = events.find((event) => {
                        // ignore events that are not new, or don't have text, or are not decrypted
                        if (event.createdAtEpochMs <= latestEventTimestamp || !event.text || !event.isDecryptedEvent) {
                          return false;
                        }

                        latestEventTimestamp = event.createdAtEpochMs;
                        // ignore events created by the bot
                        return event.creatorUserId !== bot.userId;
                    })

                    if (!event) {
                        return false
                    }

                    if (event.text === '/gm') {
                        channel.sendMessage('Good Morning!')
                    }
                    return true
                },
                { timeoutMs: 300_000_000 },
            )
        } catch (e) {
            console.error('error in the loop, retrying...', e)
            // retry in 3 seconds
            await new Promise((resolve) => setTimeout(resolve, 3000))
        }
    }
}

main().catch((e) => {
    console.error('error in main', e)
})

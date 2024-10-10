import { dlogger } from '@river-build/dlog'
import { StressClient } from '../../utils/stressClient'
import { ChatConfig } from '../common/types'

export const getRandomClients = (clients: StressClient[], count: number) => {
    return clients.toSorted(() => 0.5 - Math.random()).slice(0, count)
}

export async function gdmChat(client: StressClient, membersIds: string[], cfg: ChatConfig) {
    const logger = dlogger(`stress:gdmchat:${client.logId}`)

    const { streamId } = await client.agent.gdms.createGDM(membersIds)
    const gdm = client.agent.gdms.getGdm(streamId)

    // for cfg.duration seconds, randomly every 1-5 seconds, send a message to one of cfg.channelIds
    const end = Date.now() + cfg.duration * 1000
    // wait at least 1 second between messages across all clients
    const averateWaitTime = 1000 * membersIds.length * 2
    logger.log('gdmChitChat', { chattingUntil: end, averageWait: averateWaitTime })
    while (Date.now() < end) {
        await gdm.sendMessage(`hello ${client.userId}`)
        await new Promise((resolve) => setTimeout(resolve, Math.random() * averateWaitTime))
    }
}

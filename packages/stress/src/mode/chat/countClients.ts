import { dlogger } from '@river-build/dlog'
import type { StressClient } from '../../utils/stressClient'

const logger = dlogger('stress:clients')

export const updateCountClients = async (
    client: StressClient,
    announceChannelId: string,
    countClientsMessageEventId: string,
    totalClients: number,
    reactionCounts: number,
) => {
    logger.info(`Clients: ${reactionCounts}/${totalClients} 🤖`)
    return await client.streamsClient.sendChannelMessage_Edit_Text(
        announceChannelId,
        countClientsMessageEventId,
        {
            content: {
                body: `Clients: ${reactionCounts}/${totalClients} 🤖`,
                mentions: [],
                attachments: [],
            },
        },
    )
}

export const countReactions = async (
    client: StressClient,
    announceChannelId: string,
    rootMessageId: string,
) => {
    const channel = await client.streamsClient.waitForStream(announceChannelId)
    const message = await client.waitFor(() => channel.view.events.get(rootMessageId))
    if (!message) {
        return 0
    }

    const reactions = channel.view.timeline.filter((event) => {
        if (event.localEvent?.channelMessage.payload.case === 'reaction') {
            return event.localEvent?.channelMessage.payload.value.refEventId === rootMessageId
        }
        if (
            event.decryptedContent?.kind === 'channelMessage' &&
            event.decryptedContent?.content.payload.case === 'reaction'
        ) {
            return event.decryptedContent?.content.payload.value.refEventId === rootMessageId
        }
        return
    })

    return reactions.length
}

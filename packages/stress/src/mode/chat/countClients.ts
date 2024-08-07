import type { StressClient } from '../../utils/stressClient'

export const updateCountClients = async (
    client: StressClient,
    announceChannelId: string,
    countClientsMessageEventId: string,
    totalClients: number,
    reactionCounts: number,
) => {
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

    let reactionCount = 0
    channel.view.timeline.forEach((event) => {
        if (
            event.localEvent?.channelMessage.payload.case === 'reaction' &&
            event.localEvent?.channelMessage.payload.value.refEventId === rootMessageId
        ) {
            reactionCount++
        }
    })

    return reactionCount
}

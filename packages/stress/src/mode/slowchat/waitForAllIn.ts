import { check, dlogger } from '@river-build/dlog'
import type { StressClient } from '../../utils/stressClient'
import { ChatConfig } from '../common/types'
import { isDefined } from '@river-build/sdk'

export async function waitForAllIn(rootClient: StressClient, chatConfig: ChatConfig) {
    const logger = dlogger(`stress:statsReporter:${rootClient.logId}`)
    const lastReactionCount = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
        check(isDefined(chatConfig.kickoffMessageEventId), 'kickoffMessageEventId')

        const reactionCount = countReactions(
            rootClient,
            chatConfig.announceChannelId,
            chatConfig.kickoffMessageEventId,
        )
        if (lastReactionCount !== reactionCount) {
            logger.log(`waiting for allin: ${reactionCount}/${chatConfig.clientsCount}`)
        }
        if (reactionCount >= chatConfig.clientsCount) {
            break
        }
        await new Promise((resolve) => setTimeout(resolve, 500))
    }
}

const countReactions = (client: StressClient, announceChannelId: string, rootMessageId: string) => {
    const channel = client.streamsClient.stream(announceChannelId)
    if (!channel) {
        return 0
    }
    const message = channel.view.events.get(rootMessageId)
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

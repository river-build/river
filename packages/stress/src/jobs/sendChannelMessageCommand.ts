import { StressClient } from '../utils/stressClient'
import { ChatConfig } from '../mode/common/types'
import { Job } from 'bullmq'

function escapeMessage(template: string, client: StressClient, cfg: ChatConfig): string {
    let escaped = template.replaceAll('${SESSION_ID}', cfg.sessionId)
    escaped = escaped.replaceAll('${CLIENT_ID}', client.logId)
    escaped = escaped.replaceAll('${CLIENT_INDEX}', client.clientIndex.toString())
    return escaped
}

export async function sendChannelMessage(
    job: Job,
    client: StressClient,
    cfg: ChatConfig,
) {
    const params: {
        channelId: string,
        messages: string[],
    } = job.data

    const logger = client.logger.child({
        name: 'sendChannelMessage',
        logId: client.logId,
        params,
    })

    logger.info({}, 'sending channel messages')

    const isChannelMember = await client.isMemberOf(params.channelId)
    if (!isChannelMember) {
        await client.streamsClient.joinStream(params.channelId)
    }

    for (const messageTemplate of params.messages) {
        const message = escapeMessage(messageTemplate, client, cfg)
        await client.sendMessage(params.channelId, message)
    }
}

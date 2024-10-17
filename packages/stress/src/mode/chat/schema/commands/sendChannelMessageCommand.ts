import { z } from 'zod'
import { baseCommand } from './baseCommand'
import { StressClient } from '../../../../utils/stressClient'
import { ChatConfig } from '../../../common/types'

export const sendChannelMessageParams = z.object({
    channelId: z.string(),
    messages: z.array(z.string()),
})

export const sendChannelMessageCommand = baseCommand.extend({
    name: z.literal('sendChannelMessage'),
    params: sendChannelMessageParams,
})

export type SendChannelMessageParams = z.infer<typeof sendChannelMessageParams>

export type SendChannelMessageCommand = z.infer<typeof sendChannelMessageCommand>

function escapeMessage(template: string, client: StressClient, cfg: ChatConfig): string {
    let escaped = template.replaceAll('${SESSION_ID}', cfg.sessionId)
    escaped = escaped.replaceAll('${CLIENT_ID}', client.logId)
    escaped = escaped.replaceAll('${CLIENT_INDEX}', client.clientIndex.toString())
    return escaped
}

export async function sendChannelMessage(
    client: StressClient,
    cfg: ChatConfig,
    params: SendChannelMessageParams,
) {
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

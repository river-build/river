import { z } from 'zod'
import { baseCommand } from './baseCommand'
import { StressClient } from '../../../../utils/stressClient'
import { ChatConfig } from '../../../common/types'
import { channelMessagePostWhere } from '../../../../utils/timeline'
import { Stream } from '@river-build/sdk'
import { Logger } from 'pino'
import { ExecutionError } from './ExecutionError'

const expectedMessage = z.object({
    content: z.string(),
    sender: z.string().optional(),
})

const paramsSchema = z.object({
    channelId: z.string(),
    timeoutMs: z.number().nonnegative().optional(),
    messages: z.array(expectedMessage),
})

export const expectChannelMessageCommand = baseCommand.extend({
    name: z.literal('expectChannelMessage'),
    params: paramsSchema,
})

export type ExpectChannelMessageParams = z.infer<typeof paramsSchema>
export type ExpectChannelMessageCommand = z.infer<typeof expectChannelMessageCommand>

function escapeMessage(template: string, client: StressClient, cfg: ChatConfig): string {
    return template.replaceAll('${SESSION_ID}', cfg.sessionId)
}

async function waitForMessage(
    client: StressClient,
    cfg: ChatConfig,
    channel: Stream,
    text: string,
    logger: Logger,
) {
    let count = 0
    const message = await client.waitFor(
        () => {
            if (count % 3 === 0) {
                const cms = channel.view.timeline.filter(
                    (v) =>
                        v.remoteEvent?.event.payload.case === 'channelPayload' &&
                        v.remoteEvent?.event.payload.value?.content.case === 'message',
                )
                const decryptedCount = cms.filter((v) => v.decryptedContent).length
                logger.info(
                    { decryptedCount, totalCount: cms.length },
                    'waiting for decrypted messages',
                )
            }
            count++
            return channel.view.timeline.find(
                channelMessagePostWhere((value) => value.body.includes(text)),
            )
        },
        { interval: 1000, timeoutMs: cfg.waitForChannelDecryptionTimeoutMs },
    )
    if (client.clientIndex % cfg.clientsPerProcess === 0) {
        logger.info(
            {
                processIndex: cfg.processIndex,
                clientIndex: client.clientIndex,
                channel: channel.streamId,
                text,
                message,
            },
            'Detected message in channel',
        )
    }
}

export async function expectChannelMessages(
    client: StressClient,
    cfg: ChatConfig,
    params: ExpectChannelMessageParams,
) {
    const logger = client.logger.child({
        name: 'expectChannelMessages',
        logId: client.logId,
        params,
    })

    logger.info({}, 'expecting channel messages')

    const isChannelMember = await client.isMemberOf(params.channelId)
    if (!isChannelMember) {
        logger.info('joining channel...')
        await client.streamsClient.joinStream(params.channelId)
    }

    const channel = await client.streamsClient.waitForStream(params.channelId, {
        timeoutMs: 1000 * 60,
        logId: 'expectChannelMessages:' + client.logId,
    })

    for (const message of params.messages) {
        const text = escapeMessage(message.content, client, cfg)
        try {
            await waitForMessage(client, cfg, channel, text, logger)
        } catch (error) {
            logger.error(
                {
                    text,
                    error,
                },
                'failed to find message in channel',
            )
            throw new ExecutionError(
                'failed to find message in channel',
                error instanceof Error ? error : new Error(String(error)),
            )
                .Tag('clientId', client.logId)
                .Tag('text', text)
                .Tag('channelId', params.channelId)
        }
    }
}

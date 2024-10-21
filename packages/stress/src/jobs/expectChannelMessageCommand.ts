import { z } from 'zod'
import { StressClient } from '../utils/stressClient'
import { ChatConfig } from '../mode/common/types'
import { channelMessagePostWhere } from '../utils/timeline'
import { Stream } from '@river-build/sdk'
import { Logger } from 'pino'
import { ExecutionError } from './ExecutionError'
import { Job } from 'bullmq'

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
    job: Job,
    client: StressClient,
    cfg: ChatConfig,
) {
    const params: {
        channelId: string,
        messages: [{
            content: string,
        }]
    } = job.data

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

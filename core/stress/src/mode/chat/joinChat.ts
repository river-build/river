import { StressClient } from '../../utils/stressClient'
import { ChatConfig } from './types'
import { dlogger } from '@river-build/dlog'
import { getRandomEmoji } from '../../utils/emoji'

export async function joinChat(client: StressClient, cfg: ChatConfig) {
    const logger = dlogger(`stress:joinChat:${client.logId}}`)
    // is user a member of all the channels?
    // is user a member of the space?
    // does user exist on the stream node?
    // does user have membership nft?
    logger.log('joinChat', client.connection.userId)

    await client.waitFor(
        () =>
            client.spaceDapp.hasSpaceMembership(
                cfg.spaceId,
                client.connection.baseProvider.wallet.address,
            ),
        {
            interval: 1000 + Math.random() * 1000,
            timeoutMs: cfg.waitForSpaceMembershipTimeoutMs,
        },
    )
    logger.log('start client')

    const announceChannelId = cfg.announceChannelId
    await startFollowerClient(client, cfg.spaceId, announceChannelId)

    logger.log('find root message')

    const defaultChannel = await client.streamsClient.waitForStream(announceChannelId)
    // find the message in the default channel that contains the session id, emoji it
    const message = await client.waitFor(
        () =>
            defaultChannel.view.timeline.find(
                (event) =>
                    (event.decryptedContent?.kind === 'channelMessage' &&
                        event.decryptedContent?.content.payload.case === 'post' &&
                        event.decryptedContent?.content.payload.value.content.case === 'text' &&
                        event.decryptedContent?.content.payload.value.content.value.body.includes(
                            cfg.sessionId,
                        )) ||
                    (event.localEvent?.channelMessage?.payload.case === 'post' &&
                        event.localEvent?.channelMessage?.payload.value.content.case === 'text' &&
                        event.localEvent?.channelMessage?.payload.value.content.value.body.includes(
                            cfg.sessionId,
                        )),
            ),
        { interval: 1000, timeoutMs: cfg.waitForChannelDecryptionTimeoutMs },
    )

    if (client.clientIndex === cfg.localClients.startIndex) {
        logger.log('sharing keys')
        await client.streamsClient.cryptoBackend?.ensureOutboundSession(announceChannelId, {
            awaitInitialShareSession: true,
        })
        logger.log('check in with root client')
        await client.sendMessage(
            announceChannelId,
            `Starting stress test containerIndex: ${cfg.containerIndex} processIndex: ${cfg.processIndex}`,
            { threadId: message.hashStr },
        )
    }

    logger.log('emoji it')

    // emoji it
    await client.sendReaction(announceChannelId, message.hashStr, getRandomEmoji())

    logger.log('join channels')
    for (const channelId of cfg.channelIds) {
        if (
            !client.streamsClient.streams
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                .get(client.streamsClient.userStreamId!)
                ?.view.userContent.isJoined(channelId)
        ) {
            await client.streamsClient.joinStream(channelId)
            await client.streamsClient.waitForStream(channelId)
            await client.sendMessage(channelId, `I'm in! ${cfg.sessionId}`)
        } else {
            await client.sendMessage(channelId, `Let's go! ${cfg.sessionId}`)
        }
    }

    logger.log('done')
}

// cruft we need to do for root user
async function startFollowerClient(
    client: StressClient,
    spaceId: string,
    defaultChannelId: string,
) {
    const userExists = await client.userExists()
    if (!userExists) {
        await client.joinSpace(spaceId, { skipMintMembership: true })
    } else {
        const isMember = await client.isMemberOf(spaceId)
        if (!isMember) {
            await client.joinSpace(spaceId, { skipMintMembership: true })
        } else {
            await client.startStreamsClient()
        }
    }

    const isChannelMember = await client.isMemberOf(defaultChannelId)
    if (!isChannelMember) {
        await client.streamsClient.joinStream(defaultChannelId)
    }
    return defaultChannelId
}

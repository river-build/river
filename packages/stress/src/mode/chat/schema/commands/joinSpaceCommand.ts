import { StressClient } from '../../../../utils/stressClient'
import { ChatConfig } from '../../../common/types'
import { z } from 'zod'
import { baseCommand } from './baseCommand'

const joinSpaceParamsSchema = z.object({
    spaceId: z.string(),
    announceChannelId: z.string(),
    skipMintMembership: z.boolean().optional(),
})

export const joinSpaceCommand = baseCommand.extend({
    name: z.literal('joinSpace'),
    params: joinSpaceParamsSchema,
})

export type JoinSpaceParams = z.infer<typeof joinSpaceParamsSchema>
export type JoinSpaceCommand = z.infer<typeof joinSpaceCommand>

// joins space and announcement channel
// idempotent, fine to run if user is already a space member
export async function joinSpace(client: StressClient, cfg: ChatConfig, params: JoinSpaceParams) {
    const logger = client.logger.child({
        name: 'joinSpace',
        logId: client.logId,
        params,
    })

    // start up the client, join space and announcement channel
    const userExists = client.userExists()
    if (!userExists) {
        await client.joinSpace(params.spaceId, { skipMintMembership: params.skipMintMembership })
    } else {
        const isMember = await client.isMemberOf(params.spaceId)
        if (!isMember) {
            await client.joinSpace(params.spaceId, {
                skipMintMembership: params.skipMintMembership,
            })
        }
    }

    const isChannelMember = await client.isMemberOf(params.announceChannelId)
    if (!isChannelMember) {
        await client.streamsClient.joinStream(params.announceChannelId)
    }

    // wait for the user to have a membership nft
    if (!params.skipMintMembership) {
        await client.waitFor(
            () =>
                client.spaceDapp.hasSpaceMembership(
                    params.spaceId,
                    client.baseProvider.wallet.address,
                ),
            {
                interval: 1000 + Math.random() * 1000,
                timeoutMs: cfg.waitForSpaceMembershipTimeoutMs,
            },
        )
    }
    logger.info('client joined space and announcement channel')
}

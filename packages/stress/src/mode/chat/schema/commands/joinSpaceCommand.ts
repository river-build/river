import { StressClient } from '../../../../utils/stressClient'
import { ChatConfig } from '../../../common/types'
import { z } from 'zod'
import { baseCommand } from './baseCommand'
import { startFollowerClient } from '../../joinChat'

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

export async function joinSpace(client: StressClient, cfg: ChatConfig, params: JoinSpaceParams) {
    const logger = client.logger.child({
        name: 'joinSpace',
        clientIndex: client.clientIndex,
        params,
    })

    // is user a member of the space?
    // does user exist on the stream node?

    logger.info('start joinSpace')

    // wait for the user to have a membership nft
    await client.waitFor(
        () =>
            client.spaceDapp.hasSpaceMembership(params.spaceId, client.baseProvider.wallet.address),
        {
            interval: 1000 + Math.random() * 1000,
            timeoutMs: cfg.waitForSpaceMembershipTimeoutMs,
        },
    )

    logger.info('start client')

    // start up the client
    await startFollowerClient(client, params.spaceId, params.announceChannelId)
}

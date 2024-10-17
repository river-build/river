import { StressClient } from '../../../../utils/stressClient'
import { ChatConfig } from '../../../common/types'
import { z } from 'zod'
import { baseCommand } from './baseCommand'
import { Wallet } from 'ethers'
import { waitFor } from '../../../../utils/waitFor'

const mintMembershipsParamsSchema = z.object({
    spaceId: z.string(),
    timeoutS: z.number().positive().default(300),
    pollFrequencyMs: z.number().positive().default(1000),
})

export const mintMembershipsCommand = baseCommand.extend({
    name: z.literal('mintMemberships'),
    params: mintMembershipsParamsSchema,
})

export type MintMembershipsParams = z.infer<typeof mintMembershipsParamsSchema>
export type MintMembershipsCommand = z.infer<typeof mintMembershipsCommand>

async function waitForMint(client: StressClient, cfg: ChatConfig, params: MintMembershipsParams) {
    const key = cfg.sessionId + ':mintMemberships'
    await waitFor(
        async () => {
            const val = await cfg.globalPersistedStore?.get(key)
            return val === 'done'
        },
        {
            interval: params.pollFrequencyMs,
            timeoutMs: params.timeoutS * 1000,
            logId: client.logId,
        },
    )
}

// Space owner to mint memberships for all other clients. Other clients wait for client 0 to finish
// minting.
export async function mintMemberships(
    client: StressClient,
    cfg: ChatConfig,
    params: MintMembershipsParams,
) {
    const logger = client.logger.child({
        name: 'mintMemberships',
        clientIndex: client.clientIndex,
        params,
    })

    if (client.clientIndex !== 0) {
        return await waitForMint(client, cfg, params)
    }

    const mintMembershipForWallet = async (wallet: Wallet, clientIndex: number) => {
        const hasSpaceMembership = await client.spaceDapp.hasSpaceMembership(
            params.spaceId,
            wallet.address,
        )
        logger.debug(
            { clientIndex, address: wallet.address, hasSpaceMembership },
            'minting membership',
        )
        if (!hasSpaceMembership) {
            let retry = 0
            while (retry < 3) {
                const result = await client.spaceDapp.joinSpace(
                    params.spaceId,
                    wallet.address,
                    client.baseProvider.wallet,
                )
                if (result.issued) {
                    logger.debug({ result, clientIndex }, 'minted membership for client')
                    return
                }
                // sleep for > 1 second
                await new Promise((resolve) => setTimeout(resolve, 1100))
                retry += 1
            }
            throw new Error('Unable to mint token for client')
        }
    }

    for (let clientIndex = 0; clientIndex < cfg.allWallets.length; clientIndex++) {
        const wallet = cfg.allWallets[clientIndex]
        await mintMembershipForWallet(wallet, clientIndex)
    }

    const key = cfg.sessionId + ':mintMemberships'
    const val = 'done'
    await cfg.globalPersistedStore?.set(key, val)
    logger.info({ key, val }, 'memberships minted')
}

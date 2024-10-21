import { StressClient } from '../utils/stressClient'
import { ChatConfig } from '../mode/common/types'
import { Wallet } from 'ethers'
import { Job } from 'bullmq'
import { config } from 'process'

// Space owner to mint memberships for all other clients. Other clients wait for client 0 to finish
// minting. clients are orchestrated via an entry in redis which is keyed by session id.
export async function mintMemberships(
    job: Job,
    client: StressClient,
    cfg: ChatConfig,
) {
    const params: {
        spaceId: string
    } = job.data

    const logger = client.logger.child({
        name: 'mintMemberships',
        logId: client.logId,
        params,
    })

    await client.fundWallet()

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
            throw new Error(`Client ${client.clientIndex} unable to mint token for client ${clientIndex}`)
        }
    }

    const minted: number[] = []
    for (
        let clientIndex = cfg.clientsPerProcess * cfg.processIndex;
        clientIndex < cfg.clientsPerProcess * (cfg.processIndex + 1);
        clientIndex++
    ) {
        const wallet = cfg.allWallets[clientIndex]
        await mintMembershipForWallet(wallet, clientIndex)
        minted.push(clientIndex)
        job.updateProgress(clientIndex)
    }

    return minted
}

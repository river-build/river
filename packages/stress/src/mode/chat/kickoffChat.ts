import { StressClient } from '../../utils/stressClient'
import { getSystemInfo } from '../../utils/systemInfo'
import { BigNumber, Wallet } from 'ethers'
import { ChatConfig } from './types'
import { check, dlogger } from '@river-build/dlog'
import { makeCodeBlock } from '../../utils/messages'

const logger = dlogger('stress:kickoffChat')

export async function kickoffChat(rootClient: StressClient, cfg: ChatConfig) {
    logger.log('kickoffChat', rootClient.userId)
    check(rootClient.clientIndex === 0, 'rootClient.clientIndex === 0')
    const globalRunIndex = parseInt(
        (await cfg.globalPersistedStore?.get('stress_global_run_index').catch(() => undefined)) ??
            '0',
    )
    await cfg.globalPersistedStore?.set('stress_global_run_index', `${globalRunIndex + 1}`)

    const { spaceId, sessionId } = cfg
    const balance = await rootClient.baseProvider.wallet.getBalance()
    const announceChannelId = cfg.announceChannelId
    logger.log('start client')
    await startRootClient(rootClient, balance, spaceId, announceChannelId)

    await rootClient.streamsClient.waitForStream(announceChannelId)

    logger.log('share keys')
    const shareKeysStart = Date.now()
    await rootClient.streamsClient.cryptoBackend?.ensureOutboundSession(announceChannelId, {
        awaitInitialShareSession: true,
    })
    const shareKeysDuration = Date.now() - shareKeysStart

    logger.log('send message')
    const { eventId: kickoffMessageEventId } = await rootClient.sendMessage(
        announceChannelId,
        `hello, we're starting the stress test now!, containers: ${cfg.containerCount} ppc: ${cfg.processesPerContainer} clients: ${cfg.clientsCount} randomNewClients: ${cfg.randomClients.length} sessionId: ${sessionId}`,
    )
    const { eventId: countClientsMessageEventId } = await rootClient.sendMessage(
        cfg.announceChannelId,
        `Clients: 0/${cfg.clientsCount} 🤖`,
    )

    cfg.kickoffMessageEventId = kickoffMessageEventId
    cfg.countClientsMessageEventId = countClientsMessageEventId

    const initialStats = {
        timeToShareKeys: shareKeysDuration + 'ms',
        walletBalance: balance.toString(),
        testDuration: cfg.duration,
        clientsCount: cfg.clientsCount,
        globalRunIndex,
    }

    logger.log('start thread')
    await rootClient.sendMessage(
        announceChannelId,
        `System Info: ${makeCodeBlock(getSystemInfo())} Initial Stats: ${makeCodeBlock(
            initialStats,
        )}`,
        { threadId: kickoffMessageEventId },
    )

    const mintMembershipForWallet = async (wallet: Wallet, i: number) => {
        const hasSpaceMembership = await rootClient.spaceDapp.hasSpaceMembership(
            spaceId,
            wallet.address,
        )
        logger.log('minting membership for', i, wallet.address, 'has', hasSpaceMembership)
        if (!hasSpaceMembership) {
            const result = await rootClient.spaceDapp.joinSpace(
                spaceId,
                wallet.address,
                rootClient.baseProvider.wallet,
            )
            logger.log('minted membership', result)
            // sleep for > 1 second
            await new Promise((resolve) => setTimeout(resolve, 1100))
        }
    }

    logger.log('mint random memberships')
    for (let i = 0; i < cfg.randomClients.length; i++) {
        const client = cfg.randomClients[i]
        await mintMembershipForWallet(client.baseProvider.wallet, i)
    }

    // loop over all the clients, mint memberships for them if they're not members
    // via spaceDapp.hasSpaceMembership
    logger.log('mint memberships')
    for (let i = 0; i < cfg.allWallets.length; i++) {
        const wallet = cfg.allWallets[i]
        await mintMembershipForWallet(wallet, i)
    }
    logger.log('done')
}

// cruft we need to do for root user
async function startRootClient(
    client: StressClient,
    balance: BigNumber,
    spaceId: string,
    defaultChannelId: string,
) {
    const userExists = await client.userExists()
    if (!userExists) {
        if (balance.lte(0)) {
            throw new Error('Insufficient balance')
        }
        await client.joinSpace(spaceId)
    } else {
        const isMember = await client.isMemberOf(spaceId)
        if (!isMember) {
            await client.joinSpace(spaceId)
        } else {
            await client.startStreamsClient({ spaceId })
        }
    }

    const isChannelMember = await client.isMemberOf(defaultChannelId)
    if (!isChannelMember) {
        await client.streamsClient.joinStream(defaultChannelId)
    }
    return defaultChannelId
}

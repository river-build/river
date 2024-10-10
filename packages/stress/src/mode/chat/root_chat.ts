import { check } from '@river-build/dlog'
import { promises as fs } from 'node:fs'
import {
    RiverConfig,
    contractAddressFromSpaceId,
    makeDefaultChannelStreamId,
} from '@river-build/sdk'
import { Wallet, ethers } from 'ethers'
import { makeStressClient } from '../../utils/stressClient'
import { kickoffChat } from './kickoffChat'
import { joinChat } from './joinChat'
import { updateProfile } from './updateProfile'
import { chitChat } from './chitChat'
import { summarizeChat } from './summarizeChat'
import { statsReporter } from './statsReporter'
import { getChatConfig } from '../common/common'
import { getLogger } from '../../utils/logger'

/*
 * Starts a chat stress test.
 * This test generates a range of wallets from a seed phrase and logs the addresses.
 * loop over wallets one by one
 */
export async function startStressChat(opts: {
    config: RiverConfig
    processIndex: number
    rootWallet: Wallet
}) {
    const logger = getLogger('stress:run')
    const chatConfig = getChatConfig(opts)
    logger.info({ chatConfig }, 'make clients')
    const clients = await Promise.all(
        chatConfig.localClients.wallets.map((wallet, i) =>
            makeStressClient(
                opts.config,
                chatConfig.localClients.startIndex + i,
                wallet,
                chatConfig.globalPersistedStore,
            ),
        ),
    )

    check(
        clients.length === chatConfig.clientsPerProcess,
        `clients.length !== chatConfig.clientsPerProcess ${clients.length} !== ${chatConfig.clientsPerProcess}`,
    )

    let cancelReactionCounter: (() => void) | undefined
    const { reactionCounter, logStep } = statsReporter(chatConfig)

    if (chatConfig.processIndex === 0) {
        cancelReactionCounter = reactionCounter(clients[0])

        for (
            let i = chatConfig.clientsCount;
            i < chatConfig.clientsCount + chatConfig.randomClientsCount;
            i++
        ) {
            const rc = await makeStressClient(
                opts.config,
                i,
                ethers.Wallet.createRandom(),
                chatConfig.globalPersistedStore,
            )
            chatConfig.randomClients.push(rc)
        }

        await kickoffChat(clients[0], chatConfig)
    }

    const PARALLEL_UPDATES = 4
    const errors: unknown[] = []

    logger.info('kickoffChat')
    clients.push(...chatConfig.randomClients)

    for (let i = 0; i < clients.length; i += PARALLEL_UPDATES) {
        const span = clients.slice(i, i + PARALLEL_UPDATES)
        const results = await Promise.allSettled(span.map((client) => joinChat(client, chatConfig)))
        results.forEach((r, index) => {
            if (r.status === 'rejected') {
                errors.push(r.reason)
            }
            logStep(
                span[index],
                'JOIN_CHAT',
                r.status === 'fulfilled',
                r.status === 'fulfilled' ? { span } : { reason: r.reason },
            )
        })
    }

    logger.info('updateProfile')
    for (let i = 0; i < clients.length; i += PARALLEL_UPDATES) {
        const span = clients.slice(i, i + PARALLEL_UPDATES)
        const results = await Promise.allSettled(
            span.map((client) => updateProfile(client, chatConfig)),
        )
        results.forEach((r, index) => {
            if (r.status === 'rejected') {
                errors.push(r.reason)
            }
            logStep(
                span[index],
                'UPDATE_PROFILE',
                r.status === 'fulfilled',
                r.status === 'fulfilled' ? { span } : { reason: r.reason },
            )
        })
    }

    logger.info('chitChat')
    const results = await Promise.allSettled(clients.map((client) => chitChat(client, chatConfig)))
    results.forEach((r, index) => {
        if (r.status === 'rejected') {
            errors.push(r.reason)
        }
        logStep(
            clients[index],
            'CHIT_CHAT',
            r.status === 'fulfilled',
            r.status === 'fulfilled' ? {} : { reason: r.reason },
        )
    })

    logger.info('summarizeChat')
    const summary = await summarizeChat(clients, chatConfig, errors)

    logger.info({ summary }, 'done')

    cancelReactionCounter?.()

    for (let i = 0; i < clients.length; i += 1) {
        const client = clients[i]
        logger.info(`stopping ${client.logId}`)
        await client.stop()
    }

    await chatConfig.globalPersistedStore?.close()

    return { summary, chatConfig, opts }
}

export async function setupChat(opts: {
    config: RiverConfig
    rootWallet: Wallet
    makeAnnounceChannel?: boolean
    numChannels?: number
}) {
    const logger = getLogger('stress:setupChat')
    logger.info('setupChat')
    const client = await makeStressClient(opts.config, 0, opts.rootWallet, undefined)
    // make a space
    const { spaceId } = await client.createSpace('stress test space')
    // make an announce channel
    const announceChannelId = opts?.makeAnnounceChannel
        ? await client.createChannel(spaceId, 'stress anouncements')
        : makeDefaultChannelStreamId(spaceId)
    // make two channels
    const channelIds = []
    for (let i = 0; i < (opts.numChannels ?? 2); i++) {
        channelIds.push(await client.createChannel(spaceId, `stress${i}`))
    }
    // log all the deets
    const envVars = [
        `SPACE_ADDRESS=${contractAddressFromSpaceId(spaceId)}`,
        `SPACE_ID=${spaceId}`,
        `ANNOUNCE_CHANNEL_ID=${announceChannelId}`,
        `CHANNEL_IDS=${channelIds.join(',')}`,
    ]
    logger.info(envVars.join('\n'))
    await fs.writeFile('scripts/.env.localhost_chat', envVars.join('\n'))
    logger.info('join at', `http://localhost:3000/t/${spaceId}/?invite`)
    logger.info('or', `http://localhost:3001/spaces/${spaceId}/?invite`)
    logger.info('done')

    return {
        spaceId,
        announceChannelId,
        channelIds,
    }
}

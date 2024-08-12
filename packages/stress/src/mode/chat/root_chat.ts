import { check, dlogger } from '@river-build/dlog'
import { promises as fs } from 'node:fs'
import { isSet } from '../../utils/expect'
import { ChatConfig } from './types'
import { RiverConfig, makeDefaultChannelStreamId } from '@river-build/sdk'
import { generateWalletsFromSeed } from '../../utils/wallets'
import { Wallet, ethers } from 'ethers'
import { makeStressClient } from '../../utils/stressClient'
import { kickoffChat } from './kickoffChat'
import { joinChat } from './joinChat'
import { updateProfile } from './updateProfile'
import { chitChat } from './chitChat'
import { sumarizeChat } from './sumarizeChat'
import { statsReporter } from './statsReporter'
import { RedisStorage } from '../../utils/storage'

function getStressDuration(): number {
    check(isSet(process.env.STRESS_DURATION), 'process.env.STRESS_DURATION')
    return parseInt(process.env.STRESS_DURATION)
}

function getSessionId(): string {
    check(isSet(process.env.SESSION_ID), 'process.env.SESSION_ID')
    check(process.env.SESSION_ID.length > 0, 'process.env.SESSION_ID.length > 0')
    return process.env.SESSION_ID
}

function getChatConfig(opts: { processIndex: number; rootWallet: Wallet }): ChatConfig {
    const startedAtMs = Date.now()
    check(isSet(process.env.CLIENTS_PER_PROCESS), 'process.env.CLIENTS_PER_PROCESS')
    check(isSet(process.env.CLIENTS_COUNT), 'process.env.CLIENTS_COUNT')
    check(isSet(process.env.SPACE_ID), 'process.env.SPACE_ID')
    check(isSet(process.env.CHANNEL_IDS), 'process.env.CHANNEL_IDS')
    check(isSet(process.env.CONTAINER_INDEX), 'process.env.CONTAINER_INDEX')
    check(isSet(process.env.CONTAINER_COUNT), 'process.env.CONTAINER_COUNT')
    check(isSet(process.env.PROCESSES_PER_CONTAINER), 'process.env.PROCESSES_PER_CONTAINER')
    const duration = getStressDuration()
    const containerIndex = parseInt(process.env.CONTAINER_INDEX)
    const containerCount = parseInt(process.env.CONTAINER_COUNT)
    const processesPerContainer = parseInt(process.env.PROCESSES_PER_CONTAINER)
    const clientsCount = parseInt(process.env.CLIENTS_COUNT)
    const clientsPerProcess = parseInt(process.env.CLIENTS_PER_PROCESS)
    const clientStartIndex = opts.processIndex * clientsPerProcess
    const clientEndIndex = clientStartIndex + clientsPerProcess
    const spaceId = process.env.SPACE_ID
    const channelIds = process.env.CHANNEL_IDS.split(',')
    const announceChannelId =
        process.env.ANNOUNCE_CHANNEL_ID && process.env.ANNOUNCE_CHANNEL_ID.length > 0
            ? process.env.ANNOUNCE_CHANNEL_ID
            : makeDefaultChannelStreamId(spaceId)

    const allWallets = generateWalletsFromSeed(opts.rootWallet.mnemonic.phrase, 0, clientsCount)
    const wallets = allWallets.slice(clientStartIndex, clientEndIndex)
    const randomClientsCount = process.env.RANDOM_CLIENTS_COUNT
        ? parseInt(process.env.RANDOM_CLIENTS_COUNT)
        : 0
    const storage = process.env.REDIS_HOST ? new RedisStorage(process.env.REDIS_HOST) : undefined
    if (clientStartIndex >= clientEndIndex) {
        throw new Error('clientStartIndex >= clientEndIndex')
    }
    return {
        kickoffMessageEventId: undefined,
        countClientsMessageEventId: undefined,
        containerIndex,
        containerCount,
        processIndex: opts.processIndex,
        processesPerContainer,
        clientsCount,
        clientsPerProcess,
        duration,
        sessionId: getSessionId(),
        spaceId,
        announceChannelId,
        channelIds,
        allWallets,
        randomClientsCount,
        randomClients: [],
        localClients: {
            startIndex: clientStartIndex,
            endIndex: clientEndIndex,
            wallets,
        },
        startedAtMs,
        waitForSpaceMembershipTimeoutMs: Math.max(duration * 1000, 20000),
        waitForChannelDecryptionTimeoutMs: Math.max(duration * 1000, 20000),
        globalPersistedStore: storage,
    } satisfies ChatConfig
}

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
    const logger = dlogger(`stress:run:${opts.processIndex}`)
    logger.log('startStressChat')
    const chatConfig = getChatConfig(opts)
    logger.log('make clients')
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

    let cancelStatsReporting: (() => void) | undefined

    if (chatConfig.processIndex === 0) {
        cancelStatsReporting = statsReporter(clients[0], chatConfig)

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

    logger.log('kickoffChat')
    clients.push(...chatConfig.randomClients)

    for (let i = 0; i < clients.length; i += PARALLEL_UPDATES) {
        const span = clients.slice(i, i + PARALLEL_UPDATES)
        const results = await Promise.allSettled(span.map((client) => joinChat(client, chatConfig)))
        results.forEach((r, index) => {
            if (r.status === 'rejected') {
                logger.error(`${span[index].logId} error calling joinChat`, r.reason)
                errors.push(r.reason)
            }
        })
    }

    logger.log('updateProfile')
    for (let i = 0; i < clients.length; i += PARALLEL_UPDATES) {
        const span = clients.slice(i, i + PARALLEL_UPDATES)
        const results = await Promise.allSettled(
            span.map((client) => updateProfile(client, chatConfig)),
        )
        results.forEach((r, index) => {
            if (r.status === 'rejected') {
                logger.error(`${span[index].logId} error calling updateProfile`, r.reason)
                errors.push(r.reason)
            }
        })
    }

    logger.log('chitChat')
    const results = await Promise.allSettled(clients.map((client) => chitChat(client, chatConfig)))
    results.forEach((r, index) => {
        if (r.status === 'rejected') {
            logger.error(`${clients[index].logId} error calling chitChat`, r.reason)
            errors.push(r.reason)
        }
    })

    logger.log('sumarizeChat')
    const summary = await sumarizeChat(clients, chatConfig, errors)

    logger.log('done', { summary })

    cancelStatsReporting?.()

    for (let i = 0; i < clients.length; i += 1) {
        const client = clients[i]
        logger.log(`stopping ${client.logId}`)
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
    const logger = dlogger(`stress:setupChat`)
    logger.log('setupChat')
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
        `SPACE_ID=${spaceId}`,
        `ANNOUNCE_CHANNEL_ID=${announceChannelId}`,
        `CHANNEL_IDS=${channelIds.join(',')}`,
    ]
    logger.log(envVars.join('\n'))
    await fs.writeFile('scripts/.env.localhost_chat', envVars.join('\n'))
    logger.log('join at', `http://localhost:3000/t/${spaceId}/?invite`)
    logger.log('or', `http://localhost:3001/spaces/${spaceId}/?invite`)
    logger.log('done')

    return {
        spaceId,
        announceChannelId,
        channelIds,
    }
}

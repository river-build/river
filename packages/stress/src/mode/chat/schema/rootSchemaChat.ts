/* eslint-disable no-console */
import { check } from '@river-build/dlog'
import { RiverConfig, makeDefaultChannelStreamId } from '@river-build/sdk'
import { Wallet } from 'ethers'
import { makeStressClient } from '../../../utils/stressClient'
import { getChatConfig } from '../../common/common'
import { getLogger } from '../../../utils/logger'
import { testSchema, TestPlan } from './testPlanSchema'
import { executeCommand } from './executeCommand'
import { RedisStorage } from '../../../utils/storage'

export async function setupSchemaChat(opts: {
    config: RiverConfig
    rootWallet: Wallet
    numChannels?: number
}) {
    const logger = getLogger('stress:setupSchemaChat')
    logger.info('setupSchemaChat')
    const client = await makeStressClient(opts.config, 0, opts.rootWallet, undefined)
    // make a space
    const { spaceId } = await client.createSpace('stress test space')
    // make an announce channel
    const announceChannelId = makeDefaultChannelStreamId(spaceId)
    // make two channels
    const channelIds = []
    for (let i = 0; i < (opts.numChannels ?? 2); i++) {
        channelIds.push(await client.createChannel(spaceId, `stress${i}`))
    }
    console.log('join at', `http://localhost:3000/t/${spaceId}/?invite`)
    console.log('or', `http://localhost:3001/spaces/${spaceId}/?invite`)
    console.log('done')

    const storage = process.env.REDIS_HOST ? new RedisStorage(process.env.REDIS_HOST) : undefined
    check(!!storage, 'Redis instance undefined')

    await storage.set(
        'testPlan',
        JSON.stringify({
            commands: [
                {
                    name: 'joinSpace',
                    params: {
                        spaceId,
                        announceChannelId,
                        skipMintMembership: true,
                    },
                },
            ],
        } as TestPlan),
    )

    logger.info({ testPlan: await storage.get('testPlan') }, 'Setting test plan')

    return {
        spaceId,
        announceChannelId,
        channelIds,
    }
}

/*
 * Starts a schema-defined chat stress test.
 */
export async function startSchemaChat(opts: {
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

    const rawTestPlan = await chatConfig.globalPersistedStore?.get('testPlan')

    logger.info({ rawTestPlan }, 'fetched test plan from redis')

    check(!!rawTestPlan, 'Test plan not found in redis')

    var plan: TestPlan | undefined = undefined
    try {
        plan = testSchema.parse(JSON.parse(rawTestPlan))
    } catch (err) {
        logger.error({ err }, 'Failed to parse test plan')
        return
    }
    check(!!plan, 'Test plan did not parse')

    plan.commands.forEach(async (command, index) => {
        await executeCommand(command, command.name + index, chatConfig, clients)
    })
}

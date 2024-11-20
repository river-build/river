import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import { isSet } from './utils/expect';
import { check } from '@river-build/dlog';
import { makeDefaultChannelStreamId, makeRiverConfig } from '@river-build/sdk';
import { getLogger } from './utils/logger';
import { makeStressClient, StressClient } from './utils/stressClient';
import { getRootWallet } from './start';
import { generateWalletsFromSeed } from './utils/wallets';
import { RedisStorage } from './utils/storage';
import { ChatConfig } from './mode/common/types';
import { getSessionId } from './mode/common/common';
import { mintMemberships } from './jobs/mintMemberships';
import { joinSpace } from './jobs/joinSpaceCommand';

const startedAtMs = Date.now()

console.log("queueDemo running...")

// Test grid params
check(isSet(process.env.CLIENTS_COUNT), 'process.env.CLIENTS_COUNT')
check(isSet(process.env.CLIENTS_PER_PROCESS), 'process.env.CLIENTS_PER_PROCESS')
check(isSet(process.env.PROCESS_INDEX), 'process.env.PROCESS_INDEX')
check(isSet(process.env.CONTAINER_INDEX), 'process.env.CONTAINER_INDEX')
check(isSet(process.env.CONTAINER_COUNT), 'process.env.CONTAINER_COUNT')
check(isSet(process.env.PROCESSES_PER_CONTAINER), 'process.env.PROCESSES_PER_CONTAINER')

const containerIndex = parseInt(process.env.CONTAINER_INDEX)
const containerCount = parseInt(process.env.CONTAINER_COUNT)
const processesPerContainer = parseInt(process.env.PROCESSES_PER_CONTAINER)
const clientsCount = parseInt(process.env.CLIENTS_COUNT)
const processIndex = parseInt(process.env.PROCESS_INDEX)
const clientsPerProcess = parseInt(process.env.CLIENTS_PER_PROCESS)
const clientStartIndex = processIndex * clientsPerProcess
const clientEndIndex = clientStartIndex + clientsPerProcess

const rootWallet = getRootWallet()
const allWallets = generateWalletsFromSeed(rootWallet.wallet.mnemonic.phrase, 0, clientsCount)
const wallets = allWallets.slice(clientStartIndex, clientEndIndex)

check(isSet(process.env.REDIS_HOST), 'process.env.REDIS_HOST')
const storage = new RedisStorage(process.env.REDIS_HOST)

// River chain config
check(isSet(process.env.RIVER_ENV), 'process.env.RIVER_ENV')
const config = makeRiverConfig(process.env.RIVER_ENV)


const chatConfig: ChatConfig = {
    containerIndex,
    containerCount,
    processIndex,
    processesPerContainer,
    clientsCount,
    clientsPerProcess,
    sessionId: getSessionId(),
    allWallets,
    startedAtMs,
    globalPersistedStore: storage,
    localClients: {
        wallets,
        startIndex: clientStartIndex,
        endIndex: clientEndIndex,
    },

    duration: 0,
    spaceId: "",
    announceChannelId: "",
    channelIds: [],
    kickoffMessageEventId: "",
    countClientsMessageEventId: "",
    randomClientsCount: 0,
    randomClients: [],
    waitForChannelDecryptionTimeoutMs: 0,
    waitForSpaceMembershipTimeoutMs: 0,
    averageWaitTimeout: 0,
    gdmProbability: 0,
}

const logger = getLogger(`stress:run`, { processIndex })
logger.info('======================= run =======================')


type workerExecuteFn = (job: Job) => Promise<any>

function executeClientJobs(client: StressClient): workerExecuteFn {
    return async (job: Job) => {
        switch (job.name) {
            case 'mintMemberships':
                return await mintMemberships(job, client, chatConfig)
            case 'joinSpace':
                return await joinSpace(job, client, chatConfig)
            default:
                throw new Error(`Unknown job '${job.name}'`)
        }
    }
}

const run = async() => {
    const logger = getLogger('stress:queueDemo')
    logger.info('setup demo queue chat')
    const client = await makeStressClient(config, 0, rootWallet.wallet, undefined)

    // Test setup:
    // 1. make a space
    const { spaceId } = await client.createSpace('stress test space')
    // 2. make an announce channel
    const announceChannelId = makeDefaultChannelStreamId(spaceId)
    // 3. make two channels
    const channelIds = []
    for (let i = 0; i < (2); i++) {
        channelIds.push(await client.createChannel(spaceId, `stress${i}`))
    }
    
    const clients = await Promise.all(
        chatConfig.localClients.wallets.map((wallet, i) =>
            makeStressClient(
                config,
                chatConfig.localClients.startIndex + i,
                wallet,
                chatConfig.globalPersistedStore,
            ),
        ),
    )

    const queues = clients.reduce(
        (acc, client) => {
            acc[client.clientIndex] = {
                queue: new Queue(chatConfig.sessionId + ':client' + client.clientIndex),
            }
            return acc
        }, {} as {
            [clientId: number]: {
                queue: Queue
            }
        }
    )


    // Queue up commands
    // process root client to mint memberships
    await queues[clientStartIndex].queue.add('mintMemberships', {
        spaceId
    })

    // all clients to join space and channel
    for (const [client, queue] of Object.entries(queues)) {
        queue.queue.add('joinSpace', {
            spaceId,
            announceChannelId,
            skipMintMemberships: true,
        })
    }

    // Create workers for each client queue
    const workers = clients.reduce(
        (acc, client) => {
            const worker = new Worker(chatConfig.sessionId + ':client' + client.clientIndex)
            // Stop queue processing after a failed job
            worker.on('failed', async (job, err) => {
                logger.info(
                    {
                        jobId: job?.id,
                        jobName: job?.name,
                        err,
                        clientId: client.clientIndex,
                        processIndex,
                        containerIndex,
                        sessionId: chatConfig.sessionId,
                    },
                    "worker failed, force-closing worker"
                )
                await worker.close(true)
            })
            acc[client.clientIndex] = worker
            return acc
        }, {} as { [clientId: number]:Worker }
    )

    // Key exchange for observer
    await new Promise((resolve) => setTimeout(resolve, 60000))
    

}
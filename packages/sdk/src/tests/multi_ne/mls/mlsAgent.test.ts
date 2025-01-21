/**
 * @group main
 */

import { makeTestClient } from '../../testUtils'
import { Client } from '../../../client'
import { Client as MlsClient, ClientOptions as MlsClientOptions } from '@river-build/mls-rs-wasm'
import { dlog } from '@river-build/dlog'
import { beforeEach, describe, expect } from 'vitest'
import { ViewAdapter } from '../../../mls/view/viewAdapter'
import { MlsProcessor, MlsProcessorOpts } from '../../../mls/view/mlsProcessor'
import { MlsQueue } from '../../../mls/view/mlsQueue'
import { MlsAgent, MlsAgentOpts } from '../../../mls/view/mlsAgent'

const encoder = new TextEncoder()

type TestClient = {
    nickname: string
    client: Client
    mlsClient: MlsClient
}

const log = dlog('test:mls:agent')

describe('MlsAgentTests', () => {
    const clients: TestClientWithAgent[] = []

    const mlsClientOptions: MlsClientOptions = {
        withAllowExternalCommit: true,
        withRatchetTreeExtension: false,
    }

    function makeMlsProcessorOpts(nickname: string): MlsProcessorOpts {
        const log_ = log.extend(nickname)
        return {
            log: {
                info: log_.extend('info'),
                debug: log_.extend('debug'),
                error: log_.extend('error'),
                warn: log_.extend('warn'),
            },
            sendingOptions: {
                method: 'mls',
            },
        }
    }

    function makeMlsAgentOpts(nickname: string): MlsAgentOpts {
        const log_ = log.extend(nickname)
        return {
            log: {
                info: log_.extend('info'),
                debug: log_.extend('debug'),
                error: log_.extend('error'),
                warn: log_.extend('warn'),
            },
        }
    }

    const makeInitAndStartClient = async (nickname: string): Promise<TestClient> => {
        const client = await makeTestClient({ nickname })
        await client.initializeUser()
        client.startSync()

        const name = encoder.encode(nickname)
        const mlsClient = await MlsClient.create(name, mlsClientOptions)

        return {
            nickname,
            client,
            mlsClient,
        }
    }

    type TestClientWithAgent = TestClient & {
        agent: MlsAgent
    }

    let alice: TestClientWithAgent
    let bob: TestClientWithAgent
    let charlie: TestClientWithAgent
    let streamId: string

    function makeClient(testClient: TestClient): TestClientWithAgent {
        const viewAdapter = new ViewAdapter(testClient.client)
        const queue = new MlsQueue()
        const processor = new MlsProcessor(
            testClient.client,
            testClient.mlsClient,
            viewAdapter,
            undefined,
            makeMlsProcessorOpts(testClient.nickname),
        )
        const agent = new MlsAgent(
            viewAdapter,
            processor,
            queue,
            testClient.client,
            makeMlsAgentOpts(testClient.nickname),
        )
        agent.queue.delegate = agent
        return {
            ...testClient,
            agent,
        }
    }

    beforeEach(async () => {
        const alice_ = await makeInitAndStartClient('alice')
        const bob_ = await makeInitAndStartClient('bob')
        const charlie_ = await makeInitAndStartClient('charlie')

        const { streamId: gdmStreamId } = await alice_.client.createGDMChannel([
            bob_.client.userId,
            charlie_.client.userId,
        ])

        const testClients = [alice_, bob_, charlie_]

        await Promise.all(
            testClients.map((testClient) => testClient.client.waitForStream(gdmStreamId)),
        )
        streamId = gdmStreamId
        alice = makeClient(alice_)
        bob = makeClient(bob_)
        charlie = makeClient(charlie_)

        clients.push(alice, bob, charlie)
    })

    beforeEach(() => {
        clients.forEach((client) => {
            client.agent.start()
            client.agent.queue.start()
        })
    })

    afterEach(async () => {
        for (const client of clients) {
            client.agent.disableStream(streamId)
            await client.agent.queue.stop()
            client.agent.stop()
            await client.client.stop()
        }
        clients.length = 0
    })

    describe('enableAndParticipate', () => {
        test('alice can participate', async () => {
            // manually seed the viewAdapter
            await alice.agent.enableAndParticipate(streamId)
            await expect
                .poll(() => alice.agent.viewAdapter.localView(streamId)?.status, {
                    timeout: 10_000,
                })
                .toBe('active')
        })

        test('eventually all clients will be able to join the group', async () => {
            await Promise.all(clients.map((client) => client.agent.enableAndParticipate(streamId)))

            const howManyActive = () =>
                clients.filter(
                    (client) => client.agent.viewAdapter.localView(streamId)?.status === 'active',
                ).length
            await expect.poll(() => howManyActive(), { timeout: 10_000 }).toBe(3)
        })
    })
})

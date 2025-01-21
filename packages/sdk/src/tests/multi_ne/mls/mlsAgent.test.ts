/**
 * @group main
 */

import { makeTestClient } from '../../testUtils'
import { Client } from '../../../client'
import { Client as MlsClient, ClientOptions as MlsClientOptions } from '@river-build/mls-rs-wasm'
import { dlog } from '@river-build/dlog'
import { beforeEach, describe, expect } from 'vitest'
import { MlsProcessor, MlsProcessorOpts } from '../../../mls/mlsProcessor'
import { MlsQueue } from '../../../mls/mlsQueue'
import { MlsAgent, MlsAgentOpts } from '../../../mls/mlsAgent'

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
        const queue = new MlsQueue()
        const processor = new MlsProcessor(
            testClient.client,
            testClient.mlsClient,
            undefined,
            makeMlsProcessorOpts(testClient.nickname),
        )
        const agent = new MlsAgent(
            testClient.client,
            processor,
            queue,
            testClient.client,
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

    const howManyActive = () =>
        clients.filter(
            (client) => client.agent.streams.get(streamId)?.localView?.status === 'active',
        ).length

    const howManyOpenKeys = (client: TestClientWithAgent) =>
        client.agent.streams.get(streamId)?.localView?.epochSecrets.size

    const howManySealedKeys = (client: TestClientWithAgent) =>
        client.agent.streams.get(streamId)?.onChainView.sealedEpochSecrets.size

    describe('enableAndParticipate', () => {
        test('alice can participate', async () => {
            // manually seed the viewAdapter
            await alice.agent.enableAndParticipate(streamId)
            await expect
                .poll(() => alice.agent.streams.get(streamId)?.localView?.status, {
                    timeout: 10_000,
                })
                .toBe('active')
        })

        test('alice starts with one epoch secret', async () => {
            // manually seed the viewAdapter
            await alice.agent.enableAndParticipate(streamId)
            await expect
                .poll(() => howManyOpenKeys(alice), {
                    timeout: 10_000,
                })
                .toBe(1)
        })

        test('alice generates new epoch secret after bob participates', async () => {
            await alice.agent.enableAndParticipate(streamId)
            await expect.poll(() => howManyActive(), { timeout: 10_000 }).toBe(1)
            await bob.agent.enableAndParticipate(streamId)
            await expect
                .poll(() => howManyOpenKeys(alice), {
                    timeout: 10_000,
                })
                .toBe(2)
        })

        test('eventually all clients will be able to join the group', async () => {
            await Promise.all(clients.map((client) => client.agent.enableAndParticipate(streamId)))

            await expect.poll(() => howManyActive(), { timeout: 10_000 }).toBe(3)
        })
    })

    describe('announceEpochSecrets', () => {
        test('alice announces her keys after bob participates', async () => {
            await alice.agent.enableAndParticipate(streamId)
            await expect.poll(() => howManyActive(), { timeout: 10_000 }).toBe(1)
            await bob.agent.enableAndParticipate(streamId)
            await expect
                .poll(() => howManySealedKeys(bob), {
                    timeout: 10_000,
                })
                .toBe(1)
        })

        test('bob opens keys that alice announced', async () => {
            await alice.agent.enableAndParticipate(streamId)
            await expect.poll(() => howManyActive(), { timeout: 10_000 }).toBe(1)
            await bob.agent.enableAndParticipate(streamId)
            await expect
                .poll(() => howManyOpenKeys(bob), {
                    timeout: 10_000,
                })
                .toBe(2)
        })

        test('eventually all clients will get all the keys', async () => {
            await Promise.all(clients.map((client) => client.agent.enableAndParticipate(streamId)))

            await Promise.all([
                ...clients.map((c) =>
                    expect.poll(() => howManyOpenKeys(c), { timeout: 10_000 }).toBe(clients.length),
                ),
                ...clients.map((c) =>
                    expect
                        .poll(() => howManySealedKeys(c), { timeout: 10_000 })
                        .toBe(clients.length - 1),
                ),
            ])
        })
    })
})

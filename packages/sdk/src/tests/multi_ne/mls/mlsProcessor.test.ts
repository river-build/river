/**
 * @group main
 */

import { makeTestClient } from '../../testUtils'
import { Client } from '../../../client'
import { Client as MlsClient, ClientOptions as MlsClientOptions } from '@river-build/mls-rs-wasm'
import { dlog } from '@river-build/dlog'
import { beforeEach, describe, expect } from 'vitest'
import { MlsStream } from '../../../mls/mlsStream'
import { MlsProcessor, MlsProcessorOpts } from '../../../mls/mlsProcessor'

const encoder = new TextEncoder()

type TestClient = {
    nickname: string
    client: Client
    mlsClient: MlsClient
}

const log = dlog('test:mls:viewAdapter')

describe('MlsProcessorTests', () => {
    const clients: TestClientWithProcessor[] = []

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

    type TestClientWithProcessor = TestClient & {
        processor: MlsProcessor
        stream: MlsStream
    }

    let alice: TestClientWithProcessor
    let bob: TestClientWithProcessor
    let charlie: TestClientWithProcessor
    let streamId: string

    function makeClient(testClient: TestClient): TestClientWithProcessor {
        const stream = new MlsStream(streamId, undefined, testClient.client)
        const processor = new MlsProcessor(
            testClient.client,
            testClient.mlsClient,
            undefined,
            makeMlsProcessorOpts(testClient.nickname),
        )
        return {
            ...testClient,
            stream,
            processor,
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

    afterEach(async () => {
        for (const client of clients) {
            await client.client.stop()
        }
        clients.length = 0
    })

    type Counts = {
        accepted?: number
        rejected?: number
        processed?: number
    }

    function waitUntilClientsObserve(
        clients: TestClientWithProcessor[],
        counts: Counts,
        opts = { timeout: 10_000 },
    ): Promise<void> {
        const accepted = counts.accepted ?? -1
        const rejected = counts.rejected ?? -1
        const processed = counts.rejected ?? -1

        const perClient = async (client: TestClientWithProcessor) => {
            // Manually trigger a stream update
            await client.stream.handleStreamUpdate()
            const view = client.stream.onChainView
            return (
                view.accepted.size >= accepted &&
                view.rejected.size >= rejected &&
                view.processedCount >= processed
            )
        }

        const promise = Promise.all(
            clients.map((client) => expect.poll(() => perClient(client), opts).toBe(true)),
        )

        return expect(promise).resolves.not.toThrow()
    }

    describe('initializeOrJoinGroup', () => {
        test('alice can observe her group being intialized', async () => {
            // manually seed the viewAdapter
            await expect
                .poll(
                    async () => {
                        await alice.stream.handleStreamUpdate()
                        return alice.stream.onChainView
                    },
                    { timeout: 10_000 },
                )
                .toBeDefined()

            await alice.processor.initializeOrJoinGroup(alice.stream)
            await waitUntilClientsObserve(clients, { accepted: 1, processed: 1, rejected: 0 })
            expect(alice.stream.localView?.status).toBe('active')
        })

        test('only one client will be able to join the group', async () => {
            await waitUntilClientsObserve(clients, { accepted: 0, processed: 0, rejected: 0 })
            const results = await Promise.allSettled(
                clients.map((client) => client.processor.initializeOrJoinGroup(client.stream)),
            )
            const howManySucceeded = results.filter((r) => r.status === 'fulfilled').length
            expect(howManySucceeded).toBeGreaterThan(0)

            await waitUntilClientsObserve(clients, { accepted: 1 })
            const statuses = clients.map((client) => client.stream.localView?.status)
            const howManyActive = statuses.filter((s) => s === 'active').length
            expect(howManyActive).toBe(1)
        })

        test('eventually all clients will be able to join the group', async () => {
            await waitUntilClientsObserve(clients, { accepted: 0, processed: 0, rejected: 0 })

            const tryJoin = () => {
                return Promise.allSettled(
                    clients
                        .filter((client) => client.stream.localView?.status !== 'active')
                        .map((client) => client.processor.initializeOrJoinGroup(client.stream)),
                )
            }

            const howManyActive = () =>
                clients.filter((client) => client.stream.localView?.status === 'active').length

            await tryJoin()
            await waitUntilClientsObserve(clients, { accepted: 1 })
            expect(howManyActive()).toBe(1)
            await tryJoin()
            await waitUntilClientsObserve(clients, { accepted: 2 })
            expect(howManyActive()).toBe(2)
            await tryJoin()
            await waitUntilClientsObserve(clients, { accepted: 3 })
            expect(howManyActive()).toBe(3)
        })
    })
})

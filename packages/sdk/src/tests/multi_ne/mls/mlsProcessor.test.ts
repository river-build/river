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
import { MlsQueue } from '../../../mls/mlsQueue'

const encoder = new TextEncoder()

type TestClient = {
    nickname: string
    client: Client
    mlsClient: MlsClient
}

const log = dlog('test:mls:processor')

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
        queue: MlsQueue
        stream: MlsStream
    }

    let alice: TestClientWithProcessor
    let bob: TestClientWithProcessor
    let charlie: TestClientWithProcessor
    let streamId: string

    function makeClient(testClient: TestClient): TestClientWithProcessor {
        const stream = new MlsStream(streamId, testClient.client)
        const processor = new MlsProcessor(
            testClient.client,
            testClient.mlsClient,
            undefined,
            makeMlsProcessorOpts(testClient.nickname),
        )
        const queue = new MlsQueue({ handleStreamUpdate: () => stream.handleStreamUpdate() })
        return {
            ...testClient,
            stream,
            processor,
            queue,
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

    // attaching and detaching the queue
    // beforeEach(() => {
    //     const cleanups = clients.map((client) => {
    //         const onQueueSnapshot: StreamEncryptionEvents['mlsQueueSnapshot'] = (...args) => client.queue.enqueueConfirmedSnapshot(...args)
    //         client.client.on('mlsQueueSnapshot', onQueueSnapshot)
    //         const onConfirmedEvent: StreamEncryptionEvents['mlsQueueConfirmedEvent'] = (...args) => client.queue.enqueueConfirmedEvent(...args)
    //         client.client.on('mlsQueueConfirmedEvent', onConfirmedEvent)
    //         return () => {
    //             client.client.off('mlsQueueSnapshot', onQueueSnapshot)
    //             client.client.off('mlsQueueConfirmedEvent', onConfirmedEvent)
    //         }
    //     })
    //     // enqueue removing listeners
    //     afterEach(() => {
    //         cleanups.forEach((cleanup) => cleanup())
    //     })
    // })

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
            // Manually tick the queue
            await client.stream.handleStreamUpdate()
            const view = client.stream.onChainView
            // log.extend(client.nickname)(
            //     'view',
            //     view.accepted.size,
            //     view.rejected.size,
            //     view.processedCount,
            // )
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
                        log('alice polls')
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

    const tryJoin = (c: TestClientWithProcessor) => c.processor.initializeOrJoinGroup(c.stream)

    const tryAnnounceSecrets = (c: TestClientWithProcessor) =>
        c.processor.announceEpochSecrets(c.stream)

    describe('announceEpochSecrets', () => {
        it('alice announces keys to bob', async () => {
            await tryJoin(alice)
            await waitUntilClientsObserve([bob], { accepted: 1 })
            await tryJoin(bob)
            await waitUntilClientsObserve([alice, bob], { accepted: 2 })
            await tryAnnounceSecrets(alice)
            await waitUntilClientsObserve([alice, bob], { accepted: 3 })
            expect(bob.stream.onChainView.sealedEpochSecrets.size).toBe(1)
            expect(bob.stream.localView?.epochSecrets.size).toBe(2)
        })

        it('bob announces keys to charlie', async () => {
            await tryJoin(alice)
            await waitUntilClientsObserve([bob], { accepted: 1 })
            await tryJoin(bob)
            await waitUntilClientsObserve([charlie], { accepted: 2 })
            await tryJoin(charlie)
            await waitUntilClientsObserve([bob], { accepted: 3 })
            await tryAnnounceSecrets(bob)
            await waitUntilClientsObserve([charlie], { accepted: 4 })
            expect(charlie.stream.onChainView.sealedEpochSecrets.size).toBe(1)
            expect(charlie.stream.localView?.epochSecrets.size).toBe(2)
        })

        it('alice announces keys then bob announces keys', async () => {
            await tryJoin(alice)
            await waitUntilClientsObserve([bob], { accepted: 1 })
            await tryJoin(bob)
            await waitUntilClientsObserve([alice], { accepted: 2 })
            await tryAnnounceSecrets(alice)
            await waitUntilClientsObserve([charlie], { accepted: 3 })
            await tryJoin(charlie)
            await waitUntilClientsObserve([alice], { accepted: 4 })
            await tryAnnounceSecrets(alice)
            await waitUntilClientsObserve([alice, bob, charlie], { accepted: 5 })

            expect(bob.stream.onChainView.sealedEpochSecrets.size).toBe(2)
            expect(bob.stream.localView?.epochSecrets.size).toBe(3)
            expect(charlie.stream.onChainView.sealedEpochSecrets.size).toBe(2)
            expect(charlie.stream.localView?.epochSecrets.size).toBe(3)
        })
    })
})

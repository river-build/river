/**
 * @group main
 */

import { makeTestClient } from '../../testUtils'
import { Client } from '../../../client'
import { Client as MlsClient, ClientOptions as MlsClientOptions } from '@river-build/mls-rs-wasm'
import { dlog, DLogger } from '@river-build/dlog'
import { beforeEach, describe, expect } from 'vitest'
import { MlsStream } from '../../../mls/mlsStream'
import { MlsProcessor, MlsProcessorOpts } from '../../../mls/mlsProcessor'
import { MlsQueue } from '../../../mls/mlsQueue'
import { ChannelMessage_Post_Content_Text } from '@river-build/proto'
import { MLS_ALGORITHM } from '../../../mls'

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
        log: DLogger
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
            log: log.extend(testClient.nickname),
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

    const counts = (c: Counts) => {
        const accepted = c.accepted ?? -1
        const rejected = c.rejected ?? -1
        const processed = c.rejected ?? -1

        return (s: MlsStream) =>
            s.onChainView.accepted.size >= accepted &&
            s.onChainView.rejected.size >= rejected &&
            s.onChainView.processedCount >= processed
    }

    async function check(
        client: TestClientWithProcessor,
        pred: (v: MlsStream, nickname: string) => boolean,
    ): Promise<boolean> {
        await client.stream.handleStreamUpdate()
        return pred(client.stream, client.nickname)
    }

    async function joinAndCheck(
        client: TestClientWithProcessor,
        pred: (v: MlsStream, nickname: string) => boolean,
    ): Promise<boolean> {
        await client.processor.initializeOrJoinGroup(client.stream)
        await client.stream.handleStreamUpdate()
        return pred(client.stream, client.nickname)
    }

    const sealedSecrets = (n: number) => (s: MlsStream, _nickname: string) =>
        s.onChainView.sealedEpochSecrets.size >= n

    const openSecrets = (n: number) => (s: MlsStream, _nickname: string) => {
        const openSecrets = s.localView?.epochSecrets.size ?? -1
        return openSecrets >= n
    }

    function wait(
        clients: TestClientWithProcessor[],
        pred: (v: MlsStream, nickname: string) => boolean,
        opts = { timeout: 10_000 },
    ): Promise<void> {
        return expect
            .poll(async () => {
                const results = await Promise.all(clients.map((client) => check(client, pred)))
                return results.every((x) => x)
            }, opts)
            .toBeTruthy()
    }

    function joinAndWait(
        clients: TestClientWithProcessor[],
        pred: (v: MlsStream, nickname: string) => boolean,
        opts = { timeout: 10_000 },
    ): Promise<void> {
        return expect
            .poll(async () => {
                const results = await Promise.all(
                    clients.map((client) => joinAndCheck(client, pred)),
                )
                return results.every((x) => x)
            }, opts)
            .toBeTruthy()
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
            await wait(clients, counts({ accepted: 1, processed: 1, rejected: 0 }))
            expect(alice.stream.localView?.status).toBe('active')
        })

        test('only one client will be able to join the group', async () => {
            await wait(clients, counts({ accepted: 0, processed: 0, rejected: 0 }))
            const results = await Promise.allSettled(
                clients.map((client) => client.processor.initializeOrJoinGroup(client.stream)),
            )
            const howManySucceeded = results.filter((r) => r.status === 'fulfilled').length
            expect(howManySucceeded).toBeGreaterThan(0)

            await wait(clients, counts({ accepted: 1 }))
            const statuses = clients.map((client) => client.stream.localView?.status)
            const howManyActive = statuses.filter((s) => s === 'active').length
            expect(howManyActive).toBe(1)
        })

        test('eventually all clients will be able to join the group', async () => {
            await wait(clients, counts({ accepted: 0, processed: 0, rejected: 0 }))

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
            await wait(clients, counts({ accepted: 1 }))
            expect(howManyActive()).toBe(1)
            await tryJoin()
            await wait(clients, counts({ accepted: 2 }))
            expect(howManyActive()).toBe(2)
            await tryJoin()
            await wait(clients, counts({ accepted: 3 }))
            expect(howManyActive()).toBe(3)
        })
    })

    const tryJoin = (c: TestClientWithProcessor) => c.processor.initializeOrJoinGroup(c.stream)

    const tryAnnounceSecrets = (c: TestClientWithProcessor) =>
        c.processor.announceEpochSecrets(c.stream)

    describe('announceEpochSecrets', () => {
        it('alice announces keys to bob', async () => {
            await tryJoin(alice)
            await wait([bob], counts({ accepted: 1 }))
            await tryJoin(bob)
            await wait([alice, bob], counts({ accepted: 2 }))
            await tryAnnounceSecrets(alice)
            await wait([alice, bob], sealedSecrets(1))
            await wait([alice, bob], openSecrets(2))
            expect(bob.stream.onChainView.sealedEpochSecrets.size).toBe(1)
            expect(bob.stream.localView?.epochSecrets.size).toBe(2)
        })

        it('bob announces keys to charlie', async () => {
            await tryJoin(alice)
            await wait([bob], counts({ accepted: 1 }))
            await tryJoin(bob)
            await wait([charlie], counts({ accepted: 2 }))
            await tryJoin(charlie)
            await wait([bob], counts({ accepted: 3 }))
            await tryAnnounceSecrets(bob)
            await wait([charlie], counts({ accepted: 4 }))
            expect(charlie.stream.onChainView.sealedEpochSecrets.size).toBe(1)
            expect(charlie.stream.localView?.epochSecrets.size).toBe(2)
        })

        it('alice announces keys then bob announces keys', async () => {
            await tryJoin(alice)
            await wait([bob], counts({ accepted: 1 }))
            await tryJoin(bob)
            await wait([alice], counts({ accepted: 2 }))
            await tryAnnounceSecrets(alice)
            await wait([charlie], sealedSecrets(1))
            await tryJoin(charlie)
            await wait([alice], counts({ accepted: 4 }))
            await tryAnnounceSecrets(alice)
            await wait([alice, bob, charlie], sealedSecrets(2))
            await wait([alice, bob, charlie], openSecrets(3))
        })
    })

    describe('encryptMessage', () => {
        const encryptText = (c: TestClientWithProcessor, message: string, timeout?: number) =>
            c.processor.encryptMessage(
                alice.stream,
                new ChannelMessage_Post_Content_Text({
                    body: message,
                }),
                timeout,
            )

        it('alice can encrypt message after manually waiting to join', async () => {
            await tryJoin(alice)
            await wait([alice], counts({ accepted: 1 }))
            const encrypted = await encryptText(alice, 'hello', 3_000)

            expect(encrypted.algorithm).toBe(MLS_ALGORITHM)
            expect(encrypted.mls?.ciphertext.length).toBeGreaterThan(0)
            expect(encrypted.mls?.epoch).toBe(0n)
        })

        it('alice can encrypt message without joining', { timeout: 10_000 }, async () => {
            const [encrypted] = await Promise.all([
                encryptText(alice, 'hello', 3_000),
                wait([alice], counts({ accepted: 1 })),
            ])

            expect(encrypted.algorithm).toBe(MLS_ALGORITHM)
            expect(encrypted.mls?.ciphertext.length).toBeGreaterThan(0)
            expect(encrypted.mls?.epoch).toBe(0n)
        })

        it(
            'everyone can encrypt message after manually waiting to join',
            { timeout: 10_000 },
            async () => {
                const perClient = async (c: TestClientWithProcessor) => {
                    await expect
                        .poll(
                            async () => {
                                await c.stream.handleStreamUpdate()
                                await tryJoin(c)
                                return c.stream.localView?.status === 'active'
                            },
                            { timeout: 10_000 },
                        )
                        .toBeTruthy()
                    await vi.waitFor(
                        () => {
                            return encryptText(c, `hello from ${c.nickname}`, 3_000)
                        },
                        { timeout: 5_000 },
                    )
                }
                await Promise.all(clients.map(perClient))
            },
        )

        // TODO: Needs some work
        it.skip('everyone can encrypt message without joining', { timeout: 20_000 }, async () => {
            // const perClient = (c: TestClientWithProcessor) => {
            //
            //     return vi.waitFor(
            //         async () => {
            //             c.log('encrypting')
            //             await c.stream
            //                 .handleStreamUpdate()
            //                 .then(() => encryptText(c`hello from ${c.nickname}`))
            //                 .finally(() => c.log('done'))
            //             // try {
            //             //     await encryptText(c, `hello from ${c.nickname}`, 15_000)
            //             // } catch (e) {
            //             //     c.log('error', e)
            //             //     throw e
            //             // }
            //             c.log('done')
            //         },
            //         { timeout: 20_000 },
            //     )
            // }
            // const data = await Promise.all(clients.map(perClient))
            // expect(data.length).toBe(3)
        })
    })
})

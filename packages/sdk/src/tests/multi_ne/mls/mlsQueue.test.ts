/**
 * @group main
 */

import { makeTestClient } from '../../testUtils'
import { Client } from '../../../client'
import {
    Client as MlsClient,
    ClientOptions as MlsClientOptions,
    ExportedTree,
    MlsMessage,
} from '@river-build/mls-rs-wasm'
import { dlog } from '@river-build/dlog'
import { createGroupInfoAndExternalSnapshot, makeExternalJoin, makeInitializeGroup } from './utils'
import { describe, expect } from 'vitest'
import { MlsStream } from '../../../mls/mlsStream'
import { MlsQueue, MlsQueueOpts } from '../../../mls/mlsQueue'
import { LocalView } from '../../../mls/localView'

const encoder = new TextEncoder()

type TestClient = {
    nickname: string
    client: Client
    mlsClient: MlsClient
}

const log = dlog('test:mls:viewAdapter')

describe('MlsQueueTests', () => {
    const clients: TestClientWithQueue[] = []

    const mlsClientOptions: MlsClientOptions = {
        withAllowExternalCommit: true,
        withRatchetTreeExtension: false,
    }

    function makeMlsQueueOpts(nickname: string): MlsQueueOpts {
        const log_ = log.extend(nickname)
        return {
            log: {
                info: log_.extend('info'),
                debug: log_.extend('debug'),
                error: log_.extend('error'),
                warn: log_.extend('warn'),
            },
            delayMs: 15,
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

    type TestClientWithQueue = TestClient & { stream: MlsStream; queue: MlsQueue }

    let alice: TestClientWithQueue
    let bob: TestClientWithQueue
    let charlie: TestClientWithQueue
    let streamId: string

    function makeClient(testClient: TestClient): TestClientWithQueue {
        const stream = new MlsStream(streamId, undefined, testClient.client)
        const queue = new MlsQueue(stream, makeMlsQueueOpts(testClient.nickname))
        return {
            ...testClient,
            stream,
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

    beforeEach(() => {
        for (const client of clients) {
            client.queue.start()
        }
    })

    afterEach(async () => {
        for (const client of clients) {
            await client.queue.stop()
            await client.client.stop()
        }
        clients.length = 0
    })

    async function attemptInitializeGroup(client: TestClient) {
        const group = await client.mlsClient.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)
        const event = makeInitializeGroup(
            client.mlsClient.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        const message = { content: event }
        return {
            group,
            groupInfoMessage,
            event,
            attempt: () => client.client._debugSendMls(streamId, message),
        }
    }

    async function attemptExternalJoin(
        client: TestClient,
        latestGroupInfoMessage: Uint8Array,
        exportedTreeBytes: Uint8Array,
    ) {
        const groupInfoMessage = MlsMessage.fromBytes(latestGroupInfoMessage)
        const exportedTree = ExportedTree.fromBytes(exportedTreeBytes)
        const { group, commit } = await client.mlsClient.commitExternal(
            groupInfoMessage,
            exportedTree,
        )
        const updatedGroupInfoMessage = await group.groupInfoMessageAllowingExtCommit(false)
        const updatedGroupInfoMessageBytes = updatedGroupInfoMessage.toBytes()
        const commitBytes = commit.toBytes()
        const event = makeExternalJoin(
            client.mlsClient.signaturePublicKey(),
            commitBytes,
            updatedGroupInfoMessageBytes,
        )
        const message = { content: event }
        return {
            group,
            commit,
            event,
            attempt: () => client.client._debugSendMls(streamId, message),
        }
    }

    type Counts = {
        accepted?: number
        rejected?: number
        processed?: number
    }

    function waitUntilClientsObserve(
        clients: TestClientWithQueue[],
        counts: Counts,
        opts = { timeout: 10_000 },
    ): Promise<void> {
        const accepted = counts.accepted ?? -1
        const rejected = counts.rejected ?? -1
        const processed = counts.rejected ?? -1

        const perClient = async (client: TestClientWithQueue) => {
            // Manually trigger a stream update
            client.queue.enqueueUpdatedStream(streamId)
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

    function clientsViewsAgree(clients: TestClientWithQueue[]) {
        if (clients.length < 2) {
            return
        }
        const [view, ...others] = clients.map((client) => client.stream.onChainView)
        others.forEach((otherView) => {
            expect(otherView.externalInfo).toStrictEqual(view.externalInfo)
            expect(otherView.accepted).toStrictEqual(view.accepted)
            expect(otherView.rejected).toStrictEqual(view.rejected)
        })
    }

    describe('OnChainView', () => {
        test('clients can observe group being initialized', async () => {
            const aliceAttempt = await attemptInitializeGroup(alice)
            const { eventId: aliceEventId } = await aliceAttempt.attempt()

            await waitUntilClientsObserve(clients, { accepted: 1, processed: 1, rejected: 0 })

            const clientsViews = clients.map((client) => client.stream.onChainView)

            clientsViews.forEach((view) => {
                const externalInfo = view.externalInfo!
                expect(externalInfo).toBeDefined()
                expect(externalInfo.epoch).toBe(0n)
                expect(externalInfo.latestGroupInfo).toStrictEqual(aliceAttempt.groupInfoMessage)

                expect(view.rejected.size).toBe(0)
                expect(view.accepted.size).toBe(1)
                const aliceEvent = aliceAttempt.event
                const acceptedEvent = view.accepted.get(aliceEventId)!
                expect(acceptedEvent).toBeDefined()
                expect(acceptedEvent.case).toBe('initializeGroup')
                expect(acceptedEvent).toMatchObject(aliceEvent)
            })
        })

        test('multiple clients try to create mls group at the same time', async () => {
            const clientAttempts = await Promise.all(clients.map(attemptInitializeGroup))

            const result = await Promise.allSettled(
                clientAttempts.map((attempt) => attempt.attempt()),
            )
            const howManySucceeded = result.filter((r) => r.status === 'fulfilled').length
            expect(howManySucceeded).toBeGreaterThan(0)

            await waitUntilClientsObserve(clients, { accepted: 1, processed: howManySucceeded })

            clientsViewsAgree(clients)
        })

        test('clients can observe external join getting accepted', async () => {
            const aliceAttempt = await attemptInitializeGroup(alice)
            await aliceAttempt.attempt()

            // wait for all clients to observe it
            await waitUntilClientsObserve([bob], { accepted: 1 })

            const bobView = bob.stream.onChainView
            const bobExternalInfo = bobView.externalInfo!
            expect(bobExternalInfo).toBeDefined()

            // double check
            expect(bobExternalInfo.latestGroupInfo).toStrictEqual(
                aliceAttempt.event.value.groupInfoMessage,
            )

            const bobAttempt = await attemptExternalJoin(
                bob,
                bobExternalInfo.latestGroupInfo,
                bobExternalInfo.exportedTree,
            )

            const { eventId } = await bobAttempt.attempt()

            await waitUntilClientsObserve(clients, { accepted: 2 })
            const clientsViews = clients.map((client) => client.stream.onChainView)
            clientsViews.forEach((view) => {
                const bobEvent = bobAttempt.event
                const acceptedEvent = view.accepted.get(eventId)!
                expect(acceptedEvent).toBeDefined()
                expect(acceptedEvent.case).toBe('externalJoin')
                expect(acceptedEvent).toMatchObject(bobEvent)
            })
        })

        test('clients can observe external join getting rejected', async () => {
            const aliceAttempt = await attemptInitializeGroup(alice)
            await aliceAttempt.attempt()

            const otherClients = clients.slice(1)

            // wait for all clients to observe it
            await waitUntilClientsObserve(otherClients, { accepted: 1 })

            const externalJoinAttempts = await Promise.all(
                otherClients.map(async (client) => {
                    const view = client.stream.onChainView
                    const { latestGroupInfo, exportedTree } = view.externalInfo!
                    return attemptExternalJoin(client, latestGroupInfo, exportedTree)
                }),
            )

            const attemptResults = await Promise.allSettled(
                externalJoinAttempts.map((attempt) => attempt.attempt()),
            )

            const howManySucceeded = attemptResults.filter((r) => r.status === 'fulfilled').length
            expect(howManySucceeded).toBeGreaterThan(0)

            const accepted = 2
            const rejected = howManySucceeded - 1

            await waitUntilClientsObserve(clients, { accepted, rejected })
            clientsViewsAgree(clients)
        })
    })

    describe('LocalView', () => {
        test('clients local view becomes active after initializing group', async () => {
            const aliceAttempt = await attemptInitializeGroup(alice)
            const { eventId: aliceEventId } = await aliceAttempt.attempt()
            const aliceLocalView = new LocalView(aliceAttempt.group, {
                eventId: aliceEventId,
                miniblockBefore: 0n,
            })
            alice.stream.trackLocalView(aliceLocalView)

            await waitUntilClientsObserve([alice], { accepted: 1, processed: 1, rejected: 0 })
            expect(aliceLocalView.status).toBe('active')
        })

        test('only one client suceeds to initiaze a group', async () => {
            const clientAttempts = await Promise.all(clients.map(attemptInitializeGroup))

            const result = await Promise.allSettled(
                clientAttempts.map(async (attempt, id) => {
                    const { eventId } = await attempt.attempt()
                    const localView = new LocalView(attempt.group, { eventId, miniblockBefore: 0n })
                    clients[id].stream.trackLocalView(localView)
                }),
            )
            const howManySucceeded = result.filter((r) => r.status === 'fulfilled').length
            expect(howManySucceeded).toBeGreaterThan(0)

            await waitUntilClientsObserve(clients, { accepted: 1, processed: howManySucceeded })
            const statuses = clients.map((c) => c.stream.localView?.status)

            // one client has active local View
            const howManyActive = statuses.filter((s) => s === 'active').length
            expect(howManyActive).toBe(1)
            const howManyRejected = statuses.filter((s) => s === 'rejected').length
            expect(howManyRejected).toBe(howManySucceeded - 1)
            const howManyMissing = statuses.filter((s) => s === undefined).length
            expect(howManyMissing).toBe(clients.length - howManySucceeded)
        })

        test('clients local view becomes active after external join', async () => {
            const aliceAttempt = await attemptInitializeGroup(alice)
            await aliceAttempt.attempt()

            // wait for all clients to observe it
            await waitUntilClientsObserve([bob], { accepted: 1 })

            const bobView = bob.stream.onChainView
            const bobExternalInfo = bobView.externalInfo!
            expect(bobExternalInfo).toBeDefined()

            const bobAttempt = await attemptExternalJoin(
                bob,
                bobExternalInfo.latestGroupInfo,
                bobExternalInfo.exportedTree,
            )

            const { eventId } = await bobAttempt.attempt()
            const bobLocalView = new LocalView(bobAttempt.group, { eventId, miniblockBefore: 0n })
            bob.stream.trackLocalView(bobLocalView)

            await waitUntilClientsObserve([bob], { accepted: 2 })
            expect(bobLocalView.status).toBe('active')
        })

        test('only one client suceeds to external join', async () => {
            const aliceAttempt = await attemptInitializeGroup(alice)
            const { eventId } = await aliceAttempt.attempt()
            const localView = new LocalView(aliceAttempt.group, { eventId, miniblockBefore: 0n })
            alice.stream.trackLocalView(localView)

            const otherClients = clients.slice(1)

            // wait for all clients to observe it
            await waitUntilClientsObserve(otherClients, { accepted: 1 })

            const externalJoinAttempts = await Promise.all(
                otherClients.map(async (client) => {
                    const view = client.stream.onChainView
                    const { latestGroupInfo, exportedTree } = view.externalInfo!
                    return attemptExternalJoin(client, latestGroupInfo, exportedTree)
                }),
            )

            const attemptResults = await Promise.allSettled(
                externalJoinAttempts.map(async (attempt, id) => {
                    const { eventId } = await attempt.attempt()
                    const localView = new LocalView(attempt.group, { eventId, miniblockBefore: 0n })
                    otherClients[id].stream.trackLocalView(localView)
                }),
            )

            const howManySucceeded = attemptResults.filter((r) => r.status === 'fulfilled').length
            expect(howManySucceeded).toBeGreaterThan(0)

            const accepted = 2
            const rejected = howManySucceeded - 1

            await waitUntilClientsObserve(clients, { accepted, rejected })

            const statuses = clients.map((c) => c.stream.localView?.status)

            // one client has active local View
            const howManyActive = statuses.filter((s) => s === 'active').length
            expect(howManyActive).toBe(2)
            const howManyRejected = statuses.filter((s) => s === 'rejected').length
            expect(howManyRejected).toBe(howManySucceeded - 1)
            const howManyMissing = statuses.filter((s) => s === undefined).length
            expect(howManyMissing).toBe(otherClients.length - howManySucceeded)
        })
    })
})

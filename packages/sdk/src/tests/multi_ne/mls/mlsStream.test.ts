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
import { expect } from 'vitest'
import { MlsStream, MlsStreamOpts } from '../../../mls/mlsStream'

const encoder = new TextEncoder()

type TestClient = {
    nickname: string
    client: Client
    mlsClient: MlsClient
}

const log = dlog('test:mls:stream')

describe('MlsStreamTests', () => {
    const clients: TestClientWithMlsStream[] = []

    const mlsClientOptions: MlsClientOptions = {
        withAllowExternalCommit: true,
        withRatchetTreeExtension: false,
    }

    function makeMlsStreamOpts(nickname: string): MlsStreamOpts {
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

    type TestClientWithMlsStream = TestClient & { stream: MlsStream }

    let alice: TestClientWithMlsStream
    let bob: TestClientWithMlsStream
    let charlie: TestClientWithMlsStream
    let streamId: string

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
        alice = {
            ...alice_,
            stream: new MlsStream(
                streamId,
                undefined,
                alice_.client,
                makeMlsStreamOpts(alice_.nickname),
            ),
        }
        bob = {
            ...bob_,
            stream: new MlsStream(
                streamId,
                undefined,
                bob_.client,
                makeMlsStreamOpts(bob_.nickname),
            ),
        }
        charlie = {
            ...charlie_,
            stream: new MlsStream(
                streamId,
                undefined,
                charlie_.client,
                makeMlsStreamOpts(charlie_.nickname),
            ),
        }
        clients.push(alice, bob, charlie)
    })

    beforeEach(() => {
        for (const client of clients) {
            client.stream
        }
    })

    afterEach(async () => {
        for (const client of clients) {
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
        clients: TestClientWithMlsStream[],
        counts: Counts,
        opts = { timeout: 10_000 },
    ): Promise<void> {
        const accepted = counts.accepted ?? -1
        const rejected = counts.rejected ?? -1
        const processed = counts.rejected ?? -1

        const perClient = async (client: TestClientWithMlsStream) => {
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

    function clientsViewsAgree(clients: TestClientWithMlsStream[]) {
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

        const result = await Promise.allSettled(clientAttempts.map((attempt) => attempt.attempt()))
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

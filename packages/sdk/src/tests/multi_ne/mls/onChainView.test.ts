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
import { OnChainView, OnChainViewOpts } from '../../../mls/onChainView'
import { createGroupInfoAndExternalSnapshot, makeExternalJoin, makeInitializeGroup } from './utils'
import { expect } from 'vitest'

const encoder = new TextEncoder()

type TestClient = {
    nickname: string
    client: Client
    mlsClient: MlsClient
}

const log = dlog('test:mls:onChainView')

describe('onChainViewTests', () => {
    const clients: TestClient[] = []

    const mlsClientOptions: MlsClientOptions = {
        withAllowExternalCommit: true,
        withRatchetTreeExtension: false,
    }

    function makeOnChainViewOpts(nickname: string): OnChainViewOpts {
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

        const testClient = {
            nickname,
            client,
            mlsClient,
        }

        clients.push(testClient)

        return testClient
    }

    let alice: TestClient
    let bob: TestClient
    let charlie: TestClient
    let streamId: string

    beforeEach(async () => {
        alice = await makeInitAndStartClient('alice')
        bob = await makeInitAndStartClient('bob')
        charlie = await makeInitAndStartClient('charlie')

        const { streamId: gdmStreamId } = await alice.client.createGDMChannel([
            bob.client.userId,
            charlie.client.userId,
        ])

        await Promise.all(clients.map((client) => client.client.waitForStream(gdmStreamId)))
        streamId = gdmStreamId
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

    async function getView(client: TestClient, verbose = false): Promise<OnChainView> {
        const stream = await client.client.getStream(streamId)
        const opts = verbose ? makeOnChainViewOpts(client.nickname) : undefined
        return OnChainView.loadFromStreamStateView(stream, opts)
    }

    type Counts = {
        accepted?: number
        rejected?: number
        processed?: number
    }

    function waitUntilClientsObserve(
        clients: TestClient[],
        counts: Counts,
        opts = { timeout: 10_000 },
    ): Promise<void> {
        const accepted = counts.accepted ?? -1
        const rejected = counts.rejected ?? -1
        const processed = counts.rejected ?? -1

        const perClient = async (client: TestClient) => {
            const view = await getView(client)
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

    async function clientsViewsAgree(clients: TestClient[]) {
        if (clients.length < 2) {
            return
        }
        const [view, ...others] = await Promise.all(clients.map((client) => getView(client)))
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

        const clientsViews = await Promise.all(clients.map((client) => getView(client)))

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

        await expect(clientsViewsAgree(clients)).resolves.not.toThrow()
    })

    test('clients can observe external join getting accepted', async () => {
        const aliceAttempt = await attemptInitializeGroup(alice)
        await aliceAttempt.attempt()

        // wait for all clients to observe it
        await waitUntilClientsObserve([bob], { accepted: 1 })

        const bobView = await getView(bob)
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
        const clientsViews = await Promise.all(clients.map((client) => getView(client)))
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
                const view = await getView(client)
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
        await expect(clientsViewsAgree(clients)).resolves.not.toThrow()
    })
})

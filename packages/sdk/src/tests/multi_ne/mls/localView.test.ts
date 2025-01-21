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
import { LocalView } from '../../../mls/localView'
import { MlsConfirmedEvent } from '../../../mls/types'

const encoder = new TextEncoder()

type TestClient = {
    nickname: string
    client: Client
    mlsClient: MlsClient
}

const log = dlog('test:mls:onChainView')

describe('localViewTests', () => {
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

    test('alice can observe her group getting initialized', async () => {
        const aliceAttempt = await attemptInitializeGroup(alice)
        const { eventId: aliceEventId } = await aliceAttempt.attempt()
        const aliceView = new LocalView(aliceAttempt.group, {
            eventId: aliceEventId,
            miniblockBefore: 0n,
        })

        expect(aliceView.status).toBe('pending')
        await waitUntilClientsObserve([alice], { accepted: 1, processed: 1, rejected: 0 })
        const view = await getView(alice)
        await expect(aliceView.processOnChainView(view)).resolves.not.toThrow()
        expect(aliceView.status).toBe('active')
    })

    test('alice can objserve her external join getting accepted', async () => {
        const bobAttempt = await attemptInitializeGroup(bob)
        await bobAttempt.attempt()
        await waitUntilClientsObserve([alice], { accepted: 1 })
        const view = await getView(alice)
        const externalInfo = view.externalInfo!
        expect(externalInfo).toBeDefined()
        const aliceAttempt = await attemptExternalJoin(
            alice,
            externalInfo.latestGroupInfo,
            externalInfo.exportedTree,
        )
        const { eventId: aliceEventId } = await aliceAttempt.attempt()
        const aliceView = new LocalView(aliceAttempt.group, {
            eventId: aliceEventId,
            miniblockBefore: 0n,
        })
        await waitUntilClientsObserve([alice], { accepted: 2 })
        const updatedView = await getView(alice)
        await aliceView.processOnChainView(updatedView)
        expect(aliceView.status).toBe('active')
    })

    test('alice will reject if her event will be marked as rejected', async () => {
        const aliceAttempt = await attemptInitializeGroup(alice)
        const aliceEventId = 'aliceEvent'
        const aliceView = new LocalView(aliceAttempt.group, {
            eventId: aliceEventId,
            miniblockBefore: 0n,
        })

        const view = await getView(alice)
        view.rejected.set(aliceEventId, <MlsConfirmedEvent>{})
        await aliceView.processOnChainView(view)
        expect(aliceView.status).toBe('rejected')
    })

    test('alice will reject if she sees commit from another group', async () => {
        const aliceAttempt = await attemptInitializeGroup(alice)
        const aliceEventId = 'aliceEvent'
        const aliceView = new LocalView(aliceAttempt.group, {
            eventId: aliceEventId,
            miniblockBefore: 0n,
        })

        const bobAttempt = await attemptInitializeGroup(bob)
        await bobAttempt.attempt()
        await waitUntilClientsObserve([charlie], { accepted: 1 })
        const charlieView = await getView(charlie)
        const charlieExternalInfo = charlieView.externalInfo!
        expect(charlieExternalInfo).toBeDefined()
        const charlieAttempt = await attemptExternalJoin(
            charlie,
            charlieExternalInfo.latestGroupInfo,
            charlieExternalInfo.exportedTree,
        )
        await charlieAttempt.attempt()
        await waitUntilClientsObserve([alice], { accepted: 2 })
        const onChainView = await getView(alice)
        await aliceView.processOnChainView(onChainView)
        expect(aliceView.status).toBe('rejected')
    })
})

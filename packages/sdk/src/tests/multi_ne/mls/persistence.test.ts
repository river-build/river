/**
 * @group main
 */

import { makeTestClient, makeUniqueSpaceStreamId, TestClientOpts, waitFor } from '../../testUtils'
import { dlog } from '@river-build/dlog'
import { MembershipOp } from '@river-build/proto'
import { makeUniqueChannelStreamId } from '../../../id'
import { Client } from '../../../client'
import { beforeEach, describe, expect } from 'vitest'
import { checkTimelineContainsAll } from './utils'
import { SyncState } from '../../../syncedStreamsLoop'
import { MLS_ALGORITHM } from '../../../mls'

const log = dlog('test:mls:channel')

const clients: Client[] = []
const messages: string[] = []

afterEach(async () => {
    for (const client of clients) {
        await client.stop()
    }
    // empty clients
    clients.length = 0
    // empty message history
    messages.length = 0
})

const bigIntAsc = (a: bigint, b: bigint) => (a < b ? -1 : a > b ? 1 : 0)
// const bigIntDesc = (a: bigint, b: bigint) => (a > b ? -1 : a < b ? 1 : 0)

async function makeInitAndStartClient(nickname?: string, opts?: TestClientOpts) {
    const clientLog = log.extend(nickname ?? 'client')
    const testClientOpts = {
        ...{ mlsOpts: { nickname, log: clientLog, deviceId: opts?.deviceId } },
        ...opts,
    }
    const client = await makeTestClient(testClientOpts)
    await client.initializeUser()
    client.startSync()
    await waitFor(() => expect(client.streams.syncState).toBe(SyncState.Syncing))
    clients.push(client)
    return client
}

describe('persistenceMlsTests', () => {
    let alice: Client
    let spaceId: string
    let channelId: string

    const send = (client: Client, message: string) => {
        messages.push(message)
        return client.sendMessage(channelId, message)
    }
    const timeline = (client: Client) => client.streams.get(channelId)?.view.timeline || []

    const clientStatus = (client: Client) =>
        client.mlsExtensions?.agent?.streams.get(channelId)?.localView?.status

    const epochSecrets = (c: Client) => {
        const epochSecrets = c.mlsExtensions?.agent?.streams.get(channelId)?.localView?.epochSecrets
        const epochSecretsArray = epochSecrets ? Array.from(epochSecrets.entries()) : []
        epochSecretsArray.sort(([a], [b]) => bigIntAsc(a, b))
        return epochSecretsArray
    }

    const isActive = (client: Client) => clientStatus(client) === 'active'

    const everyone = (fn: (client: Client) => boolean) => clients.every(fn)

    const hasKeys = (...epochs: number[]) => {
        const desiredEpochs = epochs.map((i) => BigInt(i))
        desiredEpochs.sort(bigIntAsc)
        return (client: Client) => {
            expect(epochSecrets(client).map((a) => a[0])).toStrictEqual(desiredEpochs)
            return true
        }
    }

    const hasAllKeys = () => {
        const allKeys = clients.map((_, i) => i)
        return hasKeys(...allKeys)
    }

    const sawMessage =
        (...messages: string[]) =>
        (client: Client) =>
            checkTimelineContainsAll(messages, timeline(client))

    const sawAll = sawMessage(...messages)

    const poll = (fn: () => boolean, opts = { timeout: 10_000 }) =>
        expect.poll(fn, opts).toBeTruthy()

    const everyoneActive = (opts = { timeout: 10_000 }) => poll(() => everyone(isActive), opts)

    const joinStream = async (client: Client, streamId: string) => {
        await client.joinStream(streamId)
        const stream = await client.waitForStream(streamId)
        await stream.waitForMembership(MembershipOp.SO_JOIN)
    }

    const join = async (client: Client) => {
        await joinStream(client, spaceId)
        await joinStream(client, channelId)
    }

    beforeEach(async () => {
        alice = await makeInitAndStartClient('alice', { deviceId: 'alice' })
        spaceId = makeUniqueSpaceStreamId()
        await alice.createSpace(spaceId)
        await alice.waitForStream(spaceId)
        channelId = makeUniqueChannelStreamId(spaceId)

        await alice.createChannel(spaceId, 'channel', 'topic', channelId)
        await alice.waitForStream(channelId)
        await alice.setStreamEncryptionAlgorithm(channelId, MLS_ALGORITHM)
        await everyoneActive()
        await send(alice, 'hello bob')
        await alice.stop()
    })

    it('bob can join but not see messages', { timeout: 20_000 }, async () => {
        const bob = await makeInitAndStartClient('bob', { deviceId: 'bob' })
        await join(bob)
        await poll(() => isActive(bob))
        await expect(poll(() => sawMessage('hello bob')(bob), { timeout: 5_000 })).rejects.toThrow()
    })

    it('alice comes back online', { timeout: 30_000 }, async () => {
        const bob = await makeInitAndStartClient('bob', { deviceId: 'bob' })
        await join(bob)
        await poll(() => isActive(bob))

        const aliceIsBack = await makeInitAndStartClient('alice', {
            context: alice.signerContext,
            deviceId: 'alice',
        })

        await poll(() => isActive(aliceIsBack), { timeout: 5_000 })
        await poll(() => hasKeys(0, 1)(aliceIsBack), { timeout: 5_000 })
        await poll(() => sawAll(aliceIsBack), { timeout: 5_000 })
    })

    it(
        'alice comes back online and bob can see all the messages',
        { timeout: 30_000 },
        async () => {
            const bobAndAliceIsBack = await Promise.all([
                makeInitAndStartClient('bob', { deviceId: 'bob' }).then(async (bob) => {
                    await join(bob)
                    return bob
                }),
                makeInitAndStartClient('alice', {
                    context: alice.signerContext,
                    deviceId: 'alice',
                }),
            ])

            await poll(() => bobAndAliceIsBack.every(isActive), { timeout: 5_000 })
            await poll(() => bobAndAliceIsBack.every(hasKeys(0, 1)), { timeout: 5_000 })
            await poll(() => bobAndAliceIsBack.every(sawAll), { timeout: 5_000 })
        },
    )

    it('bob sends a message while alice is offline', { timeout: 30_000 }, async () => {
        const bob = await makeInitAndStartClient('bob', { deviceId: 'bob' })
        await join(bob)
        await poll(() => isActive(bob))
        await send(bob, 'hello bob')
        await bob.stop()

        const aliceIsBack = await makeInitAndStartClient('alice', {
            context: alice.signerContext,
            deviceId: 'alice',
        })

        const activeUsers = [aliceIsBack]
        await poll(() => activeUsers.every(isActive), { timeout: 5_000 })
        await poll(() => activeUsers.every(hasKeys(0, 1)), { timeout: 5_000 })
        await poll(() => activeUsers.every(sawAll), { timeout: 5_000 })
    })
})

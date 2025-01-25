/**
 * @group main
 */

import { makeTestClient, makeUniqueSpaceStreamId } from '../../testUtils'
import { dlog } from '@river-build/dlog'
import { MembershipOp } from '@river-build/proto'
import { makeUniqueChannelStreamId } from '../../../id'
import { MLS_ALGORITHM } from '../../../mls'
import { Client } from '../../../client'
import { beforeEach, describe } from 'vitest'
import { checkTimelineContainsAll } from './utils'

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

async function makeInitAndStartClient(nickname?: string) {
    const clientLog = log.extend(nickname ?? 'client')
    const client = await makeTestClient({ mlsOpts: { nickname, log: clientLog } })
    await client.initializeUser()
    client.startSync()
    clients.push(client)
    return client
}

describe('channelMlsTests', () => {
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
        epochSecretsArray.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        return epochSecretsArray
    }

    const isActive = (client: Client) => clientStatus(client) === 'active'

    const everyone = (fn: (client: Client) => boolean) => clients.every(fn)

    const hasAllKeys = (client: Client) => {
        const desiredKeys = clients.map((_, i) => BigInt(i))
        expect(epochSecrets(client).map((a) => a[0])).toStrictEqual(desiredKeys)
        return true
    }

    const saw = (client: Client, messages: string[]) =>
        checkTimelineContainsAll(messages, timeline(client))

    const sawAll = (client: Client) => saw(client, messages)

    const everyoneActive = (opts = { timeout: 10_000 }) => poll(() => everyone(isActive), opts)

    const everyoneHasAllKeys = (opts = { timeout: 10_000 }) =>
        poll(() => everyone(hasAllKeys), opts)

    const everyoneSawAll = (opts = { timeout: 10_000 }) => poll(() => everyone(sawAll), opts)

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
        alice = await makeInitAndStartClient('alice')
        spaceId = makeUniqueSpaceStreamId()
        await alice.createSpace(spaceId)
        await alice.waitForStream(spaceId)
        channelId = makeUniqueChannelStreamId(spaceId)

        await alice.createChannel(spaceId, 'channel', 'topic', channelId)
        await alice.waitForStream(channelId)
    })

    describe('alice alone in the channel', () => {
        beforeEach(async () => {
            await alice.setStreamEncryptionAlgorithm(channelId, MLS_ALGORITHM)
            await poll(() => isActive(alice))
        }, 10_000)

        it('everyone is active', { timeout: 10_000 }, async () => {
            await everyoneActive()
            await everyoneHasAllKeys()
        })

        const timeout = 20_000

        it('everyone saw a message', { timeout }, async () => {
            await send(alice, 'hello all')
            await everyoneSawAll({ timeout })
        })
    })

    describe('alice sends message then invites bob', () => {
        let bob: Client

        beforeEach(async () => {
            await alice.setStreamEncryptionAlgorithm(channelId, MLS_ALGORITHM)
            await poll(() => isActive(alice))
            await send(alice, 'hello bob')
        }, 10_000)

        beforeEach(async () => {
            bob = await makeInitAndStartClient('bob')
            await join(bob)
        })

        const timeout = 10_000

        it('bob is active', { timeout }, async () => {
            await poll(() => isActive(bob), { timeout })
        })

        it('bob has all keys', { timeout }, async () => {
            await poll(() => hasAllKeys(bob), { timeout })
        })

        it('bob saw the message', { timeout }, async () => {
            await poll(() => saw(bob, ['hello bob']), { timeout })
        })
    })

    describe('alice invites 3', () => {
        const nicknames = ['bob', 'charlie', 'dave']

        beforeEach(async () => {
            const newcomers = await Promise.all(nicknames.map(makeInitAndStartClient))
            await Promise.all(newcomers.map(join))
        }, 10_000)

        beforeEach(async () => {
            await alice.setStreamEncryptionAlgorithm(channelId, MLS_ALGORITHM)
        }, 10_000)

        const timeout = 20_000

        it('everyone is active', { timeout }, async () => {
            await everyoneActive({ timeout })
            await everyoneHasAllKeys({ timeout })
        })

        it('everyone saw a message', { timeout }, async () => {
            await send(alice, 'hello all')
            await everyoneSawAll({ timeout })
        })

        it('everyone can send a message', { timeout }, async () => {
            await Promise.all(
                clients.flatMap((c, i) =>
                    Array.from({ length: 10 }, (_, j) => send(c, `${j} from ${i}`)),
                ),
            )

            await everyoneSawAll({ timeout })
        })
    })
})

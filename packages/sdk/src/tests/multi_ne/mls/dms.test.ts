/**
 * @group main
 */

import { Client } from '../../../client'
import { makeTestClient } from '../../testUtils'
import { MLS_ALGORITHM } from '../../../mls'
import { checkTimelineContainsAll } from './utils'
import { dlog } from '@river-build/dlog'

const log = dlog('test:mls:dms')

const clients: Client[] = []
const messages: string[] = []

beforeEach(async () => {})

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
    const client = await makeTestClient({ nickname, mlsOpts: { log: clientLog } })
    await client.initializeUser()
    client.startSync()
    clients.push(client)
    return client
}

describe('dmsMlsTests', () => {
    let alice!: Client
    let bob!: Client
    let streamId!: string

    beforeEach(async () => {
        alice = await makeInitAndStartClient('alice')
        bob = await makeInitAndStartClient('bob')
        const { streamId: dmStreamId } = await alice.createDMChannel(bob.userId)
        streamId = dmStreamId
        await expect(alice.waitForStream(streamId)).resolves.toBeDefined()
        await expect(bob.waitForStream(streamId)).resolves.toBeDefined()
    }, 10_000)

    beforeEach(async () => {
        await alice.setStreamEncryptionAlgorithm(streamId, MLS_ALGORITHM)
    }, 5_000)

    it('clientCanCreateDM', async () => {
        expect(alice).toBeDefined()
        expect(bob).toBeDefined()
        expect(streamId).toBeDefined()
    })
    const clientStatus = (client: Client) =>
        client.mlsExtensions?.agent?.streams.get(streamId)?.localView?.status

    it('clientsBecomeActive', { timeout: 5_000 }, async () => {
        await Promise.all([
            ...clients.map((c) =>
                expect.poll(() => clientStatus(c), { timeout: 10_000 }).toBe('active'),
            ),
        ])
    })

    const send = (client: Client, message: string) => {
        messages.push(message)
        return client.sendMessage(streamId, message)
    }
    const timeline = (client: Client) => client.streams.get(streamId)?.view.timeline || []

    it('clientsCanSendMessage', { timeout: 15_000 }, async () => {
        await send(alice, 'hello bob')

        await expect
            .poll(() => checkTimelineContainsAll(['hello bob'], timeline(bob)), { timeout: 15_000 })
            .toBe(true)
    })

    it('clientsCanSendMutlipleMessages', { timeout: 10_000 }, async () => {
        await Promise.all([
            ...clients.flatMap((c: Client, i) =>
                Array.from({ length: 10 }, (_, j) => send(c, `message ${j} from client ${i}`)),
            ),
            ...clients.map((c: Client) =>
                expect
                    .poll(() => checkTimelineContainsAll(messages, timeline(c)), {
                        timeout: 10_000,
                    })
                    .toBe(true),
            ),
        ])
    })

    const epochSecrets = (c: Client) => {
        const epochSecrets = c.mlsExtensions?.agent?.streams.get(streamId)?.localView?.epochSecrets
        const epochSecretsArray = epochSecrets ? Array.from(epochSecrets.entries()) : []
        epochSecretsArray.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        return epochSecretsArray
    }

    it('clientsAgreeOnEpochSecrets', async () => {
        await Promise.all([
            ...clients.map((c) =>
                expect
                    .poll(() => epochSecrets(c).map((a) => a[0]), { timeout: 10_000 })
                    .toStrictEqual(clients.map((_, i) => BigInt(i))),
            ),
        ])

        expect(epochSecrets(bob)).toStrictEqual(epochSecrets(alice))
    })
})

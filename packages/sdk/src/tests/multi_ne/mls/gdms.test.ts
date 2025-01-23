/**
 * @group main
 */

import { Client } from '../../../client'
import { makeTestClient } from '../../testUtils'
import { MLS_ALGORITHM } from '../../../mls'
import { checkTimelineContainsAll } from './utils'
import { dlog } from '@river-build/dlog'
import { beforeEach, describe } from 'vitest'

const log = dlog('test:mls:gdms')

const clients: Client[] = []
const messages: string[] = []
const nicks = [
    'alice',
    'bob',
    'charlie',
    'david',
    'eve',
    'frank',
    'george',
    'harry',
    'irene',
    'james',
]

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

describe('gdmsMlsTests', () => {
    let streamId!: string
    const send = (client: Client, message: string) => client.sendMessage(streamId, message)
    const timeline = (client: Client) => client.streams.get(streamId)?.view.timeline || []

    const clientStatus = (client: Client) =>
        client.mlsExtensions?.agent?.streams.get(streamId)?.localView?.status

    const epochSecrets = (c: Client) => {
        const epochSecrets = c.mlsExtensions?.agent?.streams.get(streamId)?.localView?.epochSecrets
        const epochSecretsArray = epochSecrets ? Array.from(epochSecrets.entries()) : []
        epochSecretsArray.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        return epochSecretsArray
    }

    describe('3Clients', () => {
        let alice!: Client
        let bob!: Client
        let charlie!: Client

        beforeEach(async () => {
            alice = await makeInitAndStartClient('alice')
            bob = await makeInitAndStartClient('bob')
            charlie = await makeInitAndStartClient('charlie')
            const { streamId: gdmStreamId } = await alice.createGDMChannel([
                bob.userId,
                charlie.userId,
            ])
            streamId = gdmStreamId
            await expect(
                Promise.all([
                    alice.waitForStream(streamId),
                    bob.waitForStream(streamId),
                    charlie.waitForStream(streamId),
                ]),
            ).resolves.toBeDefined()
        }, 10_000)

        beforeEach(async () => {
            await alice.setStreamEncryptionAlgorithm(streamId, MLS_ALGORITHM)
        }, 5_000)

        it('clientCanCreateGDM', async () => {
            expect(alice).toBeDefined()
            expect(bob).toBeDefined()
            expect(charlie).toBeDefined()
            expect(streamId).toBeDefined()
        })

        it('clientsBecomeActive', { timeout: 15_000 }, async () => {
            await Promise.all([
                ...clients.map((c) =>
                    expect.poll(() => clientStatus(c), { timeout: 15_000 }).toBe('active'),
                ),
            ])
        })

        it('clientsCanSendMessage', { timeout: 15_000 }, async () => {
            await send(alice, 'hello all')

            await expect
                .poll(
                    () =>
                        clients.every((c) => checkTimelineContainsAll(['hello all'], timeline(c))),
                    { timeout: 15_000 },
                )
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

        it('clientsAgreeOnEpochSecrets', async () => {
            await Promise.all([
                ...clients.map((c) =>
                    expect
                        .poll(() => epochSecrets(c).map((a) => a[0]), { timeout: 10_000 })
                        .toStrictEqual(clients.map((_, i) => BigInt(i))),
                ),
            ])

            const [owner, ...others] = clients

            others.forEach((other) => {
                expect(epochSecrets(other)).toStrictEqual(epochSecrets(owner))
            })
        })

        describe('3+3Clients', () => {
            let david!: Client
            let eve!: Client
            let frank!: Client

            beforeEach(async () => {
                // david = await makeInitAndStartClient('david')
                // eve = await makeInitAndStartClient('eve')
                // frank = await makeInitAndStartClient('frank')
                // await alice.inviteUser(streamId, david.userId)
                // await Promise.all([
                //     alice.inviteUser(streamId, david.userId),
                //     alice.inviteUser(streamId, eve.userId),
                //     alice.inviteUser(streamId, frank.userId),
                // ])
                // await Promise.all([
                //     david.waitForStream(streamId),
                //     eve.waitForStream(streamId),
                //     frank.waitForStream(streamId),
                // ])
            })

            it('clientsCanJoinGDM', async () => {
                // expect(david).toBeDefined()
                // expect(eve).toBeDefined()
                // expect(frank).toBeDefined()
            })

            it('canInviteUsers', async () => {
                // await alice.inviteUser(streamId, david.userId)
                // await david.waitForStream(streamId)
            })

            // it('clientsBecomeActive', { timeout: 15_000 }, async () => {
            //     await Promise.all([
            //         ...clients.map((c) =>
            //             expect.poll(() => clientStatus(c), { timeout: 15_000 }).toBe('active'),
            //         ),
            //     ])
            // })
            //
            // it('clientsCanSendMessage', { timeout: 15_000 }, async () => {
            //     await send(alice, 'hello all')
            //
            //     await expect
            //         .poll(
            //             () =>
            //                 clients.every((c) => checkTimelineContainsAll(['hello all'], timeline(c))),
            //             { timeout: 15_000 },
            //         )
            //         .toBe(true)
            // })
            //
            // it('clientsCanSendMutlipleMessages', { timeout: 10_000 }, async () => {
            //     await Promise.all([
            //         ...clients.flatMap((c: Client, i) =>
            //             Array.from({ length: 10 }, (_, j) => send(c, `message ${j} from client ${i}`)),
            //         ),
            //         ...clients.map((c: Client) =>
            //             expect
            //                 .poll(() => checkTimelineContainsAll(messages, timeline(c)), {
            //                     timeout: 10_000,
            //                 })
            //                 .toBe(true),
            //         ),
            //     ])
            // })
            //
            // it('clientsAgreeOnEpochSecrets', async () => {
            //     await Promise.all([
            //         ...clients.map((c) =>
            //             expect
            //                 .poll(() => epochSecrets(c).map((a) => a[0]), { timeout: 10_000 })
            //                 .toStrictEqual(clients.map((_, i) => BigInt(i))),
            //         ),
            //     ])
            //
            //     const [owner, ...others] = clients
            //
            //     others.forEach((other) => {
            //         expect(epochSecrets(other)).toStrictEqual(epochSecrets(owner))
            //     })
            // })
        })
    })

    describe('2+1Clients', () => {
        let alice!: Client
        let bob!: Client
        let charlie!: Client
        let david!: Client

        beforeEach(async () => {
            alice = await makeInitAndStartClient('alice')
            bob = await makeInitAndStartClient('bob')
            charlie = await makeInitAndStartClient('charlie')
            david = await makeInitAndStartClient('david')
            const { streamId: gdmStreamId } = await alice.createGDMChannel([
                bob.userId,
                charlie.userId,
            ])
            streamId = gdmStreamId
            await expect(Promise.all([alice.waitForStream(streamId)])).resolves.toBeDefined()
            await expect(Promise.all([bob.waitForStream(streamId)])).resolves.toBeDefined()
            await expect(Promise.all([charlie.waitForStream(streamId)])).resolves.toBeDefined()
        }, 10_000)

        beforeEach(async () => {
            await alice.setStreamEncryptionAlgorithm(streamId, MLS_ALGORITHM)
            await expect.poll(() => clientStatus(alice), { timeout: 10_000 }).toBe('active')
        }, 10_000)

        it('inviteUserToGDMWithMLSEnabled', async () => {
            // await alice.inviteUser(streamId, david.userId)
            // await david.waitForStream(streamId)
        })
    })
})

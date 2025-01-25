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

const ALICE = 0
const BOB = 1
const CHARLIE = 2
const DAVID = 3
const EVE = 4
const FRANK = 5

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

    const send = (client: Client, message: string) => {
        messages.push(message)
        return client.sendMessage(streamId, message)
    }
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
            alice = await makeInitAndStartClient(nicks[ALICE])
            bob = await makeInitAndStartClient(nicks[BOB])
            charlie = await makeInitAndStartClient(nicks[CHARLIE])
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
            const desiredEpochs = clients.map((_, i) => BigInt(i))
            await expect
                .poll(
                    () =>
                        clients.every((c) => {
                            const epochs = epochSecrets(c).map((a) => a[0])
                            expect(epochs).toStrictEqual(desiredEpochs)
                            return true
                        }),
                    { timeout: 20_000 },
                )
                .toBeTruthy()

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
                david = await makeInitAndStartClient(nicks[DAVID])
                eve = await makeInitAndStartClient(nicks[EVE])
                frank = await makeInitAndStartClient(nicks[FRANK])

                await Promise.all(
                    [david, eve, frank].map(async (c) => {
                        await alice.inviteUser(streamId, c.userId)
                        await c.joinStream(streamId)
                        await c.waitForStream(streamId)
                    }),
                )
            }, 10_000)

            it('invitedClientsBecomeActive', async () => {
                await expect
                    .poll(() => [david, eve, frank].every((c) => clientStatus(c) === 'active'), {
                        timeout: 10_000,
                    })
                    .toBeTruthy()
            })

            it('clientsCanSendMessage', { timeout: 15_000 }, async () => {
                await send(alice, 'hello all')

                await expect
                    .poll(
                        () =>
                            clients.every((c) =>
                                checkTimelineContainsAll(['hello all'], timeline(c)),
                            ),
                        { timeout: 15_000 },
                    )
                    .toBe(true)
            })

            it('clientsCanSendMutlipleMessages', { timeout: 20_000 }, async () => {
                await Promise.all([
                    ...clients.flatMap((c: Client, i) =>
                        Array.from({ length: 10 }, (_, j) =>
                            send(c, `new message ${j} from client ${i}`),
                        ),
                    ),
                    ...clients.map((c: Client) =>
                        expect
                            .poll(() => checkTimelineContainsAll(messages, timeline(c)), {
                                timeout: 20_000,
                            })
                            .toBe(true),
                    ),
                ])
            })

            it('clientsAgreeOnEpochSecrets', { timeout: 20_000 }, async () => {
                const desiredEpochs = clients.map((_, i) => BigInt(i))
                await expect
                    .poll(
                        () =>
                            clients.every((c) => {
                                const epochs = epochSecrets(c).map((a) => a[0])
                                expect(epochs).toStrictEqual(desiredEpochs)
                                return true
                            }),
                        { timeout: 20_000 },
                    )
                    .toBeTruthy()

                const [owner, ...others] = clients

                others.forEach((other) => {
                    expect(epochSecrets(other)).toStrictEqual(epochSecrets(owner))
                })
            })
        })
    })
})

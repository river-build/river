/**
 * @group main
 */

import { Client } from '../../../client'
import { MLS_ALGORITHM } from '../../../mls'
import { elogger } from '@river-build/dlog'
import { beforeEach, describe } from 'vitest'
import { MlsFixture, test } from './fixture'

const log = elogger('test:mls:gdms')

const ALICE = 0
const BOB = 1
const CHARLIE = 2
const DAVID = 3
const EVE = 4
const FRANK = 5

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

beforeEach<MlsFixture>(({ logger }) => {
    logger.set(log)
})

describe('gdmsMlsTests', () => {
    describe('3Clients', () => {
        let alice!: Client
        let bob!: Client
        let charlie!: Client

        beforeEach<MlsFixture>(async ({ makeInitAndStartClient, streams }) => {
            alice = await makeInitAndStartClient({ logId: nicks[ALICE] })
            bob = await makeInitAndStartClient({ logId: nicks[BOB] })
            charlie = await makeInitAndStartClient({ logId: nicks[CHARLIE] })
            const { streamId } = await alice.createGDMChannel([bob.userId, charlie.userId])
            streams.add(streamId)
            await expect(
                Promise.all([
                    alice.waitForStream(streamId),
                    bob.waitForStream(streamId),
                    charlie.waitForStream(streamId),
                ]),
            ).resolves.toBeDefined()
        }, 20_000)

        beforeEach<MlsFixture>(async ({ streams }) => {
            await alice.setStreamEncryptionAlgorithm(streams.lastOrThrow(), MLS_ALGORITHM)
        }, 10_000)

        test('clientsBecomeActive', { timeout: 40_000 }, async ({ clients, isActive, poll }) => {
            await poll(() => clients.every(isActive), { timeout: 20_000 })
        })

        test(
            'clientsCanSendMessage',
            { timeout: 40_000 },
            async ({ clients, sendMessage, poll, saw }) => {
                await sendMessage(alice, 'hello all')

                await poll(() => clients.every(saw('hello all')), { timeout: 20_000 })
            },
        )

        test(
            'clientsCanSendMutlipleMessages',
            { timeout: 40_000 },
            async ({ clients, sendMessage, sawAll, poll }) => {
                await Promise.all([
                    ...clients.flatMap((c: Client, i) =>
                        Array.from({ length: 10 }, (_, j) =>
                            sendMessage(c, `message ${j} from client ${i}`),
                        ),
                    ),
                    poll(() => clients.every(sawAll), { timeout: 20_000 }),
                ])
            },
        )

        test(
            'clientsAgreeOnEpochSecrets',
            { timeout: 40_000 },
            async ({ clients, poll, hasEpochs, epochSecrets }) => {
                const desiredEpochs = clients.map((_, i) => i)
                await poll(() => clients.every(hasEpochs(...desiredEpochs)), { timeout: 20_000 })
                const [owner, ...others] = clients

                others.forEach((other) => {
                    expect(epochSecrets(other)).toStrictEqual(epochSecrets(owner))
                })
            },
        )

        describe('3+3Clients', () => {
            let david!: Client
            let eve!: Client
            let frank!: Client

            beforeEach<MlsFixture>(async ({ makeInitAndStartClient, streams }) => {
                david = await makeInitAndStartClient({ logId: nicks[DAVID] })
                eve = await makeInitAndStartClient({ logId: nicks[EVE] })
                frank = await makeInitAndStartClient({ logId: nicks[FRANK] })
                const streamId = streams.lastOrThrow()

                await Promise.all(
                    [david, eve, frank].map(async (c) => {
                        await alice.inviteUser(streamId, c.userId)
                        await c.joinStream(streamId)
                        await c.waitForStream(streamId)
                    }),
                )
            }, 20_000)

            test('invitedClientsBecomeActive', { timeout: 60_000 }, async ({ isActive, poll }) => {
                await poll(() => [david, eve, frank].every(isActive), { timeout: 30_000 })
            })

            test(
                'clientsCanSendMessage',
                { timeout: 60_000 },
                async ({ sendMessage, poll, clients, saw }) => {
                    await sendMessage(alice, 'hello all')

                    await poll(() => clients.every(saw('hello all')), { timeout: 30_000 })
                },
            )

            test(
                'clientsCanSendMutlipleMessages',
                { timeout: 60_000 },
                async ({ clients, sendMessage, sawAll, poll }) => {
                    await Promise.all([
                        ...clients.flatMap((c: Client, i) =>
                            Array.from({ length: 10 }, (_, j) =>
                                sendMessage(c, `new message ${j} from client ${i}`),
                            ),
                        ),
                        poll(() => clients.every(sawAll), { timeout: 30_000 }),
                    ])
                },
            )

            test(
                'clientsAgreeOnEpochSecrets',
                { timeout: 60_000 },
                async ({ clients, poll, hasEpochs, epochSecrets }) => {
                    const desiredEpochs = clients.map((_, i) => i)
                    await poll(() => clients.every(hasEpochs(...desiredEpochs)), {
                        timeout: 30_000,
                    })

                    const [owner, ...others] = clients

                    others.forEach((other) => {
                        expect(epochSecrets(other)).toStrictEqual(epochSecrets(owner))
                    })
                },
            )
        })
    })
})

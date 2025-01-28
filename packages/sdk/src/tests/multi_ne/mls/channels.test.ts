/**
 * @group main
 */

import { makeUniqueSpaceStreamId } from '../../testUtils'
import { elogger } from '@river-build/dlog'
import { makeUniqueChannelStreamId } from '../../../id'
import { MLS_ALGORITHM } from '../../../mls'
import { Client } from '../../../client'
import { beforeEach, describe } from 'vitest'
import { MlsFixture, test } from './fixture'

const log = elogger('test:mls:channel')

beforeEach<MlsFixture>(({ logger }) => {
    logger.set(log)
})

describe('channelMlsTests', () => {
    let alice: Client

    beforeEach<MlsFixture>(async ({ makeInitAndStartClient, streams }) => {
        alice = await makeInitAndStartClient({ logId: 'alice' })
        const spaceId = makeUniqueSpaceStreamId()
        await alice.createSpace(spaceId)
        await alice.waitForStream(spaceId)
        streams.add(spaceId)

        const channelId = makeUniqueChannelStreamId(spaceId)
        await alice.createChannel(spaceId, 'channel', 'topic', channelId)
        await alice.waitForStream(channelId)
        streams.add(channelId)
    })

    describe('alice alone in the channel', () => {
        beforeEach<MlsFixture>(async ({ streams }) => {
            const channelId = streams.lastOrThrow()
            await alice.setStreamEncryptionAlgorithm(channelId, MLS_ALGORITHM)
        }, 10_000)

        test('everyone is active', { timeout: 20_000 }, async ({ clients, poll, isActive }) => {
            await poll(() => clients.every(isActive), { timeout: 10_000 })
        })

        test(
            'everyone has all the epochs',
            { timeout: 20_000 },
            async ({ clients, poll, hasEpochs }) => {
                const desiredKeys = clients.map((_, i) => i)
                await poll(() => clients.every(hasEpochs(...desiredKeys)), { timeout: 10_000 })
            },
        )

        test(
            'everyone saw a message',
            { timeout: 20_000 },
            async ({ sendMessage, poll, clients, saw }) => {
                await sendMessage(alice, 'hello all')
                await poll(() => clients.every(saw('hello all')), { timeout: 10_000 })
            },
        )
    })

    describe('alice sends message then invites bob', () => {
        let bob: Client

        beforeEach<MlsFixture>(async ({ poll, sendMessage, isActive, streams }) => {
            const channelId = streams.lastOrThrow()
            await alice.setStreamEncryptionAlgorithm(channelId, MLS_ALGORITHM)
            await poll(() => isActive(alice))
            await sendMessage(alice, 'hello bob')
        }, 10_000)

        beforeEach<MlsFixture>(async ({ makeInitAndStartClient, joinStreams }) => {
            bob = await makeInitAndStartClient({ logId: 'bob' })
            await joinStreams(bob)
        }, 10_000)

        test('bob is active', { timeout: 40_000 }, async ({ poll, isActive }) => {
            await poll(() => isActive(bob), { timeout: 20_000 })
        })

        test('bob has all keys', { timeout: 40_000 }, async ({ poll, clients, hasEpochs }) => {
            const desiredEpochs = clients.map((_, i) => i)
            await poll(() => clients.every(hasEpochs(...desiredEpochs)), { timeout: 20_000 })
        })

        test('bob saw the message', { timeout: 40_000 }, async ({ poll, saw, clients }) => {
            await poll(() => clients.every(saw('hello bob')), { timeout: 20_000 })
        })
    })

    describe('alice invites 3', () => {
        const nicknames = ['bob', 'charlie', 'dave']

        beforeEach<MlsFixture>(async ({ makeInitAndStartClient, joinStreams }) => {
            const newcomers = await Promise.all(
                nicknames.map((n) => makeInitAndStartClient({ logId: n })),
            )
            await Promise.all(newcomers.map(joinStreams))
        }, 10_000)

        beforeEach<MlsFixture>(async ({ streams }) => {
            const channelId = streams.lastOrThrow()
            await alice.setStreamEncryptionAlgorithm(channelId, MLS_ALGORITHM)
        }, 10_000)

        test('everyone is active', { timeout: 60_000 }, async ({ clients, poll, isActive }) => {
            await poll(() => clients.every(isActive), { timeout: 30_000 })
        })

        test(
            'everyone has all the keys',
            { timeout: 60_000 },
            async ({ clients, poll, hasEpochs }) => {
                const desiredEpochs = clients.map((_, i) => i)
                await poll(() => clients.every(hasEpochs(...desiredEpochs)), { timeout: 30_000 })
            },
        )

        test(
            'everyone saw a message',
            { timeout: 60_000 },
            async ({ sendMessage, poll, clients, saw }) => {
                await sendMessage(alice, 'hello all')
                await poll(() => clients.every(saw('hello all')), { timeout: 30_000 })
            },
        )

        test(
            'everyone can send a message',
            { timeout: 60_000 },
            async ({ sendMessage, clients, poll, sawAll }) => {
                await Promise.all(
                    clients.flatMap((c, i) =>
                        Array.from({ length: 10 }, (_, j) => sendMessage(c, `${j} from ${i}`)),
                    ),
                )

                await poll(() => clients.every(sawAll), { timeout: 30_000 })
            },
        )
    })
})

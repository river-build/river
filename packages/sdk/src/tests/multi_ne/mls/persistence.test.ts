/**
 * @group main
 */

import { makeUniqueSpaceStreamId } from '../../testUtils'
import { elogger } from '@river-build/dlog'
import { makeUniqueChannelStreamId } from '../../../id'
import { Client } from '../../../client'
import { beforeEach, describe, expect } from 'vitest'
import { MLS_ALGORITHM } from '../../../mls'
import { MlsFixture, test } from './fixture'

const log = elogger('test:mls:channel')

beforeEach<MlsFixture>(({ logger }) => {
    logger.set(log)
})

describe('persistenceMlsTests', () => {
    let alice: Client

    beforeEach<MlsFixture>(
        async ({ makeInitAndStartClient, streams, poll, isActive, sendMessage }) => {
            alice = await makeInitAndStartClient({ logId: 'alice', deviceId: 'alice' })

            const spaceId = makeUniqueSpaceStreamId()
            await alice.createSpace(spaceId)
            await alice.waitForStream(spaceId)
            streams.add(spaceId)

            const channelId = makeUniqueChannelStreamId(spaceId)
            await alice.createChannel(spaceId, 'channel', 'topic', channelId)
            await alice.waitForStream(channelId)
            streams.add(channelId)

            await alice.setStreamEncryptionAlgorithm(channelId, MLS_ALGORITHM)

            await poll(() => isActive(alice), { timeout: 10_000 })
            await sendMessage(alice, 'hello bob')
            await alice.stop()
        },
        10_000,
    )

    test(
        'alice can come back online',
        { timeout: 30_000 },
        async ({ makeInitAndStartClient, poll, isActive, hasEpochs, sawAll }) => {
            const aliceIsBack = await makeInitAndStartClient({
                logId: 'alice2',
                context: alice.signerContext,
                deviceId: 'alice',
            })

            await poll(() => isActive(aliceIsBack), { timeout: 10_000 })
            await poll(() => hasEpochs(0)(aliceIsBack), { timeout: 10_000 })
            await poll(() => sawAll(aliceIsBack), { timeout: 10_000 })
        },
    )

    test(
        'bob can join but not see messages',
        { timeout: 20_000 },
        async ({ makeInitAndStartClient, joinStreams, poll, isActive, saw }) => {
            const bob = await makeInitAndStartClient({ logId: 'bob', deviceId: 'bob' })
            await joinStreams(bob)
            await poll(() => isActive(bob))
            await expect(poll(() => saw('hello bob')(bob), { timeout: 10_000 })).rejects.toThrow()
        },
    )

    test(
        'alice comes back online',
        { timeout: 30_000 },
        async ({ makeInitAndStartClient, joinStreams, poll, isActive, sawAll, hasEpochs }) => {
            const bob = await makeInitAndStartClient({ logId: 'bob', deviceId: 'bob' })
            await joinStreams(bob)
            await poll(() => isActive(bob))

            const aliceIsBack = await makeInitAndStartClient({
                logId: 'alice2',
                context: alice.signerContext,
                deviceId: 'alice',
            })

            await poll(() => isActive(aliceIsBack), { timeout: 10_000 })
            await poll(() => hasEpochs(0, 1)(aliceIsBack), { timeout: 10_000 })
            await poll(() => sawAll(aliceIsBack), { timeout: 10_000 })
        },
    )

    test(
        'alice comes back online and bob can see all the messages',
        { timeout: 30_000 },
        async ({ makeInitAndStartClient, joinStreams, poll, isActive, hasEpochs, sawAll }) => {
            const bobAndAliceIsBack = await Promise.all([
                makeInitAndStartClient({ logId: 'bob', deviceId: 'bob' }).then(async (bob) => {
                    await joinStreams(bob)
                    return bob
                }),
                makeInitAndStartClient({
                    logId: 'alice2',
                    context: alice.signerContext,
                    deviceId: 'alice',
                }),
            ])

            await poll(() => bobAndAliceIsBack.every(isActive), { timeout: 10_000 })
            await poll(() => bobAndAliceIsBack.every(hasEpochs(0, 1)), { timeout: 10_000 })
            await poll(() => bobAndAliceIsBack.every(sawAll), { timeout: 10_000 })
        },
    )

    test(
        'bob sends a message while alice is offline',
        { timeout: 30_000 },
        async ({
            makeInitAndStartClient,
            joinStreams,
            poll,
            isActive,
            sendMessage,
            hasEpochs,
            sawAll,
        }) => {
            const bob = await makeInitAndStartClient({
                logId: 'bob',
                deviceId: 'bob',
            })
            await joinStreams(bob)
            await poll(() => isActive(bob))
            await sendMessage(bob, 'hello bob')
            await bob.stop()

            const aliceIsBack = await makeInitAndStartClient({
                logId: 'alice2',
                context: alice.signerContext,
                deviceId: 'alice',
            })

            const activeUsers = [aliceIsBack]
            await poll(() => activeUsers.every(isActive), { timeout: 10_000 })
            await poll(() => activeUsers.every(hasEpochs(0, 1)), { timeout: 10_000 })
            await poll(() => activeUsers.every(sawAll), { timeout: 10_000 })
        },
    )
})

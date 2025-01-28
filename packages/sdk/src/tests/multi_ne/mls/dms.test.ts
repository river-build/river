/**
 * @group main
 */

import { Client } from '../../../client'
import { MLS_ALGORITHM } from '../../../mls'
import { elogger } from '@river-build/dlog'
import { MlsFixture, test } from './fixture'
import { expect, describe } from 'vitest'

const log = elogger('test:mls:dms')

describe('dmsMlsTests', () => {
    let alice!: Client
    let bob!: Client

    beforeEach<MlsFixture>(async ({ makeInitAndStartClient, currentStreamId }) => {
        alice = await makeInitAndStartClient('alice', log)
        bob = await makeInitAndStartClient('bob', log)
        const { streamId } = await alice.createDMChannel(bob.userId)
        currentStreamId.set(streamId)
        await expect(alice.waitForStream(streamId)).resolves.toBeDefined()
        await expect(bob.waitForStream(streamId)).resolves.toBeDefined()
    }, 10_000)

    beforeEach<MlsFixture>(async ({ currentStreamId }) => {
        await alice.setStreamEncryptionAlgorithm(currentStreamId.getOrThrow(), MLS_ALGORITHM)
    }, 5_000)

    test('clientCanCreateDM', async () => {
        expect(alice).toBeDefined()
        expect(bob).toBeDefined()
    })

    test('clientsBecomeActive', { timeout: 15_000 }, async ({ clients, poll, isActive }) => {
        await poll(() => clients.every(isActive), { timeout: 10_000 })
    })

    test(
        'clientsCanSendMessage',
        { timeout: 15_000 },
        async ({ clients, sendMessage, saw, poll }) => {
            await sendMessage(alice, 'hello bob')

            await poll(() => clients.every(saw('hello bob')), {
                timeout: 15_000,
            })
        },
    )

    test(
        'clientsCanSendMutlipleMessages',
        { timeout: 10_000 },
        async ({ clients, sendMessage, sawAll, poll }) => {
            await Promise.all([
                ...clients.flatMap((c: Client, i) =>
                    Array.from({ length: 10 }, (_, j) =>
                        sendMessage(c, `message ${j} from client ${i}`),
                    ),
                ),
                poll(() => clients.every(sawAll), { timeout: 10_000 }),
            ])
        },
    )

    test('clientsAgreeOnEpochSecrets', async ({ clients, poll, epochSecrets, hasEpochs }) => {
        const desiredEpochs = clients.map((_, i) => i)
        await poll(() => clients.every(hasEpochs(...desiredEpochs)), { timeout: 10_000 })

        expect(epochSecrets(bob)).toStrictEqual(epochSecrets(alice))
    })
})

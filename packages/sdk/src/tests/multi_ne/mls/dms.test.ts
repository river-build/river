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
    let streamId!: string

    beforeEach<MlsFixture>(async ({ makeInitAndStartClient, currentStreamId }) => {
        alice = await makeInitAndStartClient('alice', log)
        bob = await makeInitAndStartClient('bob', log)
        const { streamId: dmStreamId } = await alice.createDMChannel(bob.userId)
        streamId = dmStreamId
        currentStreamId.set(streamId)
        await expect(alice.waitForStream(streamId)).resolves.toBeDefined()
        await expect(bob.waitForStream(streamId)).resolves.toBeDefined()
    }, 10_000)

    beforeEach(async () => {
        await alice.setStreamEncryptionAlgorithm(streamId, MLS_ALGORITHM)
    }, 5_000)

    test('clientCanCreateDM', async () => {
        expect(alice).toBeDefined()
        expect(bob).toBeDefined()
        expect(streamId).toBeDefined()
    })
    const clientStatus = (client: Client) =>
        client.mlsExtensions?.agent?.streams.get(streamId)?.localView?.status

    test('clientsBecomeActive', { timeout: 5_000 }, async ({ clients }) => {
        await Promise.all([
            ...clients.map((c) =>
                expect.poll(() => clientStatus(c), { timeout: 10_000 }).toBe('active'),
            ),
        ])
    })

    test('clientsCanSendMessage', { timeout: 15_000 }, async ({ sendMessage, saw, poll }) => {
        await sendMessage(alice, 'hello bob')

        await poll(() => saw(bob, 'hello bob'), {
            timeout: 15_000,
        })
    })

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

    test('clientsAgreeOnEpochSecrets', async ({ clients, epochs, poll, epochSecrets }) => {
        const desiredEpochs = clients.map((_, i) => BigInt(i))
        await poll(
            () =>
                clients.every((c) => {
                    expect(epochs(c)).toStrictEqual(desiredEpochs)
                    return true
                }),
            { timeout: 10_000 },
        )

        expect(epochSecrets(bob)).toStrictEqual(epochSecrets(alice))
    })
})

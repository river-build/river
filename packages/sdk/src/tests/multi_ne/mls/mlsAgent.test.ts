/**
 * @group main
 */

import { makeTestClient } from '../../testUtils'
import { Client } from '../../../client'
import { dlog } from '@river-build/dlog'
import { beforeEach, describe, expect } from 'vitest'


type TestClient = {
    nickname: string
    client: Client
}

const log = dlog('test:mls:agent')

describe('MlsAgentTests', () => {
    const clients: TestClient[] = []
    let alice: TestClient
    let bob: TestClient
    let charlie: TestClient

    const makeInitAndStartClient = async (nickname: string): Promise<TestClient> => {
        const client = await makeTestClient({
            mlsOpts: {
                log: log.extend(nickname),
                mlsAlwaysEnabled: true,
            },
        })
        await client.initializeUser()
        client.startSync()
        clients.push({ nickname, client })

        return {
            nickname,
            client,
        }
    }

    let streamId: string

    beforeEach(async () => {
        alice = await makeInitAndStartClient('alice')
        bob = await makeInitAndStartClient('bob')
        charlie = await makeInitAndStartClient('charlie')

        const { streamId: gdmStreamId } = await alice.client.createGDMChannel([
            bob.client.userId,
            charlie.client.userId,
        ])

        await Promise.all(clients.map((client) => client.client.waitForStream(gdmStreamId)))
        streamId = gdmStreamId
    })

    afterEach(async () => {
        for (const client of clients) {
            await client.client.stop()
        }
        clients.length = 0
    })

    describe('enableAndParticipate', () => {
        test('alice can participate', async () => {
            // manually seed the viewAdapter
            await expect
                .poll(
                    () =>
                        alice.client.mlsExtensions?.agent?.streams.get(streamId)?.localView?.status,
                    {
                        timeout: 10_000,
                    },
                )
                .toBe('active')
        })

        //
        // test('alice generates new epoch secret after bob participates', async () => {
        //     alice.agent.enableStream(streamId)
        //     await expect.poll(() => howManyActive(), { timeout: 10_000 }).toBe(1)
        //     bob.agent.enableStream(streamId)
        //     await expect
        //         .poll(() => howManyOpenKeys(alice), {
        //             timeout: 10_000,
        //         })
        //         .toBe(2)
        // })
        //
        // test('eventually all clients will be able to join the group', async () => {
        //     clients.forEach((client) => client.agent.enableStream(streamId))
        //
        //     await expect.poll(() => howManyActive(), { timeout: 10_000 }).toBe(3)
        // })
    })

    describe('announceEpochSecrets', () => {
        // test('alice announces her keys after bob participates', async () => {
        //     alice.agent.enableStream(streamId)
        //     await expect.poll(() => howManyActive(), { timeout: 10_000 }).toBe(1)
        //     bob.agent.enableStream(streamId)
        //     await expect
        //         .poll(() => howManySealedKeys(bob), {
        //             timeout: 10_000,
        //         })
        //         .toBe(1)
        // })
        //
        // test('bob opens keys that alice announced', async () => {
        //     alice.agent.enableStream(streamId)
        //     await expect.poll(() => howManyActive(), { timeout: 10_000 }).toBe(1)
        //     bob.agent.enableStream(streamId)
        //     await expect
        //         .poll(() => howManyOpenKeys(bob), {
        //             timeout: 10_000,
        //         })
        //         .toBe(2)
        // })
        //
        // test('eventually all clients will get all the keys', async () => {
        //     clients.forEach((client) => client.agent.enableStream(streamId))
        //
        //     await Promise.all([
        //         ...clients.map((c) =>
        //             expect.poll(() => howManyOpenKeys(c), { timeout: 10_000 }).toBe(clients.length),
        //         ),
        //         ...clients.map((c) =>
        //             expect
        //                 .poll(() => howManySealedKeys(c), { timeout: 10_000 })
        //                 .toBe(clients.length - 1),
        //         ),
        //     ])
        // })
    })
})

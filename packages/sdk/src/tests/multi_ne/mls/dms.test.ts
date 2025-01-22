/**
 * @group main
 */

import { Client } from '../../../client'
import { makeTestClient } from '../../testUtils'
import { MLS_ALGORITHM } from '../../../mls'
import { checkTimelineContainsAll } from './utils'
// import { MLS_ALGORITHM } from '../../../mls'
// import { checkTimelineContainsAll } from './utils'

const clients: Client[] = []

beforeEach(async () => {})

afterEach(async () => {
    for (const client of clients) {
        await client.stop()
    }
    // empty clients
    clients.length = 0
})

async function makeInitAndStartClient(nickname?: string) {
    const client = await makeTestClient({ nickname })
    await client.initializeUser()
    client.startSync()
    clients.push(client)
    return client
}

describe('dmsMlsTests', () => {
    let aliceClient!: Client
    let bobClient!: Client
    let streamId!: string

    async function setupMlsDM() {
        const aliceClient = await makeInitAndStartClient('alice')
        const bobClient = await makeInitAndStartClient('bob')
        const { streamId } = await aliceClient.createDMChannel(bobClient.userId)
        await expect(aliceClient.waitForStream(streamId)).resolves.toBeDefined()
        await expect(bobClient.waitForStream(streamId)).resolves.toBeDefined()

        return { aliceClient, bobClient, streamId }
    }

    beforeEach(async () => {
        const initialValues = await setupMlsDM()
        aliceClient = initialValues.aliceClient
        bobClient = initialValues.bobClient
        streamId = initialValues.streamId
    }, 10_000)

    it('clientCanCreateDM', async () => {
        expect(aliceClient).toBeDefined()
        expect(bobClient).toBeDefined()
        expect(streamId).toBeDefined()
    })

    it('clientsCanEnableMls', { timeout: 10_000 }, async () => {
        await aliceClient.setStreamEncryptionAlgorithm(streamId, MLS_ALGORITHM)

        await expect
            .poll(
                () => aliceClient.mlsExtensions?.agent?.streams.get(streamId)?.localView?.status,
                { timeout: 10_000 },
            )
            .toBe('active')

        await expect
            .poll(() => bobClient.mlsExtensions?.agent?.streams.get(streamId)?.localView?.status, {
                timeout: 10_000,
            })
            .toBe('active')

        await aliceClient.sendMessage(streamId, 'hello bob')

        await expect
            .poll(
                () =>
                    checkTimelineContainsAll(
                        ['hello bob'],
                        bobClient.streams.get(streamId)!.view.timeline,
                    ),
                { timeout: 10_000 },
            )
            .toBe(true)
    })
})

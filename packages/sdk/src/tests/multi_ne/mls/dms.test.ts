/**
 * @group main
 */

import { Client } from '../../../client'
import { getChannelMessagePayload, makeTestClient } from '../../testUtils'
import { MLS_ALGORITHM } from '../../../mls'
import { StreamTimelineEvent } from '../../../types'

const clients: Client[] = []

beforeEach(async () => {})

afterEach(async () => {
    for (const client of clients) {
        await client.stop()
    }
    // empty clients
    clients.length = 0
})

async function makeInitAndStartClient(_nickname?: string) {
    const client = await makeTestClient()
    // if (nickname) {
    //     client.nickname = nickname
    // }
    await client.initializeUser()
    client.startSync()
    clients.push(client)
    return client
}

describe.skip('dmsMlsTests', () => {
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

    it('clientsCanEnableMls', async () => {
        let aliceEnabledMls = false
        let bobEnabledMls = false

        aliceClient.once('streamEncryptionAlgorithmUpdated', (updatedStreamId, value) => {
            expect(updatedStreamId).toBe(streamId)
            expect(value).toBe(MLS_ALGORITHM)
            aliceEnabledMls = true
        })

        bobClient.once('streamEncryptionAlgorithmUpdated', (updatedStreamId, value) => {
            expect(updatedStreamId).toBe(streamId)
            expect(value).toBe(MLS_ALGORITHM)
            bobEnabledMls = true
        })

        await aliceClient.setStreamEncryptionAlgorithm(streamId, MLS_ALGORITHM)

        // Wait for both of them to enable MLS
        await expect
            .poll(() => aliceEnabledMls && bobEnabledMls, {
                timeout: 5_000,
            })
            .toBe(true)

        await aliceClient.sendMessage(streamId, 'hello bob')

        await expect
            .poll(
                () =>
                    checkTimelineContainsAll(
                        ['hello bob'],
                        bobClient.streams.get(streamId)!.view.timeline,
                    ),
                { timeout: 5_000 },
            )
            .toBe(true)
    }, 10_000)
})

function getPayloadRemoteEvent(event: StreamTimelineEvent): string | undefined {
    if (event.decryptedContent?.kind === 'channelMessage') {
        return getChannelMessagePayload(event.decryptedContent.content)
    }
    return undefined
}

function getPayloadLocalEvent(event: StreamTimelineEvent): string | undefined {
    if (event.localEvent?.channelMessage) {
        return getChannelMessagePayload(event.localEvent.channelMessage)
    }
    return undefined
}

function getPayload(event: StreamTimelineEvent): string | undefined {
    const payload = getPayloadRemoteEvent(event)
    if (payload) {
        return payload
    }
    return getPayloadLocalEvent(event)
}

function checkTimelineContainsAll(messages: string[], timeline: StreamTimelineEvent[]): boolean {
    const checks = new Set(messages)
    for (const event of timeline) {
        const payload = getPayload(event)
        if (payload) {
            checks.delete(payload)
        }
    }
    return checks.size === 0
}

/**
 * @group main
 */

import { check } from '@river-build/dlog'
import { Client } from './client'
import {
    createEventDecryptedPromise,
    getChannelMessagePayload,
    makeTestClient,
    waitFor,
    waitForSyncStreams,
} from './util.test'
import {
    ExternalClient,
    ExternalGroup,
    Group,
    Client as MlsClient,
    MlsMessage,
} from '@river-build/mls-rs-wasm'
import { StreamTimelineEvent } from './types'

const utf8Encoder = new TextEncoder()
const utf8Decoder = new TextDecoder()

describe('dmsMlsTests', () => {
    let clients: Client[] = []
    const makeInitAndStartClient = async () => {
        const client = await makeTestClient()
        await client.initializeUser()
        client.startSync()
        clients.push(client)
        return client
    }

    beforeEach(async () => {})

    afterEach(async () => {
        for (const client of clients) {
            await client.stop()
        }
        clients = []
    })

    test('clientCanSendMlsPayloadInDM', async () => {
        const alicesClient = await makeInitAndStartClient()
        const bobsClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        await expect(bobsClient.waitForStream(streamId)).toResolve()
        await expect(alicesClient.waitForStream(streamId)).toResolve()

        // alice's message will:
        // - trigger a group initialization by alice
        // - trigger Bob's client to join the group using an external join
        // by design, bob can _never_ read alice's message until we have external keys in place
        await expect(
            alicesClient.sendMessage(streamId, 'hello bob', [], [], { useMls: true }),
        ).toResolve()

        await waitFor(() => {
            const bobStream = bobsClient.streams.get(streamId)
            check(bobStream?._view.membershipContent.mls.latestGroupInfo !== undefined)
        })

        await expect(
            bobsClient.sendMessage(streamId, 'hello alice', [], [], { useMls: true }),
        ).toResolve()

        await waitFor(() => {
            const aliceStream = alicesClient.streams.get(streamId)!
            check(checkTimeline(['hello alice', 'hello bob'], aliceStream.view.timeline))

            const bobStream = bobsClient.streams.get(streamId)!
            check(checkTimeline(['hello alice', 'hello bob'], bobStream.view.timeline))
        })

        const messages = Array.from(Array(20).keys()).map((key) => {
            return `Message ${key}`
        })

        for (const message of messages) {
            await expect(
                bobsClient.sendMessage(streamId, message, [], [], { useMls: true }),
            ).toResolve()
        }

        await waitFor(() => {
            const aliceStream = alicesClient.streams.get(streamId)!
            check(checkTimeline(messages, aliceStream.view.timeline))

            const bobStream = bobsClient.streams.get(streamId)!
            check(checkTimeline(messages, bobStream.view.timeline))
        })
    })
})

function checkTimeline(messages: string[], timeline: StreamTimelineEvent[]): boolean {
    const checks = new Set(messages)
    for (const event of timeline) {
        // remote
        {
            const content = event.decryptedContent
            if (content?.kind !== 'channelMessage') {
                continue
            }
            const payload = getChannelMessagePayload(content.content)
            if (payload) {
                checks.delete(payload)
            }
        }
        // local
        {
            const content = event.localEvent?.channelMessage
            const payload = getChannelMessagePayload(content)
            if (payload) {
                checks.delete(payload)
            }
        }
    }
    return checks.size === 0
}

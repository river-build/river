/**
 * @group main
 */

import { check } from '@river-build/dlog'
import { Client } from './client'
import {
    getChannelMessagePayload,
    makeTestClient,
    makeUniqueSpaceStreamId,
    waitFor,
} from './util.test'

import { StreamTimelineEvent } from './types'
import { makeUniqueChannelStreamId } from './id'

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

        // Not sure both are active
        await waitFor(() => {
            const aliceEpoch = alicesClient.mlsCrypto!.epochFor(streamId)
            const bobEpoch = bobsClient.mlsCrypto!.epochFor(streamId)
            check(aliceEpoch === bobEpoch)
            check(aliceEpoch === BigInt(1))
        })

        await waitFor(() => {
            const aliceStream = alicesClient.streams.get(streamId)!
            check(checkTimelineContainsAll(['hello alice', 'hello bob'], aliceStream.view.timeline))

            const bobStream = bobsClient.streams.get(streamId)!
            check(checkTimelineContainsAll(['hello alice', 'hello bob'], bobStream.view.timeline))
        })

        const messages = Array.from(Array(10).keys()).map((key) => {
            return `Message ${key}`
        })

        for (const message of messages) {
            await expect(
                bobsClient.sendMessage(streamId, message, [], [], { useMls: true }),
            ).toResolve()
        }

        await waitFor(() => {
            const aliceStream = alicesClient.streams.get(streamId)!
            check(checkTimelineContainsAll(messages, aliceStream.view.timeline))

            const bobStream = bobsClient.streams.get(streamId)!
            check(checkTimelineContainsAll(messages, bobStream.view.timeline))
        })
    })

    test('moreClientsCanJoin', async () => {
        const alicesClient = await makeInitAndStartClient()
        const bobsClient = await makeInitAndStartClient()
        const charliesClient = await makeInitAndStartClient()

        const { streamId } = await bobsClient.createGDMChannel([
            alicesClient.userId,
            charliesClient.userId,
        ])
        await expect(bobsClient.waitForStream(streamId)).toResolve()
        await expect(alicesClient.waitForStream(streamId)).toResolve()
        await expect(charliesClient.waitForStream(streamId)).toResolve()
        // alice's message will:
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
            check(checkTimelineContainsAll(['hello alice', 'hello bob'], aliceStream.view.timeline))

            const bobStream = bobsClient.streams.get(streamId)!
            check(checkTimelineContainsAll(['hello alice', 'hello bob'], bobStream.view.timeline))
        })

        const addedClients: Client[] = []

        // add 3 more users
        for (let i = 0; i < 2; i++) {
            const client = await makeInitAndStartClient()
            await expect(bobsClient.joinUser(streamId, client.userId)).toResolve()
            addedClients.push(client)
        }

        for (const client of addedClients) {
            await expect(client.waitForStream(streamId)).toResolve()
        }

        await waitFor(() => {
            for (const client of clients) {
                const stream = client.streams.get(streamId)!
                check(checkTimelineContainsAll(['hello alice', 'hello bob'], stream.view.timeline))
            }
        })
    })

    test('manyClientsInChannel', async () => {
        const spaceId = makeUniqueSpaceStreamId()
        const bobsClient = await makeInitAndStartClient()
        await expect(bobsClient.createSpace(spaceId)).toResolve()

        const channelId = makeUniqueChannelStreamId(spaceId)
        await expect(bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId)).toResolve()

        await Promise.all(
            Array.from(Array(12).keys()).map(async (n) => {
                console.log(`JOINING CLIENT ${n}`)
                const client = await makeInitAndStartClient()
                await expect(client.joinStream(channelId)).toResolve()
                await expect(client.waitForStream(channelId)).toResolve()
            }),
        )

        await expect(
            bobsClient.sendMessage(channelId, 'hello everyone', [], [], { useMls: true }),
        ).toResolve()

        const messages: string[] = []
        for (const [idx, client] of clients.entries()) {
            const msg = `hello ${idx}`
            await expect(client.sendMessage(channelId, msg, [], [], { useMls: true })).toResolve()
            messages.push(msg)
        }

        await expect(
            await waitFor(
                () => {
                    for (const client of clients) {
                        const stream = client.streams.get(channelId)!
                        check(
                            checkTimelineContainsAll(
                                ['hello everyone'].concat(messages),
                                stream.view.timeline,
                            ),
                        )
                    }
                },
                { timeoutMS: 10000 },
            ),
        ).toResolve()

        await expect(
            await waitFor(() => {
                for (const client of clients) {
                    check(client.mlsCrypto!.hasGroup(channelId))
                    check(client.mlsCrypto!.epochFor(channelId) === BigInt(clients.length - 1))
                }
            }),
        ).toResolve()
    })
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

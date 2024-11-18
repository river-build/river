/**
 * @group main
 */

import { check, dlog } from '@river-build/dlog'
import { Client } from './client'
import {
    getChannelMessagePayload,
    makeTestClient,
    makeUniqueSpaceStreamId,
    waitFor,
} from './util.test'

import { StreamTimelineEvent } from './types'
import { makeUniqueChannelStreamId } from './id'

const log = dlog('test:mls')

describe('dmsMlsTests', () => {
    let clients: Client[] = []
    const makeInitAndStartClient = async (nickname?: string) => {
        const client = await makeTestClient()
        await goBackToEventLoop()
        if (nickname) {
            client.nickname = nickname
        }
        await client.initializeUser()
        await goBackToEventLoop()
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
        const alicesClient = await makeInitAndStartClient('alice')
        const bobsClient = await makeInitAndStartClient('bob')
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        await expect(bobsClient.waitForStream(streamId)).toResolve()
        await expect(alicesClient.waitForStream(streamId)).toResolve()

        await expect(
            alicesClient.sendMessage(streamId, 'hello bob', [], [], { useMls: true }),
        ).toResolve()

        await waitFor(
            () => {
                const bobStream = bobsClient.streams.get(streamId)
                check(bobStream?._view.membershipContent.mls.latestGroupInfo !== undefined)
            },
            { timeoutMS: 1000 },
        )

        await expect(
            bobsClient.sendMessage(streamId, 'hello alice', [], [], { useMls: true }),
        ).toResolve()

        // Not sure both are active
        await waitFor(
            () => {
                const aliceEpoch = alicesClient.mlsCrypto!.epochFor(streamId)
                const bobEpoch = bobsClient.mlsCrypto!.epochFor(streamId)
                check(aliceEpoch === bobEpoch)
                check(aliceEpoch === BigInt(1))
            },
            { timeoutMS: 1000 },
        )

        await waitFor(
            () => {
                const aliceStream = alicesClient.streams.get(streamId)!
                check(
                    checkTimelineContainsAll(
                        ['hello alice', 'hello bob'],
                        aliceStream.view.timeline,
                    ),
                )

                const bobStream = bobsClient.streams.get(streamId)!
                check(
                    checkTimelineContainsAll(['hello alice', 'hello bob'], bobStream.view.timeline),
                )
            },
            { timeoutMS: 1000 },
        )

        const messages = Array.from(Array(10).keys()).map((key) => {
            return `Message ${key}`
        })

        for (const message of messages) {
            await expect(
                bobsClient.sendMessage(streamId, message, [], [], { useMls: true }),
            ).toResolve()
        }

        await waitFor(
            () => {
                const aliceStream = alicesClient.streams.get(streamId)!
                check(checkTimelineContainsAll(messages, aliceStream.view.timeline))

                const bobStream = bobsClient.streams.get(streamId)!
                check(checkTimelineContainsAll(messages, bobStream.view.timeline))
            },
            { timeoutMS: 1000 },
        )
    })

    test('threeClientsCanJoin', async () => {
        const aliceClient = await makeInitAndStartClient('alice')
        const bobClient = await makeInitAndStartClient('bob')
        const charlieClient = await makeInitAndStartClient('charlie')

        const { streamId } = await aliceClient.createGDMChannel([
            bobClient.userId,
            charlieClient.userId,
        ])
        await expect(aliceClient.waitForStream(streamId)).toResolve()
        await expect(bobClient.waitForStream(streamId)).toResolve()
        await expect(charlieClient.waitForStream(streamId)).toResolve()

        await expect(
            aliceClient.sendMessage(streamId, 'hello all', [], [], { useMls: true }),
        ).toResolve()

        await waitFor(
            () => {
                const aliceStream = aliceClient.streams.get(streamId)!
                check(checkTimelineContainsAll(['hello all'], aliceStream.view.timeline))
            },
            { timeoutMS: 1000 },
        )

        await waitFor(
            () => {
                const bobStream = bobClient.streams.get(streamId)!
                check(checkTimelineContainsAll(['hello all'], bobStream.view.timeline))
            },
            { timeoutMS: 1000 },
        )

        await waitFor(
            () => {
                const charlieStream = charlieClient.streams.get(streamId)!
                check(checkTimelineContainsAll(['hello all'], charlieStream.view.timeline))
            },
            { timeoutMS: 1000 },
        )
    })

    test('moreClientsCanJoin', async () => {
        const alicesClient = await makeInitAndStartClient('alice')
        const bobsClient = await makeInitAndStartClient('bob')
        const charliesClient = await makeInitAndStartClient('charlie')

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

        await waitFor(() => {
            const aliceStream = alicesClient.streams.get(streamId)!
            const bobStream = bobsClient.streams.get(streamId)!
            const charlieStream = charliesClient.streams.get(streamId)!
            check(checkTimelineContainsAll(['hello bob'], aliceStream.view.timeline))
            check(checkTimelineContainsAll(['hello bob'], bobStream.view.timeline))
            check(checkTimelineContainsAll(['hello bob'], charlieStream.view.timeline))
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
            const client = await makeInitAndStartClient(`client-${i}`)
            await expect(bobsClient.joinUser(streamId, client.userId)).toResolve()
            addedClients.push(client)
        }

        for (const client of addedClients) {
            await expect(client.waitForStream(streamId)).toResolve()
        }

        await waitFor(
            () => {
                for (const client of clients) {
                    const stream = client.streams.get(streamId)!
                    check(
                        checkTimelineContainsAll(
                            ['hello alice', 'hello bob'],
                            stream.view.timeline,
                        ),
                    )
                }
            },
            { timeoutMS: 5000 },
        )
    })

    test('manyClientsInChannel', async () => {
        const spaceId = makeUniqueSpaceStreamId()
        const bobsClient = await makeInitAndStartClient('bob')
        await expect(bobsClient.createSpace(spaceId)).toResolve()

        const channelId = makeUniqueChannelStreamId(spaceId)
        await expect(bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId)).toResolve()

        await Promise.all(
            Array.from(Array(12).keys()).map(async (n) => {
                log(`JOINING client-${n}`)
                const client = await makeInitAndStartClient(`client-${n}`)
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
            waitFor(
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

    test('manyClientsInChannelInterleaving', async () => {
        const spaceId = makeUniqueSpaceStreamId()
        const bobsClient = await makeInitAndStartClient('bob')
        await expect(bobsClient.createSpace(spaceId)).toResolve()
        const channelId = makeUniqueChannelStreamId(spaceId)
        await expect(bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId)).toResolve()

        const messagesInFlight: Promise<any>[] = []
        const messages: string[] = []

        const send = (client: Client, msg: string) => {
            messages.push(msg)
            messagesInFlight.push(client.sendMessage(channelId, msg, [], [], { useMls: true }))
        }

        send(bobsClient, 'hello everyone')

        const NUM_CLIENTS = 4
        const NUM_MESSAGES = 5

        await Promise.all(
            Array.from(Array(NUM_CLIENTS).keys()).map(async (n: number) => {
                log(`INIT client-${n}`)
                const client = await makeInitAndStartClient(`client-${n}`)
                await expect(client.joinStream(channelId)).toResolve()
                send(client, `hello from ${n}`)
                for (let m = 0; m < NUM_MESSAGES; m++) {
                    send(client, `message ${m} from ${n}`)
                }
            }),
        )

        await expect(Promise.all(messagesInFlight)).toResolve()
        await waitFor(
            () => {
                for (const client of clients) {
                    const stream = client.streams.get(channelId)!
                    check(checkTimelineContainsAll(messages, stream.view.timeline))
                }
            },
            { timeoutMS: 10000 },
        )
    })
})

const goBackToEventLoop = () => new Promise((resolve) => setTimeout(resolve, 0))

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

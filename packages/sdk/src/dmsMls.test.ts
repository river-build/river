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
            { timeoutMS: 3_000 },
        )

        await expect(
            bobsClient.sendMessage(streamId, 'hello alice', [], [], { useMls: true }),
        ).toResolve()

        // Not sure both are active
        await waitFor(
            async () => {
                const aliceEpoch = await alicesClient.mlsCrypto!.epochFor(streamId)
                const bobEpoch = await bobsClient.mlsCrypto!.epochFor(streamId)
                check(aliceEpoch === bobEpoch)
                check(aliceEpoch === BigInt(1))
            },
            { timeoutMS: 3_000 },
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
            { timeoutMS: 3_000 },
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
            { timeoutMS: 3_000 },
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
            { timeoutMS: 10_000 },
        )

        await waitFor(
            () => {
                const bobStream = bobClient.streams.get(streamId)!
                check(checkTimelineContainsAll(['hello all'], bobStream.view.timeline))
            },
            { timeoutMS: 10_000 },
        )

        await waitFor(
            () => {
                const charlieStream = charlieClient.streams.get(streamId)!
                check(checkTimelineContainsAll(['hello all'], charlieStream.view.timeline))
            },
            { timeoutMS: 10_000 },
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
            { timeoutMS: 20_000 },
        )
    })

    test.skip('manyClientsInChannel', async () => {
        const spaceId = makeUniqueSpaceStreamId()
        const bobsClient = await makeInitAndStartClient('bob')
        await expect(bobsClient.createSpace(spaceId)).toResolve()

        const channelId = makeUniqueChannelStreamId(spaceId)
        await expect(bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId)).toResolve()

        await Promise.all(
            Array.from(Array(12).keys()).map(async (n) => {
                log(`JOINING client-${n}`)
                const client = await makeInitAndStartClient(`client-${n}`)
                if (client.mlsCrypto) {
                    client.mlsCrypto.awaitTimeoutMS = 30_000
                }
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
            await waitFor(async () => {
                for (const client of clients) {
                    check(await client.mlsCrypto!.hasGroup(channelId))
                    check(
                        (await client.mlsCrypto!.epochFor(channelId)) ===
                            BigInt(clients.length - 1),
                    )
                }
            }),
        ).toResolve()
    })

    // Parameters for the test
    // Timeout for a client to join an MLS group
    const AWAIT_GROUP_TIMEOUT_MS = 120_000
    // Timeout for all clients to finish syncing
    const ALL_CLIENTS_SYNC_TIMEOUT_MS = 120_000
    // Timeout for the whole test
    const WHOLE_TEST_TIMEOUT_MS = 120_000

    // Number of clients to be created
    const NUM_CLIENTS = 24
    // Number of messages to be exchanged
    const NUM_MESSAGES = 1

    test.only(
        'manyClientsInChannelInterleaving',
        async () => {
            const spaceId = makeUniqueSpaceStreamId()
            const bobsClient = await makeInitAndStartClient('bob')
            await expect(bobsClient.createSpace(spaceId)).toResolve()
            const channelId = makeUniqueChannelStreamId(spaceId)
            await expect(
                bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId),
            ).toResolve()

            const messagesInFlight: Promise<any>[] = []
            const messages: string[] = []

            const send = (client: Client, msg: string) => {
                messages.push(msg)
                messagesInFlight.push(client.sendMessage(channelId, msg, [], [], { useMls: true }))
            }

            send(bobsClient, 'hello everyone')

            // TODO: Creating clients while others are sending messages seems to break the node
            const extraClients = await Promise.all(
                Array.from(Array(NUM_CLIENTS).keys()).map(async (n: number) => {
                    log(`INIT client-${n}`)
                    const client = await makeInitAndStartClient(`client-${n}`)
                    if (client.mlsCrypto) {
                        client.mlsCrypto.awaitTimeoutMS = AWAIT_GROUP_TIMEOUT_MS
                    }
                    return client
                }),
            )

            await Promise.all(
                extraClients.map(async (client: Client, n: number) => {
                    log(`JOIN client-${n}`)
                    await expect(client.joinStream(channelId)).toResolve()
                    if (NUM_MESSAGES > 0) {
                        send(client, `hello from ${n}`)
                    }
                    for (let m = 1; m < NUM_MESSAGES; m++) {
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
                { timeoutMS: ALL_CLIENTS_SYNC_TIMEOUT_MS },
            )
        },
        WHOLE_TEST_TIMEOUT_MS,
    )
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

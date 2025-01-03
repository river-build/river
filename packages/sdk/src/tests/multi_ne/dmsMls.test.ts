/**
 * @group main
 */

import { check, dlog } from '@river-build/dlog'
import { Client } from '../../client'
import {
    getChannelMessagePayload,
    makeTestClient,
    makeUniqueSpaceStreamId,
    waitFor,
} from '../testUtils'

import { StreamTimelineEvent } from '../../types'
import { makeUniqueChannelStreamId } from '../../id'
import { expect } from 'vitest'

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

    const setupMlsDM = async () => {
        const aliceClient = await makeInitAndStartClient('alice')
        const bobClient = await makeInitAndStartClient('bob')
        const { streamId } = await aliceClient.createDMChannel(bobClient.userId)
        await expect(aliceClient.waitForStream(streamId)).resolves.toBeDefined()
        await expect(bobClient.waitForStream(streamId)).resolves.toBeDefined()

        return { aliceClient, bobClient, streamId }
    }

    it('clientCanCreateDM', async () => {
        const { aliceClient, bobClient, streamId } = await setupMlsDM()

        expect(aliceClient).toBeDefined()
        expect(bobClient).toBeDefined()
        expect(streamId).toBeDefined()
    })

    it('clientCanCreateDMAndObserveMls', async () => {
        const { aliceClient, bobClient, streamId } = await setupMlsDM()

        await expect(
            aliceClient.sendMessage(streamId, 'hello bob', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        // Alice and Bob can observe MLS being initialised for the group
        await expect
            .poll(
                async () => {
                    const aliceStream = aliceClient.streams.get(streamId)
                    const bobStream = bobClient.streams.get(streamId)
                    const aliceObservesMls =
                        aliceStream?._view.membershipContent.mls.latestGroupInfo !== undefined
                    const bobObservesMls =
                        bobStream?._view.membershipContent.mls.latestGroupInfo !== undefined
                    return aliceObservesMls && bobObservesMls
                },
                { timeout: 10_000 },
            )
            .toBeTruthy()
    })

    it('clientCanSendOneMlsMessageInDM', async () => {
        const { aliceClient, bobClient, streamId } = await setupMlsDM()

        const result = await aliceClient.sendMessage(streamId, 'hello bob', [], [], {
            useMls: true,
        })

        expect(result).toBeDefined()

        // Check if Alice has the message
        await expect
            .poll(async () =>
                checkTimelineContainsAll(
                    ['hello bob'],
                    aliceClient.streams.get(streamId)!.view.timeline,
                ),
            )
            .toBeTruthy()

        // Check if Bob has the message
        await expect
            .poll(
                async () =>
                    checkTimelineContainsAll(
                        ['hello bob'],
                        bobClient.streams.get(streamId)!.view.timeline,
                    ),
                { timeout: 5_000 },
            )
            .toBeTruthy()
    })

    it('clientsCanObserveLatestGroupInfoInDM', async () => {
        const { aliceClient, bobClient, streamId } = await setupMlsDM()

        // Alice sends MLS message to bootstrap the protocol
        await expect(
            aliceClient.sendMessage(streamId, 'hello bob', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        // Alice can observe latestGroupInfo
        await expect
            .poll(
                () =>
                    aliceClient.streams.get(streamId)?._view.membershipContent.mls.latestGroupInfo,
                { timeout: 10_000 },
            )
            .toBeDefined()

        // Bob can observe latestGroupInfo
        await expect
            .poll(
                () => bobClient.streams.get(streamId)?._view.membershipContent.mls.latestGroupInfo,
                { timeout: 10_000 },
            )
            .toBeDefined()
    })

    it('bothClientsCanSendOneMlsMessageInDM', async () => {
        const { aliceClient, bobClient, streamId } = await setupMlsDM()

        // Alice can send message
        await expect(
            aliceClient.sendMessage(streamId, 'hello bob', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        await expect(
            bobClient.sendMessage(streamId, 'hello alice', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        // Check Alice can see both messages
        await expect
            .poll(
                () =>
                    checkTimelineContainsAll(
                        ['hello alice', 'hello bob'],
                        aliceClient.streams.get(streamId)!.view.timeline,
                    ),
                { timeout: 10_000 },
            )
            .toBeTruthy()

        // Check Bob can see both messages
        await expect
            .poll(
                () =>
                    checkTimelineContainsAll(
                        ['hello alice', 'hello bob'],
                        bobClient.streams.get(streamId)!.view.timeline,
                    ),
                { timeout: 10_000 },
            )
            .toBeTruthy()
    })

    it('clientsAgreeOnEpochInDM', async () => {
        const { aliceClient, bobClient, streamId } = await setupMlsDM()

        // Alice sends message to ensure MLS starts
        await expect(
            aliceClient.sendMessage(streamId, 'hello bob', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        // Ensure Both Alice and Bob agree on an epoch
        await expect.poll(async () => aliceClient.mlsQueue?.mlsCrypto.epochFor(streamId)).toBe(1n)
        await expect.poll(async () => bobClient.mlsQueue?.mlsCrypto.epochFor(streamId)).toBe(1n)
    })

    it(
        'clientCanSendManyMlsPayloadsInDM',
        async () => {
            const { aliceClient, bobClient, streamId } = await setupMlsDM()

            const aliceMessages = Array.from(Array(5).keys()).map((key) => `Alice ${key}`)
            const bobMessages = Array.from(Array(5).keys()).map((key) => `Bob ${key}`)

            const results = await Promise.all([
                ...aliceMessages.map(async (message) =>
                    aliceClient
                        .sendMessage(streamId, message, [], [], { useMls: true })
                        .then(() => {
                            log.extend('alice:send')(message)
                        }),
                ),
                ...bobMessages.map(async (message) =>
                    bobClient.sendMessage(streamId, message, [], [], { useMls: true }).then(() => {
                        log.extend('bob:send')(message)
                    }),
                ),
            ])

            expect(results).toBeDefined()

            const allMessages = [...aliceMessages, ...bobMessages]

            // Alice received all messages
            await expect
                .poll(
                    () =>
                        checkTimelineContainsAll(
                            allMessages,
                            aliceClient.streams.get(streamId)!.view.timeline,
                        ),
                    { timeout: 10_000 },
                )
                .toBeTruthy()

            // Bob received all messages
            await expect
                .poll(
                    () =>
                        checkTimelineContainsAll(
                            allMessages,
                            bobClient.streams.get(streamId)!.view.timeline,
                        ),
                    { timeout: 10_000 },
                )
                .toBeTruthy()
        },
        { timeout: 20_000 },
    )

    // GDM

    it.skip('threeClientsCanJoin', async () => {
        const aliceClient = await makeInitAndStartClient('alice')
        const bobClient = await makeInitAndStartClient('bob')
        const charlieClient = await makeInitAndStartClient('charlie')

        const { streamId } = await aliceClient.createGDMChannel([
            bobClient.userId,
            charlieClient.userId,
        ])
        await expect(aliceClient.waitForStream(streamId)).resolves.toBeDefined()
        await expect(bobClient.waitForStream(streamId)).resolves.toBeDefined()
        await expect(charlieClient.waitForStream(streamId)).resolves.toBeDefined()

        await expect(
            aliceClient.sendMessage(streamId, 'hello all', [], [], { useMls: true }),
        ).resolves.toBeDefined()

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

    it.skip('moreClientsCanJoin', async () => {
        const alicesClient = await makeInitAndStartClient('alice')
        const bobsClient = await makeInitAndStartClient('bob')
        const charliesClient = await makeInitAndStartClient('charlie')

        const { streamId } = await bobsClient.createGDMChannel([
            alicesClient.userId,
            charliesClient.userId,
        ])
        await expect(bobsClient.waitForStream(streamId)).resolves.toBeDefined()
        await expect(alicesClient.waitForStream(streamId)).resolves.toBeDefined()
        await expect(charliesClient.waitForStream(streamId)).resolves.toBeDefined()

        // alice's message will:

        await expect(
            alicesClient.sendMessage(streamId, 'hello bob', [], [], { useMls: true }),
        ).resolves.toBeDefined()

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
        ).resolves.toBeDefined()

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
            await expect(bobsClient.joinUser(streamId, client.userId)).resolves.toBeDefined()
            addedClients.push(client)
        }

        for (const client of addedClients) {
            await expect(client.waitForStream(streamId)).resolves.toBeDefined()
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
            { timeoutMS: 10_000 },
        )
    })

    it.skip('manyClientsInChannel', async () => {
        const spaceId = makeUniqueSpaceStreamId()
        const bobsClient = await makeInitAndStartClient('bob')
        await expect(bobsClient.createSpace(spaceId)).resolves.toBeDefined()

        const channelId = makeUniqueChannelStreamId(spaceId)
        await expect(
            bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId),
        ).resolves.toBeDefined()

        await Promise.all(
            Array.from(Array(12).keys()).map(async (n) => {
                log(`JOINING client-${n}`)
                const client = await makeInitAndStartClient(`client-${n}`)
                if (client.mlsQueue) {
                    client.mlsQueue.mlsCrypto.awaitTimeoutMS = 30_000
                }
                await expect(client.joinStream(channelId)).resolves.toBeDefined()
                await expect(client.waitForStream(channelId)).resolves.toBeDefined()
            }),
        )

        await expect(
            bobsClient.sendMessage(channelId, 'hello everyone', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        const messages: string[] = []
        for (const [idx, client] of clients.entries()) {
            const msg = `hello ${idx}`
            await expect(
                client.sendMessage(channelId, msg, [], [], { useMls: true }),
            ).resolves.toBeDefined()
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
        ).resolves.toBeDefined()

        await expect(
            await waitFor(async () => {
                for (const client of clients) {
                    check(await client.mlsQueue!.mlsCrypto.hasGroup(channelId))
                    check(
                        (await client.mlsQueue!.mlsCrypto.epochFor(channelId)) ===
                            BigInt(clients.length - 1),
                    )
                }
            }),
        ).resolves.toBeDefined()
    })

    it.skip('manyClientsInChannelInterleaving', async () => {
        const spaceId = makeUniqueSpaceStreamId()
        const bobsClient = await makeInitAndStartClient('bob')
        await expect(bobsClient.createSpace(spaceId)).resolves.toBeDefined()
        const channelId = makeUniqueChannelStreamId(spaceId)
        await expect(
            bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId),
        ).resolves.toBeDefined()

        const messagesInFlight: Promise<any>[] = []
        const messages: string[] = []

        const send = (client: Client, msg: string) => {
            messages.push(msg)
            messagesInFlight.push(client.sendMessage(channelId, msg, [], [], { useMls: true }))
        }

        send(bobsClient, 'hello everyone')

        const NUM_CLIENTS = 5
        const NUM_MESSAGES = 1

        // TODO: Creating clients while others are sending messages seems to break the node
        const extraClients = await Promise.all(
            Array.from(Array(NUM_CLIENTS).keys()).map(async (n: number) => {
                log(`INIT client-${n}`)
                const client = await makeInitAndStartClient(`client-${n}`)
                if (client.mlsQueue) {
                    client.mlsQueue.mlsCrypto.awaitTimeoutMS = 30_000
                }
                return client
            }),
        )

        await Promise.all(
            extraClients.map(async (client: Client, n: number) => {
                log(`JOIN client-${n}`)
                await expect(client.joinStream(channelId)).resolves.toBeDefined()
                if (NUM_MESSAGES > 0) {
                    send(client, `hello from ${n}`)
                }
                for (let m = 1; m < NUM_MESSAGES; m++) {
                    send(client, `message ${m} from ${n}`)
                }
            }),
        )

        await expect(Promise.all(messagesInFlight)).resolves.toBeDefined()
        await waitFor(
            () => {
                for (const client of clients) {
                    const stream = client.streams.get(channelId)!
                    check(checkTimelineContainsAll(messages, stream.view.timeline))
                }
            },
            { timeoutMS: 60_000 },
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

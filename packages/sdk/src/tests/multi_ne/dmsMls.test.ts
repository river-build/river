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
import { afterEach, beforeEach, describe, expect } from 'vitest'

const log = dlog('test:mls')

// copied from vitest/expect
interface ExpectPollOptions {
    interval?: number
    timeout?: number
    message?: string
}

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
    const client = await makeTestClient()
    if (nickname) {
        client.nickname = nickname
    }
    await client.initializeUser()
    client.startSync()
    clients.push(client)
    return client
}

async function checkAllClientsAgreeOnAnEpoch(streamId: string, options?: ExpectPollOptions) {
    const expectedEpoch = BigInt(clients.length - 1)
    const getEpoch = async (client: Client) => {
        await client.mlsQueue?.mlsCrypto.awaitGroupActive(streamId)
        return client.mlsQueue?.mlsCrypto.epochFor(streamId) ?? 0n
    }
    if (expectedEpoch <= 0n) {
        throw new Error('Expected at least 1 client')
    }

    return expect
        .poll(async () => {
            const clientsWithEpochs = await Promise.all(clients.map(getEpoch))
            return clientsWithEpochs.every((epoch) => epoch === expectedEpoch)
        }, options)
        .toBeTruthy()
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

    it('clientCanCreateDMAndObserveMls', async () => {
        await expect(
            aliceClient.sendMessage(streamId, 'hello bob', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        // Check if every client can observe latestGroupInfo
        await expect
            .poll(
                () => clients.every((client) => getLatestGroupInfo(client, streamId) !== undefined),
                { timeout: 10_000 },
            )
            .toBeTruthy()
    })

    it('clientsAgreeOnEpochInDM', async () => {
        // Alice sends message to ensure MLS starts
        await expect(
            aliceClient.sendMessage(streamId, 'hello bob', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        // Ensure All clients agree on an epoch
        await checkAllClientsAgreeOnAnEpoch(streamId, { timeout: 10_000 })
    })

    it('clientCanSendOneMlsMessageInDM', async () => {
        const result = await aliceClient.sendMessage(streamId, 'hello bob', [], [], {
            useMls: true,
        })

        expect(result).toBeDefined()

        // Check if all clients received the message
        await expect
            .poll(
                () =>
                    clients.every((client) =>
                        checkTimelineContainsAll(
                            ['hello bob'],
                            client.streams.get(streamId)!.view.timeline,
                        ),
                    ),
                { timeout: 5_000 },
            )
            .toBeTruthy()
    })

    it('bothClientsCanSendOneMlsMessageInDM', async () => {
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

    it('clientCanSendManyMlsPayloadsInDM', { timeout: 20_000 }, async () => {
        const aliceMessages = Array.from(Array(5).keys()).map((key) => `Alice ${key}`)
        const bobMessages = Array.from(Array(5).keys()).map((key) => `Bob ${key}`)

        const results = await Promise.all([
            ...aliceMessages.map(async (message) =>
                aliceClient.sendMessage(streamId, message, [], [], { useMls: true }).then(() => {
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

        // All clients received all messages
        await expect
            .poll(
                () =>
                    clients.every((client) =>
                        checkTimelineContainsAll(
                            allMessages,
                            client.streams.get(streamId)!.view.timeline,
                        ),
                    ),
                { timeout: 10_000 },
            )
            .toBeTruthy()
    })
})

describe('gdmMlsTests', () => {
    let aliceClient!: Client
    let bobClient!: Client
    let charlieClient!: Client
    let streamId!: string

    async function setupMlsGDM() {
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

        return { aliceClient, bobClient, charlieClient, streamId }
    }

    beforeEach(async () => {
        const initialValues = await setupMlsGDM()
        aliceClient = initialValues.aliceClient
        bobClient = initialValues.bobClient
        charlieClient = initialValues.charlieClient
        streamId = initialValues.streamId
    }, 10_000)

    it('clientCanCreateGDM', async () => {
        expect(aliceClient).toBeDefined()
        expect(bobClient).toBeDefined()
        expect(charlieClient).toBeDefined()
        expect(streamId).toBeDefined()
    })

    it('clientCanCreateGDMAndObserveMls', async () => {
        await expect(
            aliceClient.sendMessage(streamId, 'hello all', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        await expect
            .poll(
                async () => {
                    return clients.every(
                        (client) => getLatestGroupInfo(client, streamId) !== undefined,
                    )
                },
                { timeout: 10_000 },
            )
            .toBeTruthy()
    })

    it('clientsAgreeOnEpochInGDM', async () => {
        // Alice sends message to ensure MLS starts
        await expect(
            aliceClient.sendMessage(streamId, 'hello bob', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        // Ensure all clients agree on an epoch
        await checkAllClientsAgreeOnAnEpoch(streamId, { timeout: 10_000 })
    })

    it('clientCanSendOneMlsMessageInGDM', async () => {
        const result = await aliceClient.sendMessage(streamId, 'hello all', [], [], {
            useMls: true,
        })

        expect(result).toBeDefined()

        // Check if all clients received the message
        await expect
            .poll(
                () =>
                    clients.every((client) =>
                        checkTimelineContainsAll(
                            ['hello all'],
                            client.streams.get(streamId)!.view.timeline,
                        ),
                    ),
                { timeout: 5_000 },
            )
            .toBeTruthy()
    })

    it('allClientsCanSendOneMlsMessageInGDM', async () => {
        // Alice can send message
        await expect(
            aliceClient.sendMessage(streamId, 'hello from alice', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        await expect(
            bobClient.sendMessage(streamId, 'hello from bob', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        await expect(
            charlieClient.sendMessage(streamId, 'hello from charlie', [], [], { useMls: true }),
        ).resolves.toBeDefined()

        // Check Alice can see both messages
        await expect
            .poll(
                () =>
                    checkTimelineContainsAll(
                        ['hello from alice', 'hello from bob', 'hello from charlie'],
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
                        ['hello from alice', 'hello from bob', 'hello from charlie'],
                        bobClient.streams.get(streamId)!.view.timeline,
                    ),
                { timeout: 10_000 },
            )
            .toBeTruthy()

        // Check charlie can see all messages
        await expect
            .poll(
                () =>
                    checkTimelineContainsAll(
                        ['hello from alice', 'hello from bob', 'hello from charlie'],
                        charlieClient.streams.get(streamId)!.view.timeline,
                    ),
                { timeout: 10_000 },
            )
            .toBeTruthy()
    })

    it('clientsCanSendManyMlsPayloadsInGDM', { timeout: 20_000 }, async () => {
        const numbers = Array.from(Array(5).keys())

        const allMessages = await Promise.all(
            clients.flatMap((client) => {
                const logger = log.extend(`${client.nickname}:send`)
                return numbers.map(async (number) => {
                    const message = `${client.nickname} ${number}`
                    await client.sendMessage(streamId, message, [], [], { useMls: true })
                    logger(message)
                    return message
                })
            }),
        )

        // Check if all clients received all the messages
        await expect
            .poll(
                () =>
                    clients.every((client) =>
                        checkTimelineContainsAll(
                            allMessages,
                            client.streams.get(streamId)!.view.timeline,
                        ),
                    ),
                { timeout: 10_000 },
            )
            .toBeTruthy()
    })

    describe('gdmWitExtraUsersTest', () => {
        const addedClients: Client[] = []
        const numberOfAddedClients = 3

        beforeEach(async () => {
            await aliceClient.sendMessage(streamId, 'hello everyone', [], [], { useMls: true })

            // add 3 more users
            for (let i = 0; i < numberOfAddedClients; i++) {
                const client = await makeInitAndStartClient(`client-${i}`)
                await aliceClient.joinUser(streamId, client.userId)
                addedClients.push(client)
            }

            // await for those users to join the streams
            await Promise.all(addedClients.map(async (client) => client.waitForStream(streamId)))
        }, 10_000)

        afterEach(async () => {
            // reset addedClients
            addedClients.length = 0
        })

        it('moreClientsCanJoinGDM', async () => {
            for (let i = 0; i < numberOfAddedClients; i++) {
                expect(addedClients[i]).toBeDefined()
            }
        })

        it('moreClientsCanJoinAndObserveMls', async () => {
            await expect
                .poll(() =>
                    clients.every((client) => getLatestGroupInfo(client, streamId) !== undefined),
                )
                .toBeTruthy()
        })

        it('moreClientsCanJoinGDMAndAgreeOnEpoch', async () => {
            // Ensure all clients agree on an epoch
            await checkAllClientsAgreeOnAnEpoch(streamId, { timeout: 20_000 })
        })

        it('moreClientsCanObservePastMessages', async () => {
            await expect
                .poll(
                    () =>
                        clients.every((client) =>
                            checkTimelineContainsAll(
                                ['hello everyone'],
                                client.streams.get(streamId)!.view.timeline,
                            ),
                        ),
                    { timeout: 20_000 },
                )
                .toBeTruthy()
        })

        it('moreClientsCanSendOneMlsMessageInGDM', async () => {
            const numbers = Array.from(Array(1).keys())

            const allMessages = await Promise.all(
                addedClients.flatMap((client) => {
                    const logger = log.extend(`${client.nickname}:send`)
                    return numbers.map(async (number) => {
                        const message = `${client.nickname} ${number}`
                        await client.sendMessage(streamId, message, [], [], { useMls: true })
                        logger(message)
                        return message
                    })
                }),
            )

            // Check if all clients received all the messages
            await expect
                .poll(
                    () =>
                        clients.every((client) =>
                            checkTimelineContainsAll(
                                allMessages,
                                client.streams.get(streamId)!.view.timeline,
                            ),
                        ),
                    { timeout: 10_000 },
                )
                .toBeTruthy()
        })

        it('moreClientsCanSendManyMlsPayloadsInGDM', async () => {
            const numbers = Array.from(Array(5).keys())

            const allMessages = await Promise.all(
                clients.flatMap((client) => {
                    const logger = log.extend(`${client.nickname}:send`)
                    return numbers.map(async (number) => {
                        const message = `${client.nickname} ${number}`
                        await client.sendMessage(streamId, message, [], [], { useMls: true })
                        logger(message)
                        return message
                    })
                }),
            )

            // Check if all clients received all the messages
            await expect
                .poll(
                    () =>
                        clients.every((client) =>
                            checkTimelineContainsAll(
                                allMessages,
                                client.streams.get(streamId)!.view.timeline,
                            ),
                        ),
                    { timeout: 10_000 },
                )
                .toBeTruthy()
        })
    })
})

describe.skip('channelMlsTests', () => {
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

function getLatestGroupInfo(client: Client, streamId: string): Uint8Array | undefined {
    return client.streams.get(streamId)?.view.membershipContent.mls.latestGroupInfo
}

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

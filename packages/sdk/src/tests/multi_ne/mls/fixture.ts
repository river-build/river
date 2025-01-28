// mlsFixture.ts
import { test as baseTest, expect } from 'vitest'
import { makeTestClient } from '../../testUtils'
import { Client } from '../../../client'
import { MembershipOp } from '@river-build/proto'
import { ELogger, elogger } from '@river-build/dlog'
import { checkTimelineContainsAll } from './utils'
import { StreamTimelineEvent } from '../../../types'
import { LocalViewStatus } from '../../../mls/view/local'

const log = elogger('test:mls:fixture')

/**
 * We define each fixture property at top level.
 * Notice that `joinStream`, `sendMessage`, etc. no longer take `streamId`,
 * but rely on `currentStreamId.get()` or `currentStreamId.set()`.
 */
type StreamIdController = {
    get: () => string[]
    lastOrThrow: () => string
    add: (streamId: string) => void
}

const bigIntAscending = (a: bigint, b: bigint) => (a > b ? 1 : a < b ? -1 : 0)

export type MlsFixture = {
    // The usual array of clients
    clients: Client[]

    // Optional global message store
    messages: string[]

    // A "controller" for the current stream ID
    streams: StreamIdController

    // Utility to poll a function until true
    poll: (fn: () => boolean, opts?: { timeout?: number }) => Promise<void>
    // Wait for all known clients to be active in the "current" stream
    waitForAllActive: (opts?: { timeout?: number }) => Promise<void>

    // Creates and starts a client
    makeInitAndStartClient: (
        logId?: string,
        baseLogger?: ELogger,
        mlsAlwaysEnabled?: boolean,
    ) => Promise<Client>

    // Joins the "current" stream
    joinStreams: (client: Client) => Promise<void>

    // Sends a message to the "current" stream
    sendMessage: (client: Client, message: string) => Promise<{ eventId: string }>

    // Getters
    timeline: (client: Client) => StreamTimelineEvent[]
    status: (client: Client) => LocalViewStatus | undefined
    epochSecrets: (client: Client) => [bigint, Uint8Array][]
    epochs: (client: Client) => bigint[]

    // predicates
    saw: (...messages: string[]) => (client: Client) => boolean
    sawAll: (client: Client) => boolean
    hasEpochs: (...epochs: number[]) => (client: Client) => boolean

    // Check if a client is "active" in the "current" stream
    isActive: (client: Client) => boolean
}

type TimeoutOpts = { timeout?: number } | undefined

export const test = baseTest.extend<MlsFixture>({
    // eslint-disable-next-line no-empty-pattern
    clients: async ({}, use) => {
        const clients: Client[] = []
        await use(clients)
        // Teardown: stop them
        for (const client of clients) {
            await client.stop()
        }
    },

    // eslint-disable-next-line no-empty-pattern
    messages: async ({}, use) => {
        const messages: string[] = []
        await use(messages)
        messages.length = 0
    },

    /**
     * currentStreamId fixture: a simple object holding get()/set() for the "main" stream ID
     */
    // eslint-disable-next-line no-empty-pattern
    streams: async ({}, use) => {
        const streams: string[] = []
        const controller: StreamIdController = {
            get: () => streams,
            lastOrThrow: () => {
                if (streams.length <= 0) {
                    throw new Error('No streamId, please add one first')
                }
                return streams[streams.length - 1]
            },
            add: (id: string) => {
                streams.push(id)
            },
        }
        await use(controller)
        streams.length = 0
    },
    // eslint-disable-next-line no-empty-pattern
    poll: async ({}, use) => {
        async function poll(fn: () => boolean, opts: TimeoutOpts = { timeout: 10_000 }) {
            await expect.poll(fn, opts).toBeTruthy()
        }

        await use(poll)
    },

    makeInitAndStartClient: async ({ clients }, use) => {
        const makeInitAndStartClient: MlsFixture['makeInitAndStartClient'] = async (
            logId: string = 'client',
            baseLogger: ELogger = log,
            mlsAlwaysEnabled = false,
        ) => {
            const clientLog = baseLogger.extend(logId)
            const client = await makeTestClient({
                logId,
                mlsOpts: { log: clientLog, mlsAlwaysEnabled },
            })
            await client.initializeUser()
            client.startSync()
            clients.push(client)
            return client
        }

        await use(makeInitAndStartClient)
    },

    /**
     * Now `joinStream` references `currentStreamId.get()`
     * instead of requiring the test to pass a streamId.
     */
    joinStreams: async ({ streams }, use) => {
        async function joinStreams(client: Client) {
            for (const streamId of streams.get()) {
                await client.joinStream(streamId)
                const stream = await client.waitForStream(streamId)
                await stream.waitForMembership(MembershipOp.SO_JOIN)
            }
        }

        await use(joinStreams)
    },

    /**
     * sendMessage references the "current" stream
     */
    sendMessage: async ({ messages, streams }, use) => {
        async function sendMessage(client: Client, message: string) {
            const streamId = streams.lastOrThrow()
            messages.push(message)
            return client.sendMessage(streamId, message)
        }

        await use(sendMessage)
    },

    /**
     * timeline references the "current" stream
     */
    timeline: async ({ streams }, use) => {
        function timeline(client: Client) {
            const streamId = streams.lastOrThrow()
            return client.streams.get(streamId)?.view.timeline || []
        }

        await use(timeline)
    },
    status: async ({ streams }, use) => {
        const status = (client: Client) => {
            const streamId = streams.lastOrThrow()
            return client.mlsExtensions?.agent?.streams.get(streamId)?.localView?.status
        }

        await use(status)
    },
    epochSecrets: async ({ streams }, use) => {
        const epochSecrets = (client: Client) => {
            const streamId = streams.lastOrThrow()
            const iterator = client.mlsExtensions?.agent?.streams
                .get(streamId)
                ?.localView?.epochSecrets.values()
            if (iterator === undefined) {
                return []
            }
            const epochs: [bigint, Uint8Array][] = Array.from(iterator, (v) => [v.epoch, v.secret])
            return epochs.sort((a, b) => bigIntAscending(a[0], b[0]))
        }

        await use(epochSecrets)
    },
    epochs: async ({ epochSecrets }, use) => {
        const epochs = (client: Client) => {
            return epochSecrets(client).map((a) => a[0])
        }

        await use(epochs)
    },
    // Predicates
    saw: async ({ timeline }, use) => {
        const saw =
            (...messages: string[]) =>
            (client: Client) =>
                checkTimelineContainsAll(messages, timeline(client))

        await use(saw)
    },
    sawAll: async ({ saw, messages }, use) => {
        const sawAll = saw(...messages)

        await use(sawAll)
    },
    hasEpochs: async ({ epochs }, use) => {
        const hasEpochs =
            (...epochNumbers: number[]) =>
            (client: Client) => {
                const clientEpochs = new Set(epochs(client))
                const desiredEpochs = epochNumbers.map((i) => BigInt(i))
                return desiredEpochs.every((e) => clientEpochs.has(e))
            }

        await use(hasEpochs)
    },
    isActive: async ({ status }, use) => {
        function isActive(client: Client) {
            return status(client) === 'active'
        }

        await use(isActive)
    },

    waitForAllActive: async ({ clients, poll, isActive }, use) => {
        async function waitForAllActive(opts: TimeoutOpts = { timeout: 10_000 }) {
            await poll(() => clients.every(isActive), opts)
        }

        await use(waitForAllActive)
    },
})

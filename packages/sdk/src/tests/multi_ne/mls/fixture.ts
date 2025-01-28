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
    getOrThrow: () => string
    set: (streamId: string) => void
}

const bigIntAscending = (a: bigint, b: bigint) => (a > b ? 1 : a < b ? -1 : 0)

export type MlsFixture = {
    // The usual array of clients
    clients: Client[]

    // Optional global message store
    messages: string[]

    // A "controller" for the current stream ID
    currentStreamId: StreamIdController

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
    joinStream: (client: Client) => Promise<void>

    // Sends a message to the "current" stream
    sendMessage: (client: Client, message: string) => Promise<{ eventId: string }>

    // Getters
    timeline: (client: Client) => StreamTimelineEvent[]
    status: (client: Client) => LocalViewStatus | undefined
    epochSecrets: (client: Client) => [bigint, Uint8Array][]
    epochs: (client: Client) => bigint[]

    // predicates
    saw: (client: Client, ...messages: string[]) => boolean
    sawAll: (client: Client) => boolean

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
    currentStreamId: async ({}, use) => {
        let _streamId: string | undefined
        const controller: StreamIdController = {
            getOrThrow: () => {
                if (!_streamId) {
                    throw new Error('No streamId is set, please call setCurrentStreamId first.')
                }
                return _streamId
            },
            set: (id: string) => {
                _streamId = id
            },
        }
        await use(controller)
    },

    // eslint-disable-next-line no-empty-pattern
    poll: async ({}, use) => {
        async function poll(fn: () => boolean, opts: TimeoutOpts) {
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
    joinStream: async ({ currentStreamId }, use) => {
        async function joinStream(client: Client) {
            const streamId = currentStreamId.getOrThrow()
            await client.joinStream(streamId)
            const stream = await client.waitForStream(streamId)
            await stream.waitForMembership(MembershipOp.SO_JOIN)
        }

        await use(joinStream)
    },

    /**
     * sendMessage references the "current" stream
     */
    sendMessage: async ({ messages, currentStreamId }, use) => {
        async function sendMessage(client: Client, message: string) {
            const streamId = currentStreamId.getOrThrow()
            messages.push(message)
            return client.sendMessage(streamId, message)
        }

        await use(sendMessage)
    },

    /**
     * timeline references the "current" stream
     */
    timeline: async ({ currentStreamId }, use) => {
        function timeline(client: Client) {
            const streamId = currentStreamId.getOrThrow()
            return client.streams.get(streamId)?.view.timeline || []
        }

        await use(timeline)
    },
    status: async ({ currentStreamId }, use) => {
        const status = (client: Client) => {
            const streamId = currentStreamId.getOrThrow()
            return client.mlsExtensions?.agent?.streams.get(streamId)?.localView?.status
        }

        await use(status)
    },
    epochSecrets: async ({ currentStreamId }, use) => {
        const epochSecrets = (client: Client) => {
            const streamId = currentStreamId.getOrThrow()
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
    saw: async ({ timeline }, use) => {
        function saw(client: Client, ...messages: string[]) {
            return checkTimelineContainsAll(messages, timeline(client))
        }

        await use(saw)
    },
    sawAll: async ({ saw, messages }, use) => {
        function sawAll(client: Client) {
            return saw(client, ...messages)
        }

        await use(sawAll)
    },

    isActive: async ({ status }, use) => {
        function isActive(client: Client) {
            return status(client) === 'active'
        }

        await use(isActive)
    },

    waitForAllActive: async ({ clients, poll, isActive }, use) => {
        async function waitForAllActive(opts: TimeoutOpts = { timeout: 10_000 }) {
            await poll(() => clients.every((c) => isActive(c)), opts)
        }

        await use(waitForAllActive)
    },
})

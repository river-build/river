// mlsFixture.ts
import { test as baseTest, expect } from 'vitest'
import { makeTestClient } from '../../testUtils'
import { Client } from '../../../client'
import { MembershipOp } from '@river-build/proto'
import { dlog } from '@river-build/dlog'
import { checkTimelineContainsAll as rawCheckTimelineContainsAll } from './utils'
import { StreamTimelineEvent } from '../../../types'

const log = dlog('test:mls:fixture')

/**
 * We define each fixture property at top level.
 * Notice that `joinStream`, `sendMessage`, etc. no longer take `streamId`,
 * but rely on `currentStreamId.get()` or `currentStreamId.set()`.
 */
type StreamIdController = {
    get: () => string | undefined
    set: (streamId: string) => void
}

type MlsFixture = {
    // The usual array of clients
    clients: Client[]

    // Optional global message store
    messages: string[]

    // A "controller" for the current stream ID
    currentStreamId: StreamIdController

    // Utility to poll a function until true
    poll: (fn: () => boolean, opts?: { timeout?: number }) => Promise<void>

    // Creates and starts a client
    makeInitAndStartClient: (nickname?: string) => Promise<Client>

    // Joins the "current" stream
    joinStream: (client: Client) => Promise<void>

    // Sends a message to the "current" stream
    sendMessage: (client: Client, message: string) => Promise<{ eventId: string }>

    // Returns the timeline of the "current" stream
    timeline: (client: Client) => any[]

    // If you're storing messages globally, you can reuse this
    checkTimelineContainsAll: (msgs: string[], timeline: any[]) => boolean
    sawAll: (client: Client, msgs: string[]) => boolean

    // Check if a client is "active" in the "current" stream
    isActive: (client: Client) => boolean

    // Wait for all known clients to be active in the "current" stream
    waitForAllActive: (opts?: { timeout?: number }) => Promise<void>
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
            get: () => _streamId,
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
        async function makeInitAndStartClient(nickname?: string) {
            const clientLog = log.extend(nickname ?? 'client')
            const client = await makeTestClient({ nickname, mlsOpts: { log: clientLog } })
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
            const streamId = currentStreamId.get()
            if (!streamId) {
                throw new Error(
                    'No currentStreamId is set. Please call setCurrentStreamId before joinStream.',
                )
            }
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
            const streamId = currentStreamId.get()
            if (!streamId) {
                throw new Error(
                    'No currentStreamId is set. Please call setCurrentStreamId before sendMessage.',
                )
            }
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
            const streamId = currentStreamId.get()
            if (!streamId) {
                throw new Error(
                    'No currentStreamId is set. Please call setCurrentStreamId before timeline().',
                )
            }
            return client.streams.get(streamId)?.view.timeline || []
        }

        await use(timeline)
    },

    // eslint-disable-next-line no-empty-pattern
    checkTimelineContainsAll: async ({}, use) => {
        function checkTimelineContainsAll(messages: string[], tl: StreamTimelineEvent[]) {
            return rawCheckTimelineContainsAll(messages, tl)
        }

        await use(checkTimelineContainsAll)
    },

    sawAll: async ({ checkTimelineContainsAll, timeline }, use) => {
        function sawAll(client: Client, messages: string[]) {
            return checkTimelineContainsAll(messages, timeline(client))
        }

        await use(sawAll)
    },

    isActive: async ({ currentStreamId }, use) => {
        function isActive(client: Client) {
            const streamId = currentStreamId.get()
            if (!streamId) {
                throw new Error(
                    'No currentStreamId is set. Please call setCurrentStreamId before isActive().',
                )
            }
            const status = client.mlsExtensions?.agent?.streams.get(streamId)?.localView?.status
            return status === 'active'
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

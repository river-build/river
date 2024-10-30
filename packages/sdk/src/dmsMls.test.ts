/**
 * @group main
 */

import { check } from '@river-build/dlog'
import { Client } from './client'
import {
    createEventDecryptedPromise,
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

        // HEAVY WIP — DON*T WORRY
        const aliceEventDecryptedPromise = createEventDecryptedPromise(alicesClient, 'hello alice')

        // alice's message will:
        // - trigger a group initialization by alice
        // - trigger Bob's client to join the group using an external join
        // by design, bob can _never_ read alice's message until we have external keys in place
        await expect(
            alicesClient.sendMessage(streamId, 'hello bob', [], [], { useMls: true }),
        ).toResolve()

        await waitFor(() => {
            console.log('CHECKING...')
            const stream = bobsClient.streams.get(streamId)
            check(stream?._view.membershipContent.mls.latestGroupInfo !== undefined)
        })

        await expect(
            bobsClient.sendMessage(streamId, 'hello alice', [], [], { useMls: true }),
        ).toResolve()

        await expect(Promise.all([aliceEventDecryptedPromise])).toResolve()
    })
})

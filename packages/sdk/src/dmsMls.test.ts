/**
 * @group main
 */

import { Client } from './client'
import { createEventDecryptedPromise, makeTestClient } from './util.test'
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

        const aliceEventDecryptedPromise = createEventDecryptedPromise(alicesClient, 'hello')
        await expect(
            alicesClient.sendMessage(streamId, 'hello', [], [], { useMls: true }),
        ).toResolve()

        await expect(
            bobsClient.sendMessage(streamId, 'hello', [], [], { useMls: true }),
        ).toResolve()

        await expect(Promise.all([aliceEventDecryptedPromise])).toResolve()
    })
})

/**
 * @group main
 */

// import { makeTestClient, createEventDecryptedPromise, waitFor } from './util.test'
import { makeTestClient } from './util.test'
import { Client } from './client'
import { Client as MlsClient } from '@river-build/mls-rs-wasm'
// import { addressFromUserId, makeDMStreamId, streamIdAsBytes } from './id'
// import { makeEvent } from './sign'
// import { make_DMChannelPayload_Inception, make_MemberPayload_Membership2 } from './types'
// import { MembershipOp } from '@river-build/proto'

describe('dmsTests', () => {
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

    const utf8Encoder = new TextEncoder()
    const utf8Decoder = new TextDecoder()

    test('clientsCanSendMlsMessages', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        await expect(bobsClient.waitForStream(streamId)).toResolve()
        await expect(bobsClient.sendMlsMessage(streamId, utf8Encoder.encode('hello'))).toResolve()

        await expect(alicesClient.waitForStream(streamId)).toResolve()
        await expect(alicesClient.sendMlsMessage(streamId, utf8Encoder.encode('hello'))).toResolve()
    })
})

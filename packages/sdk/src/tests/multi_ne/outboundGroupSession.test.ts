/**
 * @group main
 */

import { makeTestClient, makeUniqueSpaceStreamId } from '../testUtils'
import { Client } from '../../client'

import { genShortId, makeUniqueChannelStreamId } from '../../id'
import { ChannelMessage } from '@river-build/proto'

describe('outboundSessionTests', () => {
    let bobsDeviceId: string
    let bobsClient: Client
    beforeEach(async () => {
        bobsDeviceId = genShortId()
        bobsClient = await makeTestClient({ deviceId: bobsDeviceId })
    })

    afterEach(async () => {
        await bobsClient.stop()
    })

    // This test is a bit of a false positive, since it's not actually using the IndexedDB
    // store, but instead the local-storage store.
    test('sameOutboundSessionIsUsedBetweenClientSessions', async () => {
        await expect(bobsClient.initializeUser()).resolves.not.toThrow()
        bobsClient.startSync()

        const spaceId = makeUniqueSpaceStreamId()
        await expect(bobsClient.createSpace(spaceId)).resolves.not.toThrow()

        const channelId = makeUniqueChannelStreamId(spaceId)
        await expect(
            bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId),
        ).resolves.not.toThrow()
        await expect(bobsClient.waitForStream(channelId)).resolves.not.toThrow()

        const message = new ChannelMessage({
            payload: {
                case: 'post',
                value: {
                    content: {
                        case: 'text',
                        value: { body: 'hello' },
                    },
                },
            },
        })

        const bobsOtherClient = await makeTestClient({
            context: bobsClient.signerContext,
            deviceId: bobsDeviceId,
        })
        await expect(bobsOtherClient.initializeUser()).resolves.not.toThrow()
        bobsOtherClient.startSync()

        const encrypted1 = await bobsClient.encryptGroupEvent(message, channelId)
        const encrypted2 = await bobsOtherClient.encryptGroupEvent(message, channelId)

        expect(encrypted1?.sessionId).toBeDefined()
        expect(encrypted1.sessionId).toEqual(encrypted2.sessionId)

        await bobsOtherClient.stop()
        await bobsClient.stop()
    })

    test('differentOutboundSessionIdsForDifferentStreams', async () => {
        await expect(bobsClient.initializeUser()).resolves.not.toThrow()
        bobsClient.startSync()

        const spaceId = makeUniqueSpaceStreamId()
        await expect(bobsClient.createSpace(spaceId)).resolves.not.toThrow()

        const channelId1 = makeUniqueChannelStreamId(spaceId)
        await expect(bobsClient.createChannel(spaceId, '', '', channelId1)).resolves.not.toThrow()
        await expect(bobsClient.waitForStream(channelId1)).resolves.not.toThrow()

        const channelId2 = makeUniqueChannelStreamId(spaceId)
        await expect(bobsClient.createChannel(spaceId, '', '', channelId2)).resolves.not.toThrow()
        await expect(bobsClient.waitForStream(channelId2)).resolves.not.toThrow()

        const message = new ChannelMessage({
            payload: {
                case: 'post',
                value: {
                    content: {
                        case: 'text',
                        value: { body: 'hello' },
                    },
                },
            },
        })

        const encryptedChannel1_1 = await bobsClient.encryptGroupEvent(message, channelId1)
        const encryptedChannel1_2 = await bobsClient.encryptGroupEvent(message, channelId1)
        const encryptedChannel2_1 = await bobsClient.encryptGroupEvent(message, channelId2)

        expect(encryptedChannel1_1?.sessionId).toBeDefined()
        expect(encryptedChannel1_2?.sessionId).toBeDefined()
        expect(encryptedChannel1_1.sessionId).toEqual(encryptedChannel1_2.sessionId)
        expect(encryptedChannel1_1.sessionId).not.toEqual(encryptedChannel2_1.sessionId)

        const x = bobsClient.cryptoBackend?.hasSessionKey(channelId1, encryptedChannel1_1.sessionId)
        expect(x).toBeDefined()
    })
})

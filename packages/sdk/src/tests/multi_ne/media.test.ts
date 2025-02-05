/**
 * @group main
 */

import { makeTestClient, makeUniqueSpaceStreamId } from '../testUtils'
import { Client } from '../../client'
import { makeUniqueChannelStreamId, makeDMStreamId } from '../../id'
import { InfoRequest } from '@river-build/proto'
import { deriveKeyAndIV, encryptAESGCM } from '../../crypto_utils'
import { MiniblockRef } from '../../types'

describe('mediaTests', () => {
    let bobsClient: Client

    beforeEach(async () => {
        bobsClient = await makeTestClient()
        await bobsClient.initializeUser()
        bobsClient.startSync()
    })

    afterEach(async () => {
        await bobsClient.stop()
    })

    async function bobCreateMediaStream(
        chunkCount: number,
    ): Promise<{ streamId: string; prevMiniblock: MiniblockRef }> {
        const spaceId = makeUniqueSpaceStreamId()
        await expect(bobsClient.createSpace(spaceId)).resolves.not.toThrow()

        const channelId = makeUniqueChannelStreamId(spaceId)
        await expect(
            bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId),
        ).resolves.not.toThrow()

        return bobsClient.createMediaStream(channelId, spaceId, undefined, chunkCount)
    }

    async function bobSendMediaPayloads(
        streamId: string,
        chunks: number,
        prevMiniblock: MiniblockRef,
    ): Promise<MiniblockRef> {
        for (let i = 0; i < chunks; i++) {
            const chunk = new Uint8Array(100)
            // Create novel chunk content for testing purposes
            chunk.fill(i, 0, 100)
            const result = await bobsClient.sendMediaPayload(streamId, chunk, i, prevMiniblock)
            prevMiniblock = result.prevMiniblock
        }
        return prevMiniblock
    }

    async function bobSendEncryptedMediaPayload(
        streamId: string,
        data: Uint8Array,
        key: Uint8Array,
        iv: Uint8Array,
        prevMiniblock: MiniblockRef,
    ): Promise<MiniblockRef> {
        const { ciphertext } = await encryptAESGCM(data, key, iv)
        const result = await bobsClient.sendMediaPayload(streamId, ciphertext, 0, prevMiniblock)
        return result.prevMiniblock
    }

    function createTestMediaChunks(chunks: number): Uint8Array {
        const data: Uint8Array = new Uint8Array(10 * chunks)
        for (let i = 0; i < chunks; i++) {
            const start = i * 10
            const end = start + 10
            data.fill(i, start, end)
        }
        return data
    }

    async function bobCreateSpaceMediaStream(
        spaceId: string,
        chunkCount: number,
    ): Promise<{ streamId: string; prevMiniblock: MiniblockRef }> {
        await expect(bobsClient.createSpace(spaceId)).resolves.not.toThrow()
        return await bobsClient.createMediaStream(undefined, spaceId, undefined, chunkCount)
    }

    test('clientCanCreateMediaStream', async () => {
        await expect(bobCreateMediaStream(10)).resolves.not.toThrow()
    })

    test('clientCanCreateSpaceMediaStream', async () => {
        const spaceId = makeUniqueSpaceStreamId()
        await expect(bobCreateSpaceMediaStream(spaceId, 10)).resolves.not.toThrow()
    })

    test('clientCanSendMediaPayload', async () => {
        const mediaStreamInfo = await bobCreateMediaStream(10)
        await bobSendMediaPayloads(mediaStreamInfo.streamId, 10, mediaStreamInfo.prevMiniblock)
    })

    test('clientCanSendSpaceMediaPayload', async () => {
        const spaceId = makeUniqueSpaceStreamId()
        const mediaStreamInfo = await bobCreateSpaceMediaStream(spaceId, 10)
        await expect(
            bobSendMediaPayloads(mediaStreamInfo.streamId, 10, mediaStreamInfo.prevMiniblock),
        ).resolves.not.toThrow()
    })

    test('clientCanSendEncryptedDerivedAesGmPayload', async () => {
        const spaceId = makeUniqueSpaceStreamId()
        const mediaStreamInfo = await bobCreateSpaceMediaStream(spaceId, 3)
        const { iv, key } = await deriveKeyAndIV(spaceId)
        const data = createTestMediaChunks(2)
        await expect(
            bobSendEncryptedMediaPayload(
                mediaStreamInfo.streamId,
                data,
                key,
                iv,
                mediaStreamInfo.prevMiniblock,
            ),
        ).resolves.not.toThrow()
    })

    test('clientCanDownloadEncryptedDerivedAesGmPayload', async () => {
        const spaceId = makeUniqueSpaceStreamId()
        const mediaStreamInfo = await bobCreateSpaceMediaStream(spaceId, 2)
        const { iv, key } = await deriveKeyAndIV(spaceId)
        const data = createTestMediaChunks(2)
        await bobSendEncryptedMediaPayload(
            mediaStreamInfo.streamId,
            data,
            key,
            iv,
            mediaStreamInfo.prevMiniblock,
        )
        const decryptedChunks = await bobsClient.getMediaPayload(mediaStreamInfo.streamId, key, iv)
        expect(decryptedChunks).toEqual(data)
    })

    test('chunkIndexNeedsToBeWithinBounds', async () => {
        const result = await bobCreateMediaStream(10)
        const chunk = new Uint8Array(100)
        await expect(
            bobsClient.sendMediaPayload(result.streamId, chunk, -1, result.prevMiniblock),
        ).rejects.toThrow()
        await expect(
            bobsClient.sendMediaPayload(result.streamId, chunk, 11, result.prevMiniblock),
        ).rejects.toThrow()
    })

    test('chunkSizeCanBeAtLimit', async () => {
        const result = await bobCreateMediaStream(10)
        const chunk = new Uint8Array(500000)
        await expect(
            bobsClient.sendMediaPayload(result.streamId, chunk, 0, result.prevMiniblock),
        ).resolves.not.toThrow()
    })

    test('chunkSizeNeedsToBeWithinLimit', async () => {
        const result = await bobCreateMediaStream(10)
        const chunk = new Uint8Array(500001)
        await expect(
            bobsClient.sendMediaPayload(result.streamId, chunk, 0, result.prevMiniblock),
        ).rejects.toThrow()
    })

    test('chunkCountNeedsToBeWithinLimit', async () => {
        await expect(bobCreateMediaStream(11)).rejects.toThrow()
    })

    test('clientCanOnlyPostToTheirOwnMediaStream', async () => {
        const result = await bobCreateMediaStream(10)
        const chunk = new Uint8Array(100)

        const alicesClient = await makeTestClient()
        await alicesClient.initializeUser()
        alicesClient.startSync()

        await expect(
            alicesClient.sendMediaPayload(result.streamId, chunk, 5, result.prevMiniblock),
        ).rejects.toThrow()
        await alicesClient.stop()
    })

    test('clientCanOnlyPostToTheirOwnPublicMediaStream', async () => {
        const spaceId = makeUniqueSpaceStreamId()
        const result = await bobCreateSpaceMediaStream(spaceId, 10)
        const chunk = new Uint8Array(100)

        const alicesClient = await makeTestClient()
        await alicesClient.initializeUser()
        alicesClient.startSync()

        await expect(
            alicesClient.sendMediaPayload(result.streamId, chunk, 5, result.prevMiniblock),
        ).rejects.toThrow()
        await alicesClient.stop()
    })

    test('channelNeedsToExistBeforeCreatingMediaStream', async () => {
        const nonExistentSpaceId = makeUniqueSpaceStreamId()
        const nonExistentChannelId = makeUniqueChannelStreamId(nonExistentSpaceId)
        await expect(
            bobsClient.createMediaStream(nonExistentChannelId, nonExistentSpaceId, undefined, 10),
        ).rejects.toThrow()
    })

    test('dmChannelNeedsToExistBeforeCreatingMediaStream', async () => {
        const alicesClient = await makeTestClient()
        await alicesClient.initializeUser()
        alicesClient.startSync()

        const nonExistentChannelId = makeDMStreamId(bobsClient.userId, alicesClient.userId)
        await expect(
            bobsClient.createMediaStream(nonExistentChannelId, undefined, undefined, 10),
        ).rejects.toThrow()
        await alicesClient.stop()
    })

    test('userCanUploadMediaToDmIfMember', async () => {
        const alicesClient = await makeTestClient()
        await alicesClient.initializeUser()
        alicesClient.startSync()

        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        await expect(
            bobsClient.createMediaStream(streamId, undefined, undefined, 10),
        ).resolves.not.toThrow()
        await expect(
            alicesClient.createMediaStream(streamId, undefined, undefined, 10),
        ).resolves.not.toThrow()
        await alicesClient.stop()
    })

    test('userCanUploadMediaToGdmIfMember', async () => {
        const alicesClient = await makeTestClient()
        await alicesClient.initializeUser()
        alicesClient.startSync()

        const charliesClient = await makeTestClient()
        await charliesClient.initializeUser()
        charliesClient.startSync()

        const { streamId } = await bobsClient.createGDMChannel([
            alicesClient.userId,
            charliesClient.userId,
        ])
        await expect(
            bobsClient.createMediaStream(streamId, undefined, undefined, 10),
        ).resolves.not.toThrow()
        await alicesClient.stop()
        await charliesClient.stop()
    })

    test('userCannotUploadMediaToDmUnlessMember', async () => {
        const alicesClient = await makeTestClient()
        await alicesClient.initializeUser()
        alicesClient.startSync()

        const charliesClient = await makeTestClient()
        await charliesClient.initializeUser()
        charliesClient.startSync()

        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)

        await expect(
            charliesClient.createMediaStream(streamId, undefined, undefined, 10),
        ).rejects.toThrow()
        await alicesClient.stop()
        await charliesClient.stop()
    })

    // This test is flaky because there is a bug in GetStreamEx where sometimes the miniblock is not
    // finalized before the client tries to fetch it. This is a known issue, see HNT-5291.
    test.skip('mediaStreamGetStreamEx', async () => {
        const { streamId, prevMiniblock } = await bobCreateMediaStream(10)
        // Send a series of media chunks
        await bobSendMediaPayloads(streamId, 10, prevMiniblock)
        // Force server to flush minipool events into a block
        await bobsClient.rpcClient.info(
            new InfoRequest({
                debug: ['make_miniblock', streamId],
            }),
            { timeoutMs: 10000 },
        )

        // Grab stream from both endpoints
        const stream = await bobsClient.getStream(streamId)
        const streamEx = await bobsClient.getStreamEx(streamId)

        // Assert exact content equality with bobSendMediaPayloads
        expect(streamEx.mediaContent.info).toBeDefined()
        expect(streamEx.mediaContent.info?.chunks.length).toEqual(10)
        for (let i = 0; i < 10; i++) {
            const chunk = new Uint8Array(100)
            chunk.fill(i, 0, 100)
            expect(streamEx.mediaContent.info?.chunks[i]).toBeDefined()
            expect(streamEx.mediaContent.info?.chunks[i]).toEqual(chunk)
        }

        // Assert equality of mediaContent between getStream and getStreamEx
        // use-chunked-media.ts utilizes the tream.mediaContent.info property, so equality here
        // will result in the same behavior in the client app.
        expect(stream.mediaContent).toEqual(streamEx.mediaContent)
    })

    test('userMediaStream', async () => {
        const alicesClient = await makeTestClient()
        await alicesClient.initializeUser()
        alicesClient.startSync()
        await expect(
            alicesClient.createMediaStream(undefined, undefined, alicesClient.userId, 10),
        ).resolves.not.toThrow()
    })
})

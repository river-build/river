/**
 * @group integration/stream-metadata
 */
import axios from 'axios'
import { dlog } from '@river-build/dlog'
import { contractAddressFromSpaceId, deriveKeyAndIV } from '@river-build/sdk'
import { ChunkedMedia } from '@river-build/proto'
import { PlainMessage } from '@bufbuild/protobuf'

import {
	encryptAndSendMediaPayload,
	getTestServerUrl,
	makeMediaBlob,
	makeTestClient,
	makeUniqueSpaceStreamId,
} from '../testUtils'

const log = dlog('stream-metadata:test', {
	allowJest: true,
	defaultEnabled: true,
})

//const log = console.log

describe('GET /space/:spaceAddress/image', () => {
	const baseURL = getTestServerUrl()
	log('baseURL', baseURL)

	it('should return 404 /space/0x0000000000000000000000000000000000000000/image', async () => {
		const expectedStatus = 404
		const route = 'space'
		try {
			await axios.get(`${baseURL}/${route}`)
			throw new Error(`Expected request to fail with status ${expectedStatus})`)
		} catch (error) {
			if (axios.isAxiosError(error)) {
				expect(error.response).toBeDefined()
				expect(error.response?.status).toBe(expectedStatus)
			} else {
				// If the error is not an Axios error, rethrow it
				throw error
			}
		}
	})

	it('should return 404 /space', async () => {
		const expectedStatus = 404
		const route = 'space'
		try {
			await axios.get(`${baseURL}/${route}`)
			throw new Error(`Expected request to fail with status ${expectedStatus})`)
		} catch (error) {
			if (axios.isAxiosError(error)) {
				expect(error.response).toBeDefined()
				expect(error.response?.status).toBe(expectedStatus)
			} else {
				// If the error is not an Axios error, rethrow it
				throw error
			}
		}
	})

	it('should return 400 /space/0x0/image', async () => {
		const expectedStatus = 400
		const route = 'space/0x0/image'
		try {
			await axios.get(`${baseURL}/${route}`)
			throw new Error(`Expected request to fail with status ${expectedStatus})`)
		} catch (error) {
			if (axios.isAxiosError(error)) {
				expect(error.response).toBeDefined()
				expect(error.response?.status).toBe(expectedStatus)
			} else {
				// If the error is not an Axios error, rethrow it
				throw error
			}
		}
	})

	it.only('should return status 200 with valid spaceImage', async () => {
		/**
		 * 1. create a space.
		 * 2. upload a space image.
		 * 3. fetch the space image from the stream-metadata server.
		 */

		/*
		 * 1. create a space.
		 */
		const spaceId = makeUniqueSpaceStreamId()
		const bobsClient = await makeTestClient()

		await bobsClient.initializeUser()
		bobsClient.startSync()

		await bobsClient.createSpace(spaceId)
		const spaceStream = await bobsClient.waitForStream(spaceId)
		log('spaceStreamId', spaceStream.streamId)

		// assert assumptions
		expect(spaceStream).toBeDefined()
		expect(
			spaceStream.view.snapshot?.content.case === 'spaceContent' &&
				spaceStream.view.snapshot?.content.value.spaceImage === undefined,
		).toBe(true)

		/*
		 * 2. upload a space image.
		 */
		const dataSize = 20
		const filename = 'bob.png'
		const { data, info } = makeMediaBlob(filename, dataSize)
		const chunkedMedia = await encryptAndSendMediaPayload(bobsClient, spaceId, info, data)

		await bobsClient.setSpaceImage(spaceId, chunkedMedia)

		// make a snapshot
		await bobsClient.debugForceMakeMiniblock(spaceId, { forceSnapshot: true })

		/*
		 * 3. fetch the space image from the stream-metadata server.
		 */
		const spaceContractAddress = contractAddressFromSpaceId(spaceId)
	})
})

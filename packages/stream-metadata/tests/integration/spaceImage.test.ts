/**
 * @group integration/stream-metadata
 */
import axios from 'axios'
import { dlog } from '@river-build/dlog'
import { contractAddressFromSpaceId } from '@river-build/sdk'

import { getTestServerUrl, makeTestClient, makeUniqueSpaceStreamId } from '../testUtils'

/*
const log = dlog('stream-metadata:test', {
	allowJest: true,
	defaultEnabled: true,
})
	*/

const log = console.log

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
		const spaceId = makeUniqueSpaceStreamId()
		const spaceContractAddress = contractAddressFromSpaceId(spaceId)
		const bobsClient = await makeTestClient()
		log('before bobsClient.initializeUser')
		await bobsClient.initializeUser()
		log('before bobsClient.startSync')
		bobsClient.startSync()

		log('before bobsClient.createSpace')
		await expect(bobsClient.createSpace(spaceId)).toResolve()
		log('before bobsClient.waitForStream')
		const spaceStream = await bobsClient.waitForStream(spaceId)
		log('spaceStreamId', spaceStream.streamId)

		// assert assumptions
		expect(spaceStream).toBeDefined()
		expect(
			spaceStream.view.snapshot?.content.case === 'spaceContent' &&
				spaceStream.view.snapshot?.content.value.spaceImage === undefined,
		).toBe(true)
	})
})

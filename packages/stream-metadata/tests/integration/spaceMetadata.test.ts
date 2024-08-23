import axios from 'axios'
import { dlog } from '@river-build/dlog'

import {
	getTestServerUrl,
	makeCreateSpaceParams,
	makeSpaceDapp,
	makeTestClient,
} from '../testUtils'
import { testConfig } from '../testEnvironment'

const log = dlog('stream-metadata:test:spaceMetadata', {
	allowJest: true,
	defaultEnabled: true,
})

describe('integration/space/:spaceAddress', () => {
	const baseURL = getTestServerUrl()
	log('baseURL', baseURL)

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

	it('should return 400 /space/0x', async () => {
		const expectedStatus = 400
		const route = 'space/0x'
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

	it('should return status 200 without spaceImage', async () => {
		/**
		 * 1. create a space on-chain.
		 * 2. create a space stream.
		 * 3. fetch the space contract info from the stream-metadata server.
		 * 4. verify the response.
		 */

		/*
		 * 1. create a space on-chain.
		 */
		const { client: bobsClient, wallet: bobsWallet } = await makeTestClient()
		await bobsClient.initializeUser()
		bobsClient.startSync()

		const spaceDapp = makeSpaceDapp(testConfig.web3Config.base, testConfig.baseChainRpcUrl)

		const createSpaceParams = await makeCreateSpaceParams(spaceDapp, {
			spaceName: 'bobs space',
			spaceImageUri: '',
			channelName: 'general',
			shortDescription: 'bobs space short description',
			longDescription: 'bobs space long description',
		})

		const tx = await spaceDapp.createLegacySpace(createSpaceParams, bobsWallet)
		const receipt = await tx.wait()
		expect(receipt.status).toBe(1)

		const spaceId = spaceDapp.getSpaceAddress(receipt)
		if (!spaceId) {
			throw new Error('spaceId is undefined')
		}
		log('spaceId', spaceId)

		/*
		 * 2. create a space stream.
		 */
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
		 * 3. fetch the space image from the stream-metadata server.
		 */
	})
})

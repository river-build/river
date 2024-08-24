import axios from 'axios'
import { dlog } from '@river-build/dlog'
import { ethers } from 'ethers'

import {
	getTestServerUrl,
	makeCreateSpaceParams,
	makeEthersProvider,
	makeSpaceDapp,
	makeTestClient,
	SpaceMetadataParams,
} from '../testUtils'
import { config } from '../../src/environment'

const log = dlog('stream-metadata:test:spaceMetadata', {
	allowJest: true,
	defaultEnabled: true,
})

interface MetadataResponse {
	name: string
	longDescription: string
	shortDescription: string
	image: string
}

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
		const bobsWallet = ethers.Wallet.createRandom()
		const bobsClient = await makeTestClient(bobsWallet)
		await bobsClient.initializeUser()
		bobsClient.startSync()

		const spaceDapp = makeSpaceDapp(bobsWallet)
		const expectedMetadata: SpaceMetadataParams = {
			name: 'bobs space',
			uri: '',
			shortDescription: 'bobs space short description',
			longDescription: 'bobs space long description',
		}

		const createSpaceParams = await makeCreateSpaceParams(
			bobsClient.userId,
			spaceDapp,
			expectedMetadata,
		)

		const provider = makeEthersProvider(bobsWallet)
		// need funds to create space and execute tranasctions
		await provider.fundWallet()

		const tx = await spaceDapp.createLegacySpace(createSpaceParams, provider.signer)
		const receipt = await tx.wait()
		expect(receipt.status).toBe(1)

		const spaceAddress = spaceDapp.getSpaceAddress(receipt)
		expect(spaceAddress).toBeDefined()
		if (!spaceAddress) {
			throw new Error('spaceAddress is undefined')
		}

		/*
		 * 2. create a space stream.
		 */
		const spaceStreamId = await bobsClient.createSpace(spaceAddress)
		expect(spaceStreamId).toBeDefined()
		log('spaceStreamId', spaceStreamId)

		/*
		 * 3. fetch the space metadata from the stream-metadata server.
		 */
		const route = `space/${spaceAddress}`
		const response = await axios.get<MetadataResponse>(`${baseURL}/${route}`)
		log('response', { status: response.status, data: response.data })

		const { name, longDescription, shortDescription, image } = response.data
		expect(response.status).toBe(200)
		expect(response.headers['content-type']).toContain('application/json')
		expect(name).toEqual(expectedMetadata.name)
		expect(longDescription).toEqual(expectedMetadata.longDescription)
		expect(shortDescription).toEqual(expectedMetadata.shortDescription)
		const expectedImageUrl = `http://localhost:${config.port}/space/${spaceAddress}/image`
		expect(image.toLowerCase()).toEqual(expectedImageUrl.toLowerCase())
	})
})

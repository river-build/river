import axios from 'axios'
import { dlog } from '@river-build/dlog'
import { ethers } from 'ethers'
import { Client } from '@river-build/sdk'

import {
	encryptAndSendMediaPayload,
	getTestServerUrl,
	makeCreateSpaceParams,
	makeEthersProvider,
	makeJpegBlob,
	makeTestClient,
	SpaceMetadataParams,
} from '../testUtils'
import { config } from '../../src/environment'
import { SpaceMetadataResponse } from '../../src/routes/spaceMetadata'
import { getSpaceDapp } from '../../src/contract-utils'

const log = dlog('stream-metadata:test:spaceMetadata', {
	allowJest: true,
	defaultEnabled: true,
})

describe('integration/space/:spaceAddress', () => {
	const baseURL = getTestServerUrl()
	log('baseURL', baseURL)

	let bobsClient: Client
	let bobsWallet: ethers.Wallet

	beforeEach(async () => {
		bobsWallet = ethers.Wallet.createRandom()
		bobsClient = await makeTestClient(bobsWallet)
		await bobsClient.initializeUser()
		bobsClient.startSync()
	})

	afterEach(async () => {
		await bobsClient.stopSync()
	})

	async function runDecriptionTest(shortDescription: string, longDescription: string) {
		const spaceDapp = getSpaceDapp()
		const expectedMetadata: SpaceMetadataParams = {
			name: 'bobs space',
			uri: '',
			shortDescription,
			longDescription,
		}

		const createSpaceParams = await makeCreateSpaceParams(
			bobsClient.userId,
			spaceDapp,
			expectedMetadata,
		)

		const provider = makeEthersProvider(bobsWallet)
		await provider.fundWallet()

		const tx = await spaceDapp.createLegacySpace(createSpaceParams, provider.signer)
		const receipt = await tx.wait()
		expect(receipt.status).toBe(1)

		const spaceAddress = spaceDapp.getSpaceAddress(receipt)
		expect(spaceAddress).toBeDefined()
		if (!spaceAddress) {
			throw new Error('spaceAddress is undefined')
		}

		const spaceStreamId = await bobsClient.createSpace(spaceAddress)
		expect(spaceStreamId).toBeDefined()
		log('spaceStreamId', spaceStreamId)

		const route = `space/${spaceAddress}`
		const response = await axios.get<SpaceMetadataResponse>(`${baseURL}/${route}`)
		log('response', { status: response.status, data: response.data })

		const { name, description, image } = response.data
		expect(response.status).toBe(200)
		expect(response.headers['content-type']).toContain('application/json')
		expect(name).toEqual(expectedMetadata.name)

		let expectedDescription
		if (shortDescription && longDescription) {
			expectedDescription = `${shortDescription}\n\n${longDescription}`
		} else if (shortDescription) {
			expectedDescription = shortDescription
		} else {
			expectedDescription = longDescription
		}

		expect(description).toEqual(expectedDescription)
		expect(image).toBeUndefined()
	}

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

	it('should return status 200 without spaceImage - both descriptions have values', async () => {
		await runDecriptionTest('bobs space short description', 'bobs space long description')
	})

	it('should return status 200 without spaceImage - shortDescription has value, longDescription is empty', async () => {
		await runDecriptionTest('bobs space short description', '')
	})

	it('should return status 200 without spaceImage - shortDescription is empty, longDescription has value', async () => {
		await runDecriptionTest('', 'bobs space long description')
	})

	it('should return status 200 with spaceImage', async () => {
		/**
		 * 1. create a space on-chain.
		 * 2. create a space stream.
		 * 3. upload a space image.
		 * 4. fetch the space contract info from the stream-metadata server.
		 * 5. verify the response.
		 */

		/*
		 * 1. create a space on-chain.
		 */
		const spaceDapp = getSpaceDapp()
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
		const { streamId: spaceStreamId } = await bobsClient.createSpace(spaceAddress)
		expect(spaceStreamId).toBeDefined()
		log('spaceStreamId', spaceStreamId)

		/*
		 * 3. upload a space image.
		 */
		const dataSize = 30
		const { data: imageData, info } = makeJpegBlob(dataSize)
		const chunkedMedia = await encryptAndSendMediaPayload(
			bobsClient,
			spaceStreamId,
			info,
			imageData,
		)

		await bobsClient.setSpaceImage(spaceStreamId, chunkedMedia)

		/*
		 * 4. fetch the space metadata from the stream-metadata server.
		 */
		const route = `space/${spaceAddress}`
		const response = await axios.get<SpaceMetadataResponse>(`${baseURL}/${route}`)
		log('response', { status: response.status, data: response.data })

		/*
		 * 5. verify the response.
		 */
		const { name, description, image: imageUrl } = response.data
		expect(response.status).toBe(200)
		expect(response.headers['content-type']).toContain('application/json')
		expect(name).toEqual(expectedMetadata.name)
		const expectedDescription = `${expectedMetadata.shortDescription}\n\n${expectedMetadata.longDescription}`
		expect(description).toEqual(expectedDescription)
		const expectedImageUrl = `http://localhost:${config.port}/space/${spaceAddress}/image`
		expect(imageUrl?.toLowerCase()).toEqual(expectedImageUrl.toLowerCase())
	})
})

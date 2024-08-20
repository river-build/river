import axios from 'axios'
import { makeTestClient } from '@river-build/sdk'

import { getTestServerInfo } from '../testUtils'

describe('GET /space/:spaceAddress/image', () => {
	const baseURL = getTestServerInfo()

	it('should return status 404 without spaceAddress', async () => {
		try {
			await axios.get(`${baseURL}/space`)
			throw new Error('Expected request to fail with status 404')
		} catch (error) {
			if (axios.isAxiosError(error)) {
				expect(error.response).toBeDefined()
				expect(error.response?.status).toBe(404)
			} else {
				// If the error is not an Axios error, rethrow it
				throw error
			}
		}
	})

	it('should return status 200 with valid spaceImage', async () => {
		//const bobsClient = await makeTestClient()
	})
})

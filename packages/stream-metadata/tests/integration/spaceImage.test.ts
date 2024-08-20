import axios from 'axios'

import { getTestServerInfo } from '../testUtils'

describe('GET /space/:spaceAddress/image', () => {
	const baseURL = getTestServerInfo()

	it('should return 404 /space/0x0000000000000000000000000000000000000000/image', async () => {
		const expectedStatus = 404
		try {
			await axios.get(`${baseURL}/space`)
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

	it('should return 400 /space', async () => {
		const expectedStatus = 400
		try {
			await axios.get(`${baseURL}/space`)
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
		try {
			await axios.get(`${baseURL}/space`)
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

	it('should return status 200 with valid spaceImage', async () => {
		//const bobsClient = await makeTestClient()
	})
})

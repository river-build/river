import axios from 'axios'

import { getTestServerInfo } from '../testUtils'

describe('GET /spaceImage', () => {
	const baseURL = getTestServerInfo()

	it('should return status 404 without arguments', async () => {
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
})

import axios from 'axios'
import { dlog } from '@river-build/dlog'

import { getTestServerUrl } from '../testUtils'

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
})

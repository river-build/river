import axios from 'axios'

import { getTestServerUrl } from '../testUtils'

describe('GET /health', () => {
	const baseURL = getTestServerUrl()

	it('should return status 200 and status ok when the server is healthy', async () => {
		const endpoint = `${baseURL}/health`
		const response = await axios.get(endpoint)

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ status: 'ok' })
	})
})

import axios from 'axios'

import { getLogger } from '../../src/logger'
import { getTestServerInfo } from '../../src/testUtils'

const logger = getLogger('stream-metadata:tests:integration:health')

describe('GET /health Integration Test', () => {
	const baseURL = getTestServerInfo()
	logger.info({ baseURL }, 'baseURL')

	it('should return status 200 and status ok when the server is healthy', async () => {
		const response = await axios.get(`${baseURL}/health`);

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ status: 'ok' })
	})
})

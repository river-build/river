import Fastify from 'fastify'

import { config } from '../../src/environment'
import { setupRoutes, Server } from '../../src/node'
import { getLogger } from '../../src/logger'
import * as healthModule from '../../src/routes/health'

const logger = getLogger('stream-metadata:tests:integration:health')

describe('GET /health Integration Test', () => {
	let server: Server

	beforeAll(async () => {
		server = Fastify({
			logger,
		})
		setupRoutes(server)
		await server.listen({ port: config.port }) // Listen on a random available port
	})

	afterAll(async () => {
		await server.close()
	})

	it('should return status 200 and status ok when the server is healthy', async () => {
		const response = await server.inject({
			method: 'GET',
			url: '/health',
		})

		expect(response.statusCode).toBe(200)
		expect(response.json()).toEqual({ status: 'ok' })
	})
})

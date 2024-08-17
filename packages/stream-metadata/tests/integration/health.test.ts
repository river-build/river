import Fastify from 'fastify'

import { setupRoutes, Server } from '../../src/node'
import { getLogger } from '../../src/logger'
import pino from 'pino'

const logger = getLogger('stream-metadata:tests:integration:health')

describe('GET /health Integration Test', () => {
	let server: Server

	beforeAll(async () => {
		server = Fastify({
			logger,
		})
		setupRoutes(server)
		await server.listen({ port: 0 }) // Listen on a random available port
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

	it('should return status 500 if there is an issue with the server', async () => {
		// Simulate a server issue by altering the server's internal state
		// For example, you could stop a required service or database connection if needed

		const response = await server.inject({
			method: 'GET',
			url: '/health',
		})

		// Adjust this to the actual behavior when the server is unhealthy
		expect(response.statusCode).toBe(500)
		expect(response.json()).toEqual({ status: 'error' })
	})
})

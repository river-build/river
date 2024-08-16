import Fastify from 'fastify'
import { setupRoutes, Server } from '../../src/node'
import { getRiverRegistry } from '../../src/evmRpcClient'

// Mock the getRiverRegistry function
jest.mock('../../src/evmRpcClient', () => ({
	getRiverRegistry: jest.fn(),
}))

describe('GET /health', () => {
	let server: Server

	beforeAll(async () => {
		server = Fastify()
		setupRoutes(server)
	})

	afterAll(async () => {
		await server.close()
	})

	it('should return status 200 and status ok when healthy', async () => {
		// Mock the behavior of getRiverRegistry().getAllNodes()
		;(getRiverRegistry().getAllNodes as jest.Mock).mockResolvedValueOnce([])

		const response = await server.inject({
			method: 'GET',
			url: '/health',
		})

		expect(response.statusCode).toBe(200)
		expect(response.json()).toEqual({ status: 'ok' })
	})

	it('should return status 500 and status error when unhealthy', async () => {
		// Mock the behavior of getRiverRegistry().getAllNodes() to throw an error
		;(getRiverRegistry().getAllNodes as jest.Mock).mockRejectedValueOnce(
			new Error('Failed to fetch nodes'),
		)

		const response = await server.inject({
			method: 'GET',
			url: '/health',
		})

		expect(response.statusCode).toBe(500)
		expect(response.json()).toEqual({ status: 'error' })
	})
})

import { Server as HTTPSServer } from 'https'

import Fastify from 'fastify'
import cors from '@fastify/cors'

import { handleImageRequest } from './handleImageRequest'
import { handleMetadataRequest } from './handleMetadataRequest'
import { config } from './environment'
import { getLogger } from './logger'
import { handleHealthCheckRequest } from './handleHealthCheckRequests'

// Set the process title to 'fetch-image' so it can be easily identified
// or killed with `pkill fetch-image`
process.title = 'stream-metadata'

const logger = getLogger('server')

logger.info('config', {
	riverEnv: config.riverEnv,
	chainId: config.river.chainId,
	port: config.port,
	riverRegistry: config.river.addresses.riverRegistry,
	riverChainRpcUrl: config.riverChainRpcUrl,
})

/*
 * Server setup
 */
const server = Fastify({
	logger,
})

async function registerPlugins() {
	try {
		await server.register(cors, {
			origin: '*', // Allow any origin
			methods: ['GET'], // Allowed HTTP methods
		})
		logger.info('CORS registered successfully')
	} catch (err) {
		logger.error('Error registering CORS', err)
		process.exit(1) // Exit the process if registration fails
	}
}

void registerPlugins()

/*
 * Routes
 */
server.get('/health', async (request, reply) => {
	logger.info(`GET /health`)
	return handleHealthCheckRequest(config, request, reply)
})

server.get('/space/:spaceAddress', async (request, reply) => {
	const { spaceAddress } = request.params as { spaceAddress?: string }
	logger.info(`GET /space`, { spaceAddress })

	const { protocol, serverAddress } = getServerInfo()
	return handleMetadataRequest(request, reply, `${protocol}://${serverAddress}`)
})

server.get('/space/:spaceAddress/image', async (request, reply) => {
	const { spaceAddress } = request.params as { spaceAddress?: string }
	logger.info(`GET /space/../image`, {
		spaceAddress,
	})

	return handleImageRequest(config, request, reply)
})

// Generic / route to return 404
server.get('/', async (request, reply) => {
	return reply.code(404).send('Not found')
})

/*
 * Start the server
 */
function getServerInfo() {
	const addressInfo = server.server.address()
	const protocol = server.server instanceof HTTPSServer ? 'https' : 'http'
	const serverAddress =
		typeof addressInfo === 'string'
			? addressInfo
			: `${addressInfo?.address}:${addressInfo?.port}`
	return { protocol, serverAddress }
}

// Type guard to check if error has code property
function isAddressInUseError(err: unknown): err is NodeJS.ErrnoException {
	return err instanceof Error && 'code' in err && err.code === 'EADDRINUSE'
}

// Function to start the server on the first available port
async function startServer(port: number) {
	try {
		await server.listen({ port, host: 'localhost' })
		const addressInfo = server.server.address()
		if (addressInfo && typeof addressInfo === 'object') {
			server.log.info(`Server listening on ${addressInfo.address}:${addressInfo.port}`)
		}
	} catch (err) {
		if (isAddressInUseError(err)) {
			server.log.warn(`Port ${port} is in use, trying port ${port + 1}`)
			await startServer(port + 1) // Try the next port
		} else {
			server.log.error(err)
			process.exit(1)
		}
	}
}

process.on('SIGTERM', async () => {
	try {
		await server.close()
		logger.info('Server closed gracefully')
		process.exit(0)
	} catch (err) {
		logger.info('Error during server shutdown', err)
		process.exit(1)
	}
})

// Start the server on the port set in the .env, or the next available port
startServer(config.port)
	.then(() => {
		logger.info('Server started')
	})
	.catch((err: unknown) => {
		logger.error('Error starting server', {
			err,
		})
		process.exit(1)
	})

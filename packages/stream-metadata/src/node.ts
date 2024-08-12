import { Server as HTTPSServer } from 'https'

import Fastify from 'fastify'
import cors from '@fastify/cors'

import { handleImageRequest } from './handleImageRequest'
import { handleMetadataRequest } from './handleMetadataRequest'
import { config } from './environment'
import { getLogger } from './logger'

// Set the process title to 'fetch-image' so it can be easily identified
// or killed with `pkill fetch-image`
process.title = 'stream-metadata'

const logger = getLogger('server')

const server = Fastify({
	logger,
})

async function registerPlugins() {
	try {
		await server.register(cors, {
			origin: '*', // Allow any origin
			methods: ['GET'], // Allowed HTTP methods
		})
		console.info('CORS registered successfully')
	} catch (err) {
		console.error('Error registering CORS', err)
		process.exit(1) // Exit the process if registration fails
	}
}

registerPlugins()

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

	return handleImageRequest(request, reply)
})

// Generic / route to return 404
server.get('/', async (request, reply) => {
	return reply.code(404).send('Not found')
})

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

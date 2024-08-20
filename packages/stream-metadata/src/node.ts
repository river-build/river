import { Server as HTTPServer, IncomingMessage, ServerResponse } from 'http'
import { Server as HTTPSServer } from 'https'

import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { v4 as uuidv4 } from 'uuid'

import { config } from './environment'
import { getLogger } from './logger'
import { checkHealth } from './routes/health'
import { fetchSpaceImage } from './routes/spaceImage'
import { fetchSpaceMetadata } from './routes/spaceMetadata'

// Set the process title to 'stream-metadata' so it can be easily identified
// or killed with `pkill stream-metadata`
process.title = 'stream-metadata'

const logger = getLogger('server')

logger.info(
	{
		riverEnv: config.riverEnv,
		chainId: config.web3Config.river.chainId,
		port: config.port,
		riverRegistry: config.web3Config.river.addresses.riverRegistry,
		riverChainRpcUrl: config.riverChainRpcUrl,
	},
	'config',
)

/*
 * Server setup
 */
export type Server = FastifyInstance<
	HTTPServer | HTTPSServer,
	IncomingMessage,
	ServerResponse,
	typeof logger
>

const server = Fastify({
	logger,
	genReqId: () => uuidv4(),
})

server.addHook('onRequest', (request, reply, done) => {
	const reqId = request.id // Use Fastify's generated reqId, which is now a UUID
	request.log = request.log.child({ reqId })
	done()
})

async function registerPlugins(srv: Server) {
	await srv.register(cors, {
		origin: '*', // Allow any origin
		methods: ['GET'], // Allowed HTTP methods
	})
	logger.info('CORS registered successfully')
}

function setupRoutes(srv: Server) {
	/*
	 * Routes
	 */
	srv.get('/health', checkHealth)
	srv.get('/space/:spaceAddress', async (request, reply) =>
		fetchSpaceMetadata(request, reply, getServerUrl(srv)),
	)
	srv.get('/space/:spaceAddress/image', fetchSpaceImage)

	// Generic / route to return 404
	srv.get('/', async (request, reply) => {
		return reply.code(404).send('Not found')
	})
}

/*
 * Start the server
 */
function getServerUrl(srv: Server) {
	const addressInfo = srv.server.address()
	const protocol = srv.server instanceof HTTPSServer ? 'https' : 'http'
	const serverAddress =
		typeof addressInfo === 'string'
			? addressInfo
			: `${addressInfo?.address}:${addressInfo?.port}`
	return `${protocol}://${serverAddress}`
}

process.on('SIGTERM', async () => {
	try {
		await server.close()
		logger.info('Server closed gracefully')
		process.exit(0)
	} catch (error) {
		logger.error(error, 'Error during server shutdown')
		process.exit(1)
	}
})

async function main() {
	try {
		await registerPlugins(server)
		setupRoutes(server)
		await server.listen({
			port: config.port,
			host: config.host,
		})
		logger.info('Server started')
	} catch (error) {
		logger.error(error, 'Error starting server')
		process.exit(1)
	}
}

void main()

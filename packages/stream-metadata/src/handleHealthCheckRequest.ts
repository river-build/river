import { FastifyReply, FastifyRequest } from 'fastify'

import { Config } from './types'
import { getLogger } from './logger'
import { getRiverRegistry } from './evmRpcClient'

const logger = getLogger('handleHealthCheckRequest')

export async function handleHealthCheckRequest(
	config: Config,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	let riverRegistry: ReturnType<typeof getRiverRegistry> | undefined
	// Do a health check on the river registry
	try {
		riverRegistry = getRiverRegistry(config)
		if (riverRegistry) {
			await riverRegistry.getAllNodes()
			// healthy
			return reply.code(200).send({ status: 'ok' })
		}

		// unhealthy
		logger.error('Failed to get river registry')
		return reply.code(500).send({ status: 'error' })
	} catch (e) {
		// unhealthy
		logger.error('Failed to get river registry', { err: e })
		return reply.code(500).send({ status: 'error' })
	}
}

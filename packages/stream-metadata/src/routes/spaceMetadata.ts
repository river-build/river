import { FastifyRequest, FastifyReply } from 'fastify'

import { isValidEthereumAddress } from '../validators'
import { getFunctionLogger } from '../logger'

export function fetchSpaceMetadata(
	request: FastifyRequest,
	reply: FastifyReply,
	serverUrl: string,
) {
	const logger = getFunctionLogger(request.log, 'fetchSpaceMetadata')
	const { spaceAddress } = request.params as { spaceAddress?: string }

	if (!spaceAddress) {
		logger.error('spaceAddress parameter is required')
		return reply
			.code(400)
			.send({ error: 'Bad Request', message: 'spaceAddress parameter is required' })
	}

	// Validate spaceAddress format using the helper function
	if (!isValidEthereumAddress(spaceAddress)) {
		logger.error({ spaceAddress }, 'Invalid spaceAddress format')
		return reply
			.code(400)
			.send({ error: 'Bad Request', message: 'Invalid spaceAddress format' })
	}

	const dummyJson = {
		name: '....',
		description: '....',
		members: 99999,
		fees: '0.001 eth',
		image: `${serverUrl}/space/${spaceAddress}/image`,
	}

	return reply.header('Content-Type', 'application/json').send(dummyJson)
}

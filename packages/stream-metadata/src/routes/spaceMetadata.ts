import { FastifyRequest, FastifyReply } from 'fastify'
import { SpaceInfo } from '@river-build/web3'

import { isValidEthereumAddress } from '../validators'
import { getFunctionLogger } from '../logger'
import { getSpaceDapp } from '../contract-utils'

export async function fetchSpaceMetadata(
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

	const spaceDapp = getSpaceDapp()
	let spaceContractInfo: SpaceInfo | undefined
	try {
		spaceContractInfo = await spaceDapp.getSpaceInfo(spaceAddress)
	} catch (error) {
		logger.error({ spaceAddress, error }, 'Failed to fetch space contract info')
		return reply
			.code(404)
			.send({ error: 'Not Found', message: 'Failed to fetch space contract info' })
	}

	if (!spaceContractInfo) {
		logger.error({ spaceAddress }, 'Space contract not found')
		return reply.code(404).send({ error: 'Not Found', message: 'Space contract not found' })
	}

	const metadata = {
		name: spaceContractInfo.name,
		longDescription: spaceContractInfo.longDescription,
		shortDescription: spaceContractInfo.shortDescription,
		image: `${serverUrl}/space/${spaceAddress}/image`,
	}

	return reply.header('Content-Type', 'application/json').send(metadata)
}

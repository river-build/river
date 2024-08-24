import { FastifyRequest, FastifyReply } from 'fastify'
import { SpaceInfo } from '@river-build/web3'

import { isValidEthereumAddress } from '../validators'
import { getFunctionLogger } from '../logger'
import { getSpaceDapp } from '../contract-utils'
import { config } from '../environment'

export async function fetchSpaceMetadata(request: FastifyRequest, reply: FastifyReply) {
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
		image: getImageUrl(spaceContractInfo.uri, spaceAddress),
	}

	return reply.header('Content-Type', 'application/json').send(metadata)
}

function getImageUrl(contractUri: string, spaceAddress: string) {
	const isDefaultPort =
		config.riverStreamMetadataHostUrl.port === '' ||
		config.riverStreamMetadataHostUrl.port === '80' ||
		config.riverStreamMetadataHostUrl.port === '443'

	// Check if contractUri is empty or starts with the config.riverStreamMetadataHostUrl
	if (
		contractUri === '' ||
		contractUri.startsWith(config.riverStreamMetadataHostUrl.toString())
	) {
		// Start building the base URL
		let baseUrl = `${config.riverStreamMetadataHostUrl.origin}/space/${spaceAddress}/image`

		// If config has a port that is not 80 or 443, and riverStreamMetadataHostUrl
		// has the default port, add the config port to the URL
		if (config.port !== 80 && config.port !== 443 && isDefaultPort) {
			baseUrl = `${config.riverStreamMetadataHostUrl.protocol}//${config.riverStreamMetadataHostUrl.hostname}:${config.port}/space/${spaceAddress}/image`
		}

		return baseUrl
	}

	// If the contractUri doesn't meet the conditions, return it as is
	return contractUri
}

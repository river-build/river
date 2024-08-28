import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { StreamPrefix, StreamStateView, makeStreamId } from '@river-build/sdk'
import { ChunkedMedia } from '@river-build/proto'
import { SpaceInfo } from '@river-build/web3'
import { z } from 'zod'

import { config } from '../environment'
import { getSpaceImage } from './spaceImage'
import { getStream } from '../riverStreamRpcClient'
import { isValidEthereumAddress } from '../validators'
import { spaceDapp } from '../contract-utils'

const paramsSchema = z.object({
	spaceAddress: z.string().min(1, 'spaceAddress parameter is required'),
})

export interface SpaceMetadataResponse {
	name: string
	description: string
	image: string | undefined
}

export async function fetchSpaceMetadata(request: FastifyRequest, reply: FastifyReply) {
	const logger = request.log.child({ name: fetchSpaceMetadata.name })

	const parseResult = paramsSchema.safeParse(request.params)

	if (!parseResult.success) {
		const errorMessage = parseResult.error.errors[0]?.message || 'Invalid parameters'
		logger.info(errorMessage)
		return reply.code(400).send({ error: 'Bad Request', message: errorMessage })
	}

	const { spaceAddress } = parseResult.data

	// Validate spaceAddress format using the helper function
	if (!isValidEthereumAddress(spaceAddress)) {
		logger.error({ spaceAddress }, 'Invalid spaceAddress format')
		return reply
			.code(400)
			.send({ error: 'Bad Request', message: 'Invalid spaceAddress format' })
	}

	let spaceInfo: SpaceInfo | undefined
	try {
		spaceInfo = await spaceDapp.getSpaceInfo(spaceAddress)
	} catch (error) {
		logger.error({ spaceAddress, error }, 'Failed to fetch space contract info')
		return reply
			.code(404)
			.send({ error: 'Not Found', message: 'Failed to fetch space contract info' })
	}

	if (!spaceInfo) {
		logger.error({ spaceAddress }, 'Space contract not found')
		return reply.code(404).send({ error: 'Not Found', message: 'Space contract not found' })
	}

	const spaceMetadata: SpaceMetadataResponse = {
		name: spaceInfo.name,
		description: getSpaceDecription(spaceInfo),
		image: await getImageUrl(logger, spaceInfo.uri, spaceAddress),
	}

	return reply.header('Content-Type', 'application/json').send(spaceMetadata)
}

function getSpaceDecription({ shortDescription, longDescription }: SpaceInfo): string {
	if (shortDescription && longDescription) {
		return `${shortDescription}\n\n${longDescription}`
	}

	if (shortDescription) {
		return shortDescription
	}

	return longDescription || ''
}

async function getImageUrl(logger: FastifyBaseLogger, contractUri: string, spaceAddress: string) {
	const hasSpaceImageExist = await hasSpaceImage(logger, spaceAddress)
	if (!hasSpaceImageExist) {
		return undefined
	}

	const isDefaultPort =
		config.riverStreamMetadataBaseUrl.port === '' ||
		config.riverStreamMetadataBaseUrl.port === '80' ||
		config.riverStreamMetadataBaseUrl.port === '443'

	// Check if contractUri is empty or starts with the config.riverStreamMetadataHostUrl
	if (
		contractUri === '' ||
		contractUri.startsWith(config.riverStreamMetadataBaseUrl.toString())
	) {
		// Start building the base URL
		let baseUrl = `${config.riverStreamMetadataBaseUrl.origin}/space/${spaceAddress}/image`

		// If config has a port that is not 80 or 443, and riverStreamMetadataHostUrl
		// has the default port, add the config port to the URL
		if (config.port !== 80 && config.port !== 443 && isDefaultPort) {
			baseUrl = `${config.riverStreamMetadataBaseUrl.protocol}//${config.riverStreamMetadataBaseUrl.hostname}:${config.port}/space/${spaceAddress}/image`
		}

		return baseUrl
	}

	// If the contractUri doesn't meet the conditions, return it as is
	return contractUri
}

async function hasSpaceImage(logger: FastifyBaseLogger, spaceAddress: string): Promise<boolean> {
	let stream: StreamStateView | undefined
	try {
		const streamId = makeStreamId(StreamPrefix.Space, spaceAddress)
		stream = await getStream(logger, streamId)
	} catch (error) {
		logger.error(
			{
				error,
				spaceAddress,
			},
			'Failed to get stream',
		)
		return false
	}

	if (!stream) {
		return false
	}

	// get the image metatdata from the stream
	let spaceImage: ChunkedMedia | undefined
	try {
		spaceImage = await getSpaceImage(stream)
	} catch (error) {
		return false
	}
	return spaceImage !== undefined
}

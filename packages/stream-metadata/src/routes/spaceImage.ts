import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { ChunkedMedia } from '@river-build/proto'
import { StreamPrefix, StreamStateView, makeStreamId } from '@river-build/sdk'
import { z } from 'zod'
import { bin_toHexString } from '@river-build/dlog'

import { config } from '../environment'
import { getStream } from '../riverStreamRpcClient'
import { isValidEthereumAddress } from '../validators'
import { getMediaEncryption } from '../media-encryption'

const paramsSchema = z.object({
	spaceAddress: z
		.string()
		.min(1, 'spaceAddress parameter is required')
		.refine(isValidEthereumAddress, {
			message: 'Invalid spaceAddress format',
		}),
})

async function getSpaceImage(streamView: StreamStateView): Promise<ChunkedMedia | undefined> {
	if (streamView.contentKind !== 'spaceContent') {
		return undefined
	}
	return streamView.spaceContent.getSpaceImage()
}

async function getResponse(request: FastifyRequest, logger: FastifyBaseLogger) {
	const parseResult = paramsSchema.safeParse(request.params)

	if (!parseResult.success) {
		const errorMessage = parseResult.error.errors[0]?.message || 'Invalid parameters'
		logger.info(errorMessage)
		return { error: 'Bad Request', message: errorMessage, code: 400 } as const
	}

	const { spaceAddress } = parseResult.data
	logger.info({ spaceAddress }, 'Fetching space image')

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
		return { error: 'Stream not found', code: 404 } as const
	}

	if (!stream) {
		return { error: 'Stream not found', code: 404 } as const
	}

	// get the image metatdata from the stream
	const spaceImage = await getSpaceImage(stream)
	if (!spaceImage) {
		return { error: 'spaceImage not found', code: 404 } as const
	}

	try {
		const { key, iv } = getMediaEncryption(logger, spaceImage)
		if (key?.length === 0 || iv?.length === 0) {
			logger.error(
				{
					key: key?.length === 0 ? 'has key' : 'no key',
					iv: iv?.length === 0 ? 'has iv' : 'no iv',
					spaceAddress,
					mediaStreamId: spaceImage.streamId,
				},
				'Invalid key or iv',
			)
			return { error: 'Failed to get encryption key or iv', code: 422 } as const
		}
		const redirectUrl = `${config.streamMetadataBaseUrl}/media/${
			spaceImage.streamId
		}?key=${bin_toHexString(key)}&iv=${bin_toHexString(iv)}`

		return {
			redirectUrl,
			code: 307,
		} as const
	} catch (error) {
		logger.error(
			{
				error,
				spaceAddress,
				mediaStreamId: spaceImage.streamId,
			},
			'Failed to get encryption key or iv',
		)
		return { error: 'Failed to get encryption key or iv', code: 500 } as const
	}
}

const SPACE_IMAGE_CACHE_CONTROL = 'public, max-age=30, s-maxage=300'

export async function fetchSpaceImage(request: FastifyRequest, reply: FastifyReply) {
	const logger = request.log.child({ name: fetchSpaceImage.name })
	const response = await getResponse(request, logger)
	if (response.code === 307) {
		return reply
			.header('Cache-Control', SPACE_IMAGE_CACHE_CONTROL)
			.redirect(response.redirectUrl, 307)
	} else {
		return reply
			.code(response.code)
			.header('Cache-Control', SPACE_IMAGE_CACHE_CONTROL)
			.send(response)
	}
}

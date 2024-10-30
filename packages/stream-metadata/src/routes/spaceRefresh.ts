import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { isValidEthereumAddress } from '../validators'
import { CloudfrontManager } from '../aws'
import { refreshOpenSea } from '../opensea'
import { HEADER_INVALIDATION_ID } from '../constants'

const paramsSchema = z.object({
	spaceAddress: z
		.string()
		.min(1, 'spaceAddress parameter is required')
		.refine(isValidEthereumAddress, {
			message: 'Invalid spaceAddress format',
		}),
})

const querySchema = z.object({
	target: z.enum(['image', 'metadata', 'all']).default('all'),
})

// This route handler validates the refresh request and quickly returns a 200 response.
export async function spaceRefresh(request: FastifyRequest, reply: FastifyReply) {
	const logger = request.log.child({ name: spaceRefresh.name })

	const parseResult = paramsSchema.safeParse(request.params)
	if (!parseResult.success) {
		const errorMessage = parseResult.error.errors[0]?.message || 'Invalid parameters'
		logger.info(errorMessage)
		return reply.code(400).send({ error: 'Bad Request', message: errorMessage })
	}

	const queryParseResult = querySchema.safeParse(request.query)
	if (!queryParseResult.success) {
		const errorMessage = queryParseResult.error.errors[0]?.message || 'Invalid query parameters'
		logger.info(errorMessage)
		return reply.code(400).send({ error: 'Bad Request', message: errorMessage })
	}

	const { spaceAddress } = parseResult.data
	const { target } = queryParseResult.data

	const paths =
		target === 'metadata'
			? [`/space/${spaceAddress}`, `/space/${spaceAddress}/token/*`]
			: target === 'image'
			? [`/space/${spaceAddress}/image*`]
			: [`/space/${spaceAddress}*`]

	try {
		logger.info({ spaceAddress }, 'Refreshing space')
		const invalidationId = await CloudfrontManager.createCloudfrontInvalidation({
			paths,
			logger,
		}).then((invalidation) => invalidation?.Invalidation?.Id)

		return reply
			.code(200)
			.header(HEADER_INVALIDATION_ID, invalidationId)
			.send({ ok: true, invalidationId })
	} catch (error) {
		logger.error({ err: error }, 'Failed to create CloudFront invalidation')
		return reply.code(200).send({ ok: false })
	}
}

// This onResponse hook does the actual heavy lifting of waiting for the CloudFront cache invalidation to complete and then refreshing OpenSea.
export async function spaceRefreshOnResponse(
	request: FastifyRequest,
	reply: FastifyReply,
	done: () => void,
) {
	const logger = request.log.child({ name: spaceRefreshOnResponse.name })
	const { spaceAddress } = paramsSchema.parse(request.params)
	try {
		const invalidationId = z.string().parse(reply.getHeader(HEADER_INVALIDATION_ID))
		await CloudfrontManager.waitForInvalidation({ invalidationId, logger })
		await refreshOpenSea({ spaceAddress, logger })
	} catch (error) {
		logger.error(
			{
				err: error,
				spaceAddress,
			},
			'Failed to refresh space',
		)
	}

	done()
}

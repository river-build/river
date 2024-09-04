import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { isValidEthereumAddress } from '../validators'
import { config } from '../environment'
import { cloudFront } from '../aws'

const paramsSchema = z.object({
	spaceAddress: z
		.string()
		.min(1, 'spaceAddress parameter is required')
		.refine(isValidEthereumAddress, {
			message: 'Invalid spaceAddress format',
		}),
})

export async function spaceRefresh(request: FastifyRequest, reply: FastifyReply) {
	const logger = request.log.child({ name: spaceRefresh.name })

	const parseResult = paramsSchema.safeParse(request.params)

	if (!parseResult.success) {
		const errorMessage = parseResult.error.errors[0]?.message || 'Invalid parameters'
		logger.info(errorMessage)
		return reply.code(400).send({ error: 'Bad Request', message: errorMessage })
	}

	const { spaceAddress } = parseResult.data
	logger.info({ spaceAddress }, 'Refreshing space')

	try {
		const path = `/space/${spaceAddress}/image`

		// Refresh CloudFront cache
		await cloudFront.createInvalidation({
			DistributionId: config.aws.cloudfrontDistributionId,
			InvalidationBatch: {
				CallerReference: `space-refresh-${spaceAddress}-${Date.now()}`,
				Paths: {
					Quantity: 1,
					Items: [path],
				},
			},
		})
		logger.info({ path }, 'CloudFront cache invalidated')

		// TODO: Implement OpenSea cache refresh

		return reply.code(200).send({ ok: true })
	} catch (error) {
		logger.error(
			{
				error,
			},
			'Failed to refresh space',
		)
		return reply.code(500).send('Failed to refresh space')
	}
}

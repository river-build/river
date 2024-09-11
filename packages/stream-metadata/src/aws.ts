import { CloudFront } from '@aws-sdk/client-cloudfront'
import { FastifyBaseLogger } from 'fastify'

import { config } from './environment'

export const createCloudfrontInvalidation = async (params: {
	path: string
	logger: FastifyBaseLogger
}) => {
	if (!config.cloudfront) {
		params.logger.warn(
			{
				path: params.path,
			},
			'CloudFront distribution ID not set, skipping cache invalidation',
		)
		return
	}

	const cloudFront = new CloudFront({
		serviceId: 'stream-metadata',
		logger: params.logger,
	})

	const invalidation = await cloudFront.createInvalidation({
		DistributionId: config.cloudfront.distributionId,
		InvalidationBatch: {
			CallerReference: `${new Date().toISOString()}-${params.path.substring(0, 5)}`,
			Paths: {
				Quantity: 1,
				Items: [params.path],
			},
		},
	})

	params.logger.info({ path: params.path, invalidation }, 'CloudFront cache invalidation created')
}

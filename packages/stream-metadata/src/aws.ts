import { CloudFront } from '@aws-sdk/client-cloudfront'
import { FastifyBaseLogger } from 'fastify'

import { config } from './environment'

export const createCloudfrontInvalidation = async (params: {
	path: string
	logger: FastifyBaseLogger
	waitUntilFinished?: boolean
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

	const invalidationCommand = await cloudFront?.createInvalidation({
		DistributionId: config.cloudfront.distributionId,
		InvalidationBatch: {
			CallerReference: `${new Date().toISOString()}-${params.path.substring(0, 5)}`,
			Paths: {
				Quantity: 1,
				Items: [params.path],
			},
		},
	})

	params.logger.info({ path: params.path }, 'CloudFront cache invalidation created')

	if (params.waitUntilFinished) {
		let attempts = 0
		let currentInvalidationCommand = invalidationCommand
		while (currentInvalidationCommand.Invalidation?.Status !== 'Completed') {
			attempts += 1
			if (attempts >= config.cloudfront.invalidationConfirmationMaxAttempts) {
				params.logger.error(
					{
						invalidation: currentInvalidationCommand,
						path: params.path,
					},
					'CloudFront cache invalidation did not complete in time',
				)
				throw new Error('CloudFront cache invalidation did not complete in time')
			}
			params.logger.info(
				{
					invalidation: currentInvalidationCommand,
					path: params.path,
				},
				'Waiting for CloudFront cache invalidation to complete...',
			)
			if (!currentInvalidationCommand.Invalidation) {
				throw new Error('Invalidation not found')
			}
			await new Promise((resolve) => setTimeout(resolve, 1000))
			currentInvalidationCommand = await cloudFront.getInvalidation({
				DistributionId: config.cloudfront.distributionId,
				Id: currentInvalidationCommand.Invalidation.Id,
			})
		}
		params.logger.info({ path: params.path }, 'CloudFront cache invalidation completed')
	}
}

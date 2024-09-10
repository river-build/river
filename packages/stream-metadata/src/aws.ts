import { CloudFront, GetInvalidationCommandOutput } from '@aws-sdk/client-cloudfront'
import { FastifyBaseLogger } from 'fastify'

import { config } from './environment'

export class CloudfrontManager {
	private readonly cloudFront: CloudFront

	constructor(
		private readonly logger: FastifyBaseLogger,
		private readonly distributionId: string,
		private readonly invalidationConfirmationMaxAttempts: number,
		private readonly invalidationConfirmationWait: number,
	) {
		this.cloudFront = new CloudFront({
			serviceId: 'stream-metadata',
			logger: this.logger,
		})
	}

	private async invalidate(params: { path: string; waitUntilFinished?: boolean }) {
		const invalidationCommand = await this.cloudFront.createInvalidation({
			DistributionId: this.distributionId,
			InvalidationBatch: {
				CallerReference: `${new Date().toISOString()}-${params.path.substring(0, 5)}`,
				Paths: {
					Quantity: 1,
					Items: [params.path],
				},
			},
		})

		this.logger.info({ path: params.path }, 'CloudFront cache invalidation created')

		if (params.waitUntilFinished) {
			await this.waitForInvalidation(invalidationCommand, params.path)
		}
	}

	private async waitForInvalidation(
		invalidationCommand: GetInvalidationCommandOutput,
		path: string,
	) {
		let attempts = 0
		let currentInvalidationCommand = invalidationCommand
		while (currentInvalidationCommand.Invalidation?.Status !== 'Completed') {
			attempts += 1
			if (attempts >= this.invalidationConfirmationMaxAttempts) {
				this.logger.error(
					{
						invalidation: currentInvalidationCommand,
						path,
					},
					'CloudFront cache invalidation did not complete in time',
				)
				throw new Error('CloudFront cache invalidation did not complete in time')
			}
			this.logger.info(
				{
					invalidation: currentInvalidationCommand,
					path,
				},
				'Waiting for CloudFront cache invalidation to complete...',
			)
			if (!currentInvalidationCommand.Invalidation) {
				throw new Error('Invalidation not found')
			}
			await new Promise((resolve) => setTimeout(resolve, this.invalidationConfirmationWait))
			currentInvalidationCommand = await this.cloudFront.getInvalidation({
				DistributionId: this.distributionId,
				Id: currentInvalidationCommand.Invalidation.Id,
			})
		}
		this.logger.info(
			{
				invalidation: currentInvalidationCommand,
				path,
			},
			'CloudFront cache invalidation completed',
		)
	}

	static async createCloudfrontInvalidation(params: {
		path: string
		logger: FastifyBaseLogger
		waitUntilFinished?: boolean
	}) {
		if (!config.cloudfront) {
			params.logger.warn(
				{
					path: params.path,
				},
				'CloudFront distribution ID not set, skipping cache invalidation',
			)
			return
		}

		const cloudfrontManager = new CloudfrontManager(
			params.logger,
			config.cloudfront.distributionId,
			config.cloudfront.invalidationConfirmationMaxAttempts,
			config.cloudfront.invalidationConfirmationWait,
		)

		return cloudfrontManager.invalidate(params)
	}
}

import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { BigNumber } from 'ethers'

import { isValidEthereumAddress } from '../validators'
import { config } from '../environment'
import { cloudFront } from '../aws'
import { spaceDapp } from '../contract-utils'

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
		await cloudFront?.createInvalidation({
			DistributionId: config.aws?.CLOUDFRONT_DISTRIBUTION_ID,
			InvalidationBatch: {
				CallerReference: `space-refresh-${spaceAddress}-${Date.now()}`,
				Paths: {
					Quantity: 1,
					Items: [path],
				},
			},
		})
		logger.info({ path }, 'CloudFront cache invalidated')

		await refreshOpenSea(spaceAddress)
		logger.info({ path }, 'OpenSea cache invalidated')

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

const refreshOpenSea = async (spaceAddress: string) => {
	const space = await spaceDapp.getSpaceInfo(spaceAddress)
	if (!space) {
		throw new Error('Space not found')
	}

	const tokenId = BigNumber.from(space.tokenId).toString()
	let chain
	if (space.networkId === '1') {
		chain = 'base'
	} else if (space.networkId === '84532') {
		chain = 'base_sepolia'
	} else {
		throw new Error('Unsupported network')
	}

	const url = `https://api.opensea.io/api/v2/chain/${chain}/contract/${spaceAddress}/nfts/${tokenId}/refresh`
	const response = await fetch(url)

	return { ok: response.ok }
}

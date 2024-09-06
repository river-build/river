import { FastifyReply, FastifyRequest, type FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { BigNumber } from 'ethers'
import { BASE_MAINNET, BASE_SEPOLIA } from '@river-build/web3'

import { isValidEthereumAddress } from '../validators'
import { config } from '../environment'
import { createCloudfrontInvalidation } from '../aws'
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
		await createCloudfrontInvalidation({ path, logger })

		const openseaStatus = await refreshOpenSea(logger, spaceAddress)
		if (!openseaStatus) {
			return reply.code(500).send({ error: 'Failed to refresh space' })
		}

		return reply.code(openseaStatus.status).send({ ok: openseaStatus.ok })
	} catch (error) {
		logger.error(
			{
				error,
			},
			'Failed to refresh space',
		)
		return reply.code(500).send({ error: 'Failed to refresh space' })
	}
}

const refreshOpenSea = async (logger: FastifyBaseLogger, spaceAddress: string) => {
	if (!config.openSeaApiKey) {
		return
	}

	const space = await spaceDapp.getSpaceInfo(spaceAddress)
	if (!space) {
		throw new Error('Space not found')
	}

	const tokenId = BigNumber.from(space.tokenId).toString()
	let chain
	let url
	if (space.networkId === String(BASE_MAINNET)) {
		chain = 'base'
		url = `https://api.opensea.io/api/v2/chain/${chain}/contract/${spaceAddress}/nfts/${tokenId}/refresh`
	} else if (space.networkId === String(BASE_SEPOLIA)) {
		chain = 'base_sepolia'
		url = `https://testnets-api.opensea.io/api/v2/chain/${chain}/contract/${spaceAddress}/nfts/${tokenId}/refresh`
	} else {
		throw new Error('Unsupported network')
	}

	logger.info({ url }, 'refreshing openSea')
	const status = await fetch(url, {
		method: 'POST',
		headers: {
			'x-api-key': config.openSeaApiKey,
		},
	}).then((response) => {
		if (!response.ok) {
			return { ok: false, status: response.status }
		}
		return { ok: true, status: response.status }
	})

	return status
}

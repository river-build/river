import { BASE_MAINNET, BASE_SEPOLIA, type SpaceInfo } from '@river-build/web3'
import { BigNumber } from 'ethers'
import { FastifyBaseLogger } from 'fastify'

import { config } from './environment'
import { spaceDapp } from './contract-utils'

type GetNFTs = {
	nfts: { identifier: string }[]
	next?: string
}

const getAllMemberTokenIds = async (
	logger: FastifyBaseLogger,
	space: SpaceInfo,
	next?: string,
): Promise<string[]> => {
	if (!config.openSea?.apiKey) {
		return []
	}
	const limit = 200
	const chainId = config.web3Config.base.chainId

	const getUrl = (nextCursor?: string) => {
		const baseUrl =
			chainId === BASE_MAINNET
				? 'https://api.opensea.io/api/v2/chain/base'
				: chainId === BASE_SEPOLIA
				? 'https://testnets-api.opensea.io/api/v2/chain/base_sepolia'
				: null

		if (!baseUrl) {
			throw new Error(`Unsupported network ${chainId}`)
		}
		return `${baseUrl}/contract/${space.address}/nfts?limit=${limit}${
			nextCursor ? `&next=${nextCursor}` : ''
		}`
	}

	const fetchNFTs = async (nextCursor?: string): Promise<GetNFTs> => {
		const response = await fetch(getUrl(nextCursor), {
			headers: { 'x-api-key': config.openSea!.apiKey },
		})
		if (!response.ok) {
			logger.error({ response }, 'OpenSea API request failed')
			throw new Error(`OpenSea API request failed: ${response.status} ${response.statusText}`)
		}
		return response.json() as Promise<GetNFTs>
	}

	const reducer = async (acc: string[], nextCursor?: string): Promise<string[]> => {
		try {
			const data = await fetchNFTs(nextCursor)
			const ids = [...acc, ...data.nfts.map((nft) => nft.identifier)]
			return data.next ? await reducer(ids, data.next) : ids
		} catch (error) {
			logger.error({ error }, 'Failed to get member token id')
			return []
		}
	}

	return reducer([], next)
}

const refreshMemberNft = async (logger: FastifyBaseLogger, space: SpaceInfo, tokenId: string) => {
	const url = getRefreshNftUrl(logger, space.address, tokenId)
	logger.info({ url, spaceAddress: space.address, tokenId }, 'refreshing openSea')
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'x-api-key': config.openSea!.apiKey,
		},
	})
	if (!response.ok) {
		logger.error(
			{
				status: response.status,
				statusText: response.statusText,
				nft: space.address,
				tokenId,
			},
			'Failed to refresh space owner NFT',
		)
		throw new Error('Failed to refresh member NFT')
	}
}

const refreshSpaceOwnerNft = async (logger: FastifyBaseLogger, space: SpaceInfo) => {
	const spaceOwnerAddress = config.web3Config.base.addresses.spaceOwner
	const url = getRefreshNftUrl(
		logger,
		spaceOwnerAddress,
		BigNumber.from(space.tokenId).toString(),
	)
	logger.info({ url, spaceAddress: space.address }, 'refreshing openSea')
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'x-api-key': config.openSea!.apiKey,
		},
	})
	if (!response.ok) {
		logger.error(
			{
				status: response.status,
				statusText: response.statusText,
				nftAddress: spaceOwnerAddress,
				tokenId: space.tokenId,
			},
			'Failed to refresh space owner NFT',
		)
		throw new Error('Failed to refresh space owner NFT')
	}
}

const getRefreshNftUrl = (logger: FastifyBaseLogger, nftAddress: string, tokenId: string) => {
	const chainId = config.web3Config.base.chainId

	if (chainId === BASE_MAINNET) {
		return `https://api.opensea.io/api/v2/chain/base/contract/${nftAddress}/nfts/${tokenId}/refresh`
	} else if (chainId === BASE_SEPOLIA) {
		return `https://testnets-api.opensea.io/api/v2/chain/base_sepolia/contract/${nftAddress}/nfts/${tokenId}/refresh`
	} else if (chainId === 31337) {
		return `https://testnets-api.opensea.io/api/v2/chain/base_sepolia/contract/${nftAddress}/nfts/${tokenId}/refresh`
	} else {
		logger.error({ chainId }, 'Unsupported network')
		throw new Error(`Unsupported network ${chainId}`)
	}
}

export const refreshOpenSea = async ({
	logger,
	spaceAddress,
}: {
	logger: FastifyBaseLogger
	spaceAddress: string
}) => {
	const { openSea } = config
	if (!openSea) {
		logger.warn(
			{
				spaceAddress,
			},
			'OpenSea API key not set, skipping OpenSea refresh',
		)
		return
	}

	const space = await spaceDapp.getSpaceInfo(spaceAddress)
	if (!space) {
		throw new Error('Space not found')
	}

	const allMemberTokenIds = await getAllMemberTokenIds(logger, space)
	const promises = [
		refreshSpaceOwnerNft(logger, space),
		...allMemberTokenIds.map((tokenId) => refreshMemberNft(logger, space, tokenId)),
	]

	const refreshTask = () => Promise.allSettled(promises)

	await refreshTask()
	logger.info({ spaceAddress }, 'OpenSea refreshed')

	setTimeout(() => {
		/**
		 * We re-refresh opensea after the first refresh, because opensea itself has a cloudfront cache,
		 * and image uploads in quick succession don't trigger a cache refresh on their end.
		 * This is a workaround for cases where a user may update a space image multiple times
		 * in quick succession.
		 */

		refreshTask()
			.then(() => {
				logger.info({ spaceAddress }, 'OpenSea refreshed again')
			})
			.catch((error: unknown) => {
				logger.error(
					{
						error,
						spaceAddress,
					},
					'Failed to refresh OpenSea',
				)
			})
	}, openSea.refreshDelay)
}

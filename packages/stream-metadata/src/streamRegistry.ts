import { BigNumber } from 'ethers'
import { Config, StreamIdHex } from './types'
import { getRiverRegistry } from './evmRpcClient'

type CachedStreamData = {
	url: string
	lastMiniblockNum: BigNumber
	expiration: number
}

const cache: Record<string, CachedStreamData> = {}

// TODO: remove this entire file
export async function getNodeForStream(
	config: Config,
	streamId: StreamIdHex,
): Promise<{ url: string; lastMiniblockNum: BigNumber }> {
	console.log('getNodeForStream', streamId)

	const now = Date.now()
	const cachedData = cache[streamId]

	// Check if the cached data is still valid
	if (cachedData && cachedData.expiration > now) {
		return { url: cachedData.url, lastMiniblockNum: cachedData.lastMiniblockNum }
	}

	const riverRegistry = getRiverRegistry(config)

	console.log('getNodeForStream', {
		streamId,
		riverRegistryAddress: riverRegistry.config.addresses.riverRegistry,
	})

	const streamData = await riverRegistry.streamRegistry.read.getStream(streamId)

	if (streamData.nodes.length === 0) {
		const err = new Error(`No nodes found for stream ${streamId}`)
		logger.error(`No nodes found for stream`, {
			streamId,
			err,
		})

		throw err
	}

	const lastMiniblockNum = streamData.lastMiniblockNum

	const randomIndex = Math.floor(Math.random() * streamData.nodes.length)
	const node = await riverRegistry.nodeRegistry.read.getNode(streamData.nodes[randomIndex])

	logger.info(`connected to node`, {
		streamId,
		nodeUrl: node.url,
		lastMiniblockNum,
	})

	// Cache the result with a 15-minute expiration
	cache[streamId] = {
		url: node.url,
		lastMiniblockNum,
		expiration: now + 15 * 60 * 1000, // 15 minutes in milliseconds
	}

	return { url: node.url, lastMiniblockNum }
}

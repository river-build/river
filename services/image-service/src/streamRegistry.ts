import { getChainInfo } from './environment';

import { StreamIdHex } from './types';
import { getAbi, getAddress } from './contracts/contracts';
import { getContract } from 'viem';
import { getPublicClient } from './evmRpcClient';

type CachedStreamData = {
	url: string;
	lastMiniblockNum: bigint;
	expiration: number;
};

const cache: Record<string, CachedStreamData> = {};

export async function getNodeForStream(streamId: StreamIdHex, chainId?: number): Promise<{ url: string; lastMiniblockNum: bigint }> {
	console.log('getNodeForStream', streamId, chainId);

	const now = Date.now();
	const cachedData = cache[streamId];

	// Check if the cached data is still valid
	if (cachedData && cachedData.expiration > now) {
		return { url: cachedData.url, lastMiniblockNum: cachedData.lastMiniblockNum };
	}

	const riverRegistry = getAddress(chainId);
	if (!riverRegistry) {
		console.error('Registry address not found');
		throw new Error(`Registry address not found`);
	}

	console.log('streamId', streamId, 'riverRegistryAddress', riverRegistry);

	const streamRegistry = getContract({
		address: riverRegistry,
		abi: getAbi(chainId).StreamRegistry,
		client: getPublicClient(chainId),
	});

	const nodeRegistry = getContract({
		address: riverRegistry,
		abi: getAbi(chainId).NodeRegistry,
		client: getPublicClient(chainId),
	});

	const streamData = await streamRegistry.read.getStream([streamId]);

	const lastMiniblockNum = streamData.lastMiniblockNum;

	// todo: pick a random node from the list
	const node = await nodeRegistry.read.getNode([streamData.nodes[0]]);

	console.log(`connected to node=${node.url}; lastMiniblockNum=${lastMiniblockNum}`);

	// Cache the result with a 15-minute expiration
	cache[streamId] = {
		url: node.url,
		lastMiniblockNum,
		expiration: now + 15 * 60 * 1000, // 15 minutes in milliseconds
	};

	return { url: node.url, lastMiniblockNum };
}

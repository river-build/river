import { DEFAULT_CHAIN_ID, getChainInfo } from './environment';
import { ethers } from 'ethers';
import { createPublicClient, http } from 'viem';
import { riverChainDevnet, riverChainLocalhost, riverChainProduction } from './evmChainConfig';

import { JsonRpcProvider } from 'ethers/providers';

const provider: Record<number, JsonRpcProvider> = {};
const publicClient: Record<number, ReturnType<typeof createPublicClientFromChainId>> = {};

function createPublicClientFromChainId(chainId: number) {
	let riverChainUrl: string;

	switch (chainId) {
		case 550:
			riverChainUrl = riverChainProduction.rpcUrls.default.http[0]
			return createPublicClient({
				chain: riverChainProduction,
				transport: http(riverChainUrl),
			});
		case 6524490:
			riverChainUrl = riverChainDevnet.rpcUrls.default.http[0]
			return createPublicClient({
				chain: riverChainDevnet,
				transport: http(riverChainUrl),
			});
		case 31338:
			riverChainUrl = riverChainLocalhost.rpcUrls.default.http[0]
			return createPublicClient({
				chain: riverChainLocalhost,
				transport: http(riverChainUrl)
			});
		default:
			throw new Error(`Unsupported chain ${chainId}`);
	}
}

function getProvider(chainId: number = DEFAULT_CHAIN_ID) {
	if (!provider[chainId]) {
		const chainInfo = getChainInfo(chainId);
		if (!chainInfo) {
			throw new Error('Chain info not found');
		}
		provider[chainId] = new ethers.providers.JsonRpcProvider(chainInfo.riverChainUrl);
	}
	return provider[chainId];
}

export function getPublicClient(chainId: number = DEFAULT_CHAIN_ID) {
	if (!publicClient[chainId]) {
		publicClient[chainId] = createPublicClientFromChainId(chainId);
	}
	return publicClient[chainId];
}

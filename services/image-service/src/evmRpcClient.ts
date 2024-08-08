import { DEFAULT_CHAIN_ID, getChainInfo } from './environment';
import { Signer, ethers } from 'ethers';
import { createPublicClient, defineChain, http } from 'viem';

import { JsonRpcProvider } from 'ethers/providers';
import { mainnet } from 'viem/chains';
import { makeSignerContext } from '@river-build/sdk';

type ChainType = ReturnType<typeof defineChain>;

const wallet = ethers.Wallet.createRandom();
const provider: Record<number, JsonRpcProvider> = {};
const publicClient: Record<number, ReturnType<typeof createPublicClientFromChainId>> = {};
let localhostChain: ChainType

function getLocalhostChain() {
	if (!localhostChain) {
		const riverChainUrl = getChainInfo(31338)?.riverChainUrl ?? 'https://127.0.0.1:8546';
		localhostChain = defineChain({
				id: 31338,
				name: 'Localhost',
				nativeCurrency: {
					decimals: 18,
					name: 'Ether',
					symbol: 'ETH',
				},
				rpcUrls: {
					default: { http: [riverChainUrl] },
				}
		});
	}

	return localhostChain;
}

function createPublicClientFromChainId(chainId: number) {
	const chainInfo = getChainInfo(chainId);
	if (!chainInfo) {
		throw new Error('Chain info not found');
	}

	const riverChainUrl = chainInfo.riverChainUrl;

	console.log(`createPublicClientFromConfig: riverChainUrl=${riverChainUrl}; chainInfo=`, chainInfo);

	switch (chainId) {
		case 550:
			return createPublicClient({
				chain: mainnet,
				transport: http(riverChainUrl),
			});
		case 31338:
			return createPublicClient({
				chain: getLocalhostChain(),
				transport: http(riverChainUrl),
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

export async function getSignerContext(chainId: number = DEFAULT_CHAIN_ID) {
	const signer: Signer = getProvider(chainId).getSigner(wallet.address);
	return makeSignerContext(signer as any, wallet as any);
}

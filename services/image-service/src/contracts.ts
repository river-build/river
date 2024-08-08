import { DEFAULT_CHAIN_ID, getChainInfo } from './environment';

import { Address } from './types';
import NodeRegistryAbi from '@river-build/generated/dev/abis/NodeRegistry.abi';
import StreamRegistryAbi from '@river-build/generated/dev/abis/StreamRegistry.abi';

export function getAbi(chainId: number = DEFAULT_CHAIN_ID) {
	const chainInfo = getChainInfo(chainId);
	if (!chainInfo) {
		throw new Error(`Unsupported chain ${chainId}`);
	}
		return {
			NodeRegistry: NodeRegistryAbi,
			StreamRegistry: StreamRegistryAbi,
		};
}

export function getAddress(chainId: number = DEFAULT_CHAIN_ID): Address {
	const riverRegistry = getChainInfo(chainId)?.riverRegistry;
	if (!riverRegistry) {
			throw new Error(`Unsupported chain ${chainId}`);
	}
	return riverRegistry as Address;
}

import { DEFAULT_CHAIN_ID } from '../environment';
import { Address } from '../types';
import NodeRegistryAbi_31338 from './abis/31338/NodeRegistry.abi';
import StreamRegistryAbi_31338 from './abis/31338/StreamRegistry.abi';
import NodeRegistryAbi_8543 from './abis/8543/NodeRegistry.abi';
import StreamRegistryAbi_8543 from './abis/8543/StreamRegistry.abi';
import RiverRegistryAddress_31338 from './addresses/31338/riverRegistry.json';
import RiverRegistryAddress_8543 from './addresses/8543/riverRegistry.json';

export function getAbi(chainId: number = DEFAULT_CHAIN_ID) {
	switch(chainId) {
		case 8543:
			return {
				StreamRegistry: StreamRegistryAbi_8543,
				NodeRegistry: NodeRegistryAbi_8543,
			};
		case 31338:
			return {
				StreamRegistry: StreamRegistryAbi_31338,
				NodeRegistry: NodeRegistryAbi_31338,
			};
		default:
			throw new Error(`Unsupported chain ${chainId}`);
	}
}

export function getAddress(chainId: number = DEFAULT_CHAIN_ID) {
	switch(chainId) {
		case 8543:
			return {
				riverRegistry: RiverRegistryAddress_8543.address as Address,
			}
		case 31338:
			return {
				riverRegistry: RiverRegistryAddress_31338.address as Address,
			}
		default:
			throw new Error(`Unsupported chain ${chainId}`);
	}
}

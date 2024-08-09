import { Address } from './types';
import NodeRegistryAbi from '@river-build/generated/dev/abis/NodeRegistry.abi';
import StreamRegistryAbi from '@river-build/generated/dev/abis/StreamRegistry.abi';
import { config } from './environment';

let abi = {}

export function getAbi() {
	if (abi) {
		abi = {
			NodeRegistry: NodeRegistryAbi,
			StreamRegistry: StreamRegistryAbi,
		};
	}
	return abi;
}

export function getAddress(): Address {
	if (!config.riverRegistry) {
			throw new Error(`no riverRegistry address`);
	}
	return config.riverRegistry as Address;
}

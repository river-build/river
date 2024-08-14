import { RiverRegistry } from '@river-build/web3'
import { ethers } from 'ethers'

import { config } from './environment'

function makeRiverRegistry() {
	const provider = new ethers.providers.JsonRpcProvider(config.riverChainRpcUrl)
	const rvrRegistry = new RiverRegistry(config.web3Config.river, provider)

	if (!rvrRegistry) {
		throw new Error('Failed to create river registry')
	}

	return rvrRegistry
}

export const riverRegistry = makeRiverRegistry()

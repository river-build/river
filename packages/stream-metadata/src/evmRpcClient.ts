import { RiverRegistry } from '@river-build/web3'
import { ethers } from 'ethers'

import { Config } from './types'

let riverRegistry: ReturnType<typeof createRiverRegistry> | undefined

function createRiverRegistry(config: Config) {
	const provider = new ethers.providers.JsonRpcProvider(config.riverChainRpcUrl)
	const rvrRegistry = new RiverRegistry(config.river, provider)

	if (!rvrRegistry) {
		throw new Error('Failed to create river registry')
	}

	return rvrRegistry
}

export function getRiverRegistry(config: Config) {
	if (!riverRegistry) {
		riverRegistry = createRiverRegistry(config)
	}
	return riverRegistry
}

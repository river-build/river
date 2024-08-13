import { RiverRegistry } from '@river-build/web3'
import { config } from './environment'
import { ethers } from 'ethers'

const chainConfigs: ChainConfigs = {
	550: {
		rpcUrl: 'https://mainnet.rpc.river.build/http',
	},
	6524490: {
		rpcUrl: 'https://devnet.rpc.river.build',
	},
	31338: {
		rpcUrl: 'http://127.0.0.1:8546',
	},
}

interface ChainConfigs {
	[chainId: number]: ChainConfig
}

type ChainConfig = {
	rpcUrl: string
}

const riverRegistry: Record<number, ReturnType<typeof createRiverRegistry>> = {}

function createRiverRegistry(chainId: number) {
	const riverChainUrl = chainConfigs[chainId]?.rpcUrl
	if (!riverChainUrl) {
		throw new Error(`Unsupported chain ${chainId}`)
	}

	const provider = new ethers.providers.JsonRpcProvider(riverChainUrl)
	const riverRegistry = new RiverRegistry(config.river, provider)

	if (!riverRegistry) {
		throw new Error('Failed to create river registry')
	}

	return riverRegistry
}

export function getRiverRegistry(chainId: number) {
	if (!chainId) {
		throw new Error('Cannot get River Registry without chainId')
	}
	if (!riverRegistry[chainId]) {
		riverRegistry[chainId] = createRiverRegistry(chainId)
	}
	return riverRegistry[chainId]
}

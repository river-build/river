import { ethers } from 'ethers'
import { SpaceDapp } from '@river-build/web3'

import { config } from './environment'

let spaceDapp: SpaceDapp | undefined

export function getSpaceDapp(): SpaceDapp {
	if (!spaceDapp) {
		const provider = new ethers.providers.StaticJsonRpcProvider(config.baseChainRpcUrl)
		spaceDapp = new SpaceDapp(config.web3Config.base, provider)
	}
	return spaceDapp
}

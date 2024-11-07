import {
    IBanning as LocalhostContract,
    IBanningInterface as LocalhostInterface,
} from '@river-build/generated/dev/typings/IBanning'

import { ethers } from 'ethers'
import { BaseContractShim } from './BaseContractShim'

import LocalhostAbi from '@river-build/generated/dev/abis/IBanning.abi'

export class IBanningShim extends BaseContractShim<LocalhostContract, LocalhostInterface> {
    constructor(address: string, provider: ethers.providers.Provider | undefined) {
        super(address, provider, LocalhostAbi)
    }
}

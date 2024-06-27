import {
    IStreamRegistry as DevContract,
    IStreamRegistryInterface as DevInterface,
} from '@river-build/generated/dev/typings/IStreamRegistry'
import {
    IStreamRegistry as V3Contract,
    IStreamRegistryInterface as V3Interface,
} from '@river-build/generated/v3/typings/IStreamRegistry'

import DevAbi from '@river-build/generated/dev/abis/StreamRegistry.abi.json' assert { type: 'json' }
import V3Abi from '@river-build/generated/v3/abis/StreamRegistry.abi.json' assert { type: 'json' }

import { ethers } from 'ethers'
import { BaseContractShim } from './BaseContractShim'
import { ContractVersion } from '../IStaticContractsInfo'

export class IStreamRegistryShim extends BaseContractShim<
    DevContract,
    DevInterface,
    V3Contract,
    V3Interface
> {
    constructor(
        address: string,
        version: ContractVersion,
        provider: ethers.providers.Provider | undefined,
    ) {
        super(address, version, provider, {
            [ContractVersion.dev]: DevAbi,
            [ContractVersion.v3]: V3Abi,
        })
    }
}

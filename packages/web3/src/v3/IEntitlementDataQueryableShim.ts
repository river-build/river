import {
    IEntitlementDataQueryableV2 as LocalhostContract,
    IEntitlementDataQueryableV2Interface as LocalhostInterface,
    IEntitlementDataQueryableBaseV2 as LocalhostBase,
} from '@river-build/generated/dev/typings/IEntitlementDataQueryableV2'

import { ethers } from 'ethers'
import { BaseContractShim } from './BaseContractShim'

import LocalhostAbi from '@river-build/generated/dev/abis/IEntitlementDataQueryable.abi.json' assert { type: 'json' }

export class IEntitlementDataQueryableShim extends BaseContractShim<
    LocalhostContract,
    LocalhostInterface
> {
    constructor(address: string, provider: ethers.providers.Provider | undefined) {
        super(address, provider, LocalhostAbi)
    }
}

export type EntitlementDataStructOutput = LocalhostBase.EntitlementDataStructOutput

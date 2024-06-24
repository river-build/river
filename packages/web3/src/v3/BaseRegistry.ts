import { ethers } from 'ethers'

import { BaseChainConfig } from '../IStaticContractsInfo'
import { INodeOperatorShim } from './INodeOperatorShim'
import { IEntitlementCheckerShim } from './IEntitlementCheckerShim'
import { ISpaceDelegationShim } from './ISpaceDelegationShim'
import { IERC721AShim } from './IERC721AShim'

export class BaseRegistry {
    public readonly config: BaseChainConfig
    public readonly provider: ethers.providers.Provider
    public readonly nodeOperator: INodeOperatorShim
    public readonly entitlementChecker: IEntitlementCheckerShim
    public readonly spaceDelegation: ISpaceDelegationShim
    public readonly erc721A: IERC721AShim

    constructor(config: BaseChainConfig, provider: ethers.providers.Provider) {
        this.config = config
        this.provider = provider
        this.nodeOperator = new INodeOperatorShim(
            config.addresses.baseRegistry,
            config.contractVersion,
            provider,
        )
        this.entitlementChecker = new IEntitlementCheckerShim(
            config.addresses.baseRegistry,
            config.contractVersion,
            provider,
        )
        this.spaceDelegation = new ISpaceDelegationShim(
            config.addresses.baseRegistry,
            config.contractVersion,
            provider,
        )
        this.erc721A = new IERC721AShim(
            config.addresses.baseRegistry,
            config.contractVersion,
            provider,
        )
    }
}

import { TokenPausableFacet as LocalhostContract, TokenPausableFacetInterface as LocalhostInterface } from '@river-build/generated/dev/typings/TokenPausableFacet';
import { TokenPausableFacet as BaseSepoliaContract, TokenPausableFacetInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/TokenPausableFacet';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class TokenPausableFacetShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=TokenPausableFacetShim.d.ts.map
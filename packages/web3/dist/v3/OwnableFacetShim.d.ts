import { OwnableFacet as LocalhostContract, OwnableFacetInterface as LocalhostInterface } from '@river-build/generated/dev/typings/OwnableFacet';
import { OwnableFacet as BaseSepoliaContract, OwnableFacetInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/OwnableFacet';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class OwnableFacetShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=OwnableFacetShim.d.ts.map
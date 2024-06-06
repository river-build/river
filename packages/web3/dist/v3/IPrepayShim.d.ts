import { PrepayFacet as LocalhostContract, PrepayFacetInterface as LocalhostInterface } from '@river-build/generated/dev/typings/PrepayFacet';
import { PrepayFacet as BaseSepoliaContract, PrepayFacetInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/PrepayFacet';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class IPrepayShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=IPrepayShim.d.ts.map
import { IRoles as LocalhostContract, IRolesBase as LocalhostIRolesBase, IRolesInterface as LocalhostInterface } from '@river-build/generated/dev/typings/IRoles';
import { IRoles as BaseSepoliaContract, IRolesInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/IRoles';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export type { LocalhostIRolesBase as IRolesBase };
export declare class IRolesShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=IRolesShim.d.ts.map
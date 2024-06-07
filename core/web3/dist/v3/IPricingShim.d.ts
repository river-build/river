import { IPricingModules as LocalhostContract, IPricingModulesInterface as LocalhostInterface } from '@river-build/generated/dev/typings/IPricingModules';
export type { IPricingModulesBase } from '@river-build/generated/dev/typings/IPricingModules';
import { IPricingModules as BaseSepoliaContract, IPricingModulesInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/IPricingModules';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class IPricingShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=IPricingShim.d.ts.map
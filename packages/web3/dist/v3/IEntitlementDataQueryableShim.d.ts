import { IEntitlementDataQueryable as LocalhostContract, IEntitlementDataQueryableInterface as LocalhostInterface } from '@river-build/generated/dev/typings/IEntitlementDataQueryable';
import { IEntitlementDataQueryable as BaseSepoliaContract, IEntitlementDataQueryableInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/IEntitlementDataQueryable';
import { ethers } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class IEntitlementDataQueryableShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
}
//# sourceMappingURL=IEntitlementDataQueryableShim.d.ts.map
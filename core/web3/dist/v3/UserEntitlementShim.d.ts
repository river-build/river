import { UserEntitlement as LocalhostContract, UserEntitlementInterface as LocalhostInterface } from '@river-build/generated/dev/typings/UserEntitlement';
import { UserEntitlement as BaseSepoliaContract, UserEntitlementInterface as BaseSepoliaInterface } from '@river-build/generated/v3/typings/UserEntitlement';
import { BaseContractShim } from './BaseContractShim';
import { BigNumberish, ethers } from 'ethers';
import { EntitlementModuleType, EntitlementModule } from '../ContractTypes';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class UserEntitlementShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> implements EntitlementModule {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
    get moduleType(): EntitlementModuleType;
    getRoleEntitlement(roleId: BigNumberish): Promise<string[]>;
    decodeGetAddresses(entitlementData: string): string[] | undefined;
}
//# sourceMappingURL=UserEntitlementShim.d.ts.map
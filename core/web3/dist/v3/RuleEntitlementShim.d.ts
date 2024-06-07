import { IRuleEntitlement as LocalhostContract, IRuleEntitlementInterface as LocalhostInterface } from '@river-build/generated/dev/typings/IRuleEntitlement';
type BaseSepoliaContract = LocalhostContract;
type BaseSepoliaInterface = LocalhostInterface;
import { BaseContractShim } from './BaseContractShim';
import { BigNumberish, ethers } from 'ethers';
import { EntitlementModuleType, EntitlementModule } from '../ContractTypes';
import { ContractVersion } from '../IStaticContractsInfo';
export declare class RuleEntitlementShim extends BaseContractShim<LocalhostContract, LocalhostInterface, BaseSepoliaContract, BaseSepoliaInterface> implements EntitlementModule {
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined);
    get moduleType(): EntitlementModuleType;
    getRoleEntitlement(roleId: BigNumberish): Promise<LocalhostContract.RuleDataStruct | null>;
    decodeGetRuleData(entitlmentData: string): LocalhostContract.RuleDataStruct[] | undefined;
}
export {};
//# sourceMappingURL=RuleEntitlementShim.d.ts.map
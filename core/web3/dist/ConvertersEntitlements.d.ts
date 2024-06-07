import { Address, EntitlementStruct } from './ContractTypes';
import { IRuleEntitlement } from './v3';
export declare function decodeRuleData(encodedData: string): string[];
export declare function encodeUsers(users: string[] | Address[]): string;
export declare function decodeUsers(encodedData: string): string[];
export declare function createUserEntitlementStruct(moduleAddress: string, users: string[]): EntitlementStruct;
export declare function createRuleEntitlementStruct(moduleAddress: `0x${string}`, ruleData: IRuleEntitlement.RuleDataStruct): EntitlementStruct;
//# sourceMappingURL=ConvertersEntitlements.d.ts.map
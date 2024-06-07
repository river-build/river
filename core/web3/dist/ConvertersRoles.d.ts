import { Permission, EntitlementStruct } from './ContractTypes';
import { Space as SpaceV3 } from './v3/Space';
import { IRuleEntitlement } from './v3';
export declare function createEntitlementStruct<Space extends SpaceV3>(spaceIn: Space, users: string[], ruleData: IRuleEntitlement.RuleDataStruct): Promise<EntitlementStruct[]>;
export declare function toPermissions(permissions: readonly string[]): Permission[];
//# sourceMappingURL=ConvertersRoles.d.ts.map
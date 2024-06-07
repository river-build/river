import { EntitlementModuleType } from './ContractTypes';
import { createRuleEntitlementStruct, createUserEntitlementStruct } from './ConvertersEntitlements';
export async function createEntitlementStruct(spaceIn, users, ruleData) {
    const space = spaceIn;
    // figure out the addresses for each entitlement module
    const entitlementModules = await space.Entitlements.read.getEntitlements();
    let userEntitlementAddress;
    let ruleEntitlementAddress;
    for (const module of entitlementModules) {
        switch (module.moduleType) {
            case EntitlementModuleType.UserEntitlement:
                userEntitlementAddress = module.moduleAddress;
                break;
            case EntitlementModuleType.RuleEntitlement:
                ruleEntitlementAddress = module.moduleAddress;
                break;
        }
    }
    if (!userEntitlementAddress) {
        throw new Error('User entitlement moodule address not found.');
    }
    if (!ruleEntitlementAddress) {
        throw new Error('Rule entitlement moodule address not found.');
    }
    // create the entitlements array
    const entitlements = [];
    // create the user entitlement
    if (users.length) {
        const userEntitlement = createUserEntitlementStruct(userEntitlementAddress, users);
        entitlements.push(userEntitlement);
    }
    if (ruleData) {
        const ruleEntitlement = createRuleEntitlementStruct(ruleEntitlementAddress, ruleData);
        entitlements.push(ruleEntitlement);
    }
    // return the converted entitlements
    return entitlements;
}
export function toPermissions(permissions) {
    return permissions.map((p) => {
        const perm = p;
        return perm;
    });
}
//# sourceMappingURL=ConvertersRoles.js.map
export const Permission = {
    Undefined: 'Undefined',
    Read: 'Read',
    Write: 'Write',
    Invite: 'Invite',
    JoinSpace: 'JoinSpace',
    Redact: 'Redact',
    Ban: 'Ban',
    PinMessage: 'PinMessage',
    AddRemoveChannels: 'AddRemoveChannels',
    ModifySpaceSettings: 'ModifySpaceSettings',
};
/**
 * Supported entitlement modules
 */
export var EntitlementModuleType;
(function (EntitlementModuleType) {
    EntitlementModuleType["UserEntitlement"] = "UserEntitlement";
    EntitlementModuleType["RuleEntitlement"] = "RuleEntitlement";
})(EntitlementModuleType || (EntitlementModuleType = {}));
export function isUserEntitlement(entitlement) {
    return entitlement.moduleType === EntitlementModuleType.UserEntitlement;
}
export function isRuleEntitlement(entitlement) {
    return entitlement.moduleType === EntitlementModuleType.RuleEntitlement;
}
export function isStringArray(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
args) {
    return Array.isArray(args) && args.length > 0 && args.every((arg) => typeof arg === 'string');
}
//# sourceMappingURL=ContractTypes.js.map
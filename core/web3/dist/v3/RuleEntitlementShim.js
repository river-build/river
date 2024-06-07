import LocalhostAbi from '@river-build/generated/dev/abis/IRuleEntitlement.abi.json' assert { type: 'json' };
import BaseSepoliaAbi from '@river-build/generated/v3/abis/IRuleEntitlement.abi.json' assert { type: 'json' };
import { BaseContractShim } from './BaseContractShim';
import { EntitlementModuleType } from '../ContractTypes';
import { ContractVersion } from '../IStaticContractsInfo';
import { dlogger } from '@river-build/dlog';
const logger = dlogger('csb:SpaceDapp:debug');
export class RuleEntitlementShim extends BaseContractShim {
    constructor(address, version, provider) {
        super(address, version, provider, {
            [ContractVersion.dev]: LocalhostAbi,
            [ContractVersion.v3]: BaseSepoliaAbi,
        });
    }
    get moduleType() {
        return EntitlementModuleType.RuleEntitlement;
    }
    async getRoleEntitlement(roleId) {
        if (roleId === 0) {
            return {
                operations: [],
                checkOperations: [],
                logicalOperations: [],
            };
        }
        return this.read.getRuleData(roleId);
    }
    decodeGetRuleData(entitlmentData) {
        try {
            const decoded = this.decodeFunctionResult('getRuleData', entitlmentData);
            if (decoded.length === 0) {
                logger.error('RuleEntitlementShim No rule data', decoded);
                return undefined;
            }
            return decoded;
        }
        catch (error) {
            logger.error('RuleEntitlementShim Error decoding RuleDataStruct', error);
        }
        return;
    }
}
//# sourceMappingURL=RuleEntitlementShim.js.map
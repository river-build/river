import LocalhostAbi from '@river-build/generated/dev/abis/UserEntitlement.abi.json' assert { type: 'json' };
import BaseSepoliaAbi from '@river-build/generated/v3/abis/UserEntitlement.abi.json' assert { type: 'json' };
import { BaseContractShim } from './BaseContractShim';
import { ethers } from 'ethers';
import { decodeUsers } from '../ConvertersEntitlements';
import { EntitlementModuleType } from '../ContractTypes';
import { dlogger } from '@river-build/dlog';
import { ContractVersion } from '../IStaticContractsInfo';
const logger = dlogger('csb:UserEntitlementShim:debug');
export class UserEntitlementShim extends BaseContractShim {
    constructor(address, version, provider) {
        super(address, version, provider, {
            [ContractVersion.dev]: LocalhostAbi,
            [ContractVersion.v3]: BaseSepoliaAbi,
        });
    }
    get moduleType() {
        return EntitlementModuleType.UserEntitlement;
    }
    async getRoleEntitlement(roleId) {
        try {
            const users = await this.read.getEntitlementDataByRoleId(roleId);
            if (typeof users === 'string') {
                return decodeUsers(users);
            }
            else {
                return [];
            }
        }
        catch (e) {
            logger.error('Error getting role entitlement:', e);
            throw e;
        }
    }
    decodeGetAddresses(entitlementData) {
        // where does this come from?
        const abiDef = `[{"name":"getAddresses","outputs":[{"type":"address[]","name":"out"}],"constant":true,"payable":false,"type":"function"}]`;
        const abi = new ethers.utils.Interface(abiDef);
        try {
            const decoded = abi.decodeFunctionResult('getAddresses', entitlementData);
            return decoded.out;
        }
        catch (error) {
            logger.error('RuleEntitlementShim Error decoding RuleDataStruct', error);
        }
        return;
    }
}
//# sourceMappingURL=UserEntitlementShim.js.map
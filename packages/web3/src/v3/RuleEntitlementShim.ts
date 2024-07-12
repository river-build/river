import {
    IRuleEntitlementV2 as LocalhostContract,
    IRuleEntitlementV2Interface as LocalhostInterface,
} from '@river-build/generated/dev/typings/IRuleEntitlementV2'

import LocalhostAbi from '@river-build/generated/dev/abis/IRuleEntitlementV2.abi.json' assert { type: 'json' }

import { BaseContractShim } from './BaseContractShim'
import { BigNumberish, ethers } from 'ethers'
import { EntitlementModuleType, EntitlementModule } from '../ContractTypes'
import { dlogger } from '@river-build/dlog'
const logger = dlogger('csb:SpaceDapp:debug')

export class RuleEntitlementShim
    extends BaseContractShim<LocalhostContract, LocalhostInterface>
    implements EntitlementModule
{
    constructor(address: string, provider: ethers.providers.Provider | undefined) {
        super(address, provider, LocalhostAbi)
    }

    public get moduleType(): EntitlementModuleType {
        return EntitlementModuleType.RuleEntitlement
    }

    public async getRoleEntitlement(
        roleId: BigNumberish,
    ): Promise<LocalhostContract.RuleDataStruct | null> {
        if (roleId === 0) {
            return {
                operations: [],
                checkOperations: [],
                logicalOperations: [],
            }
        }
        return this.read.getRuleDataV2(roleId)
    }

    public decodeGetRuleData(
        entitlmentData: string,
    ): LocalhostContract.RuleDataStruct[] | undefined {
        try {
            const decoded = this.decodeFunctionResult(
                'getRuleData',
                entitlmentData,
            ) as unknown as LocalhostContract.RuleDataStruct[]

            if (decoded.length === 0) {
                logger.error('RuleEntitlementShim No rule data', decoded)
                return undefined
            }
            return decoded
        } catch (error) {
            logger.error('RuleEntitlementShim Error decoding RuleDataStruct', error)
        }
        return
    }
}

import { ethers } from 'ethers'

import { Address, EntitlementStruct } from './ContractTypes'
import { IRuleEntitlementBase, IRuleEntitlementV2Base } from './v3'
import { CheckOperationType, encodeEntitlementData, encodeThresholdParams } from './entitlement'

const UserAddressesEncoding = 'address[]'

export function encodeUsers(users: string[] | Address[]) {
    const abiCoder = ethers.utils.defaultAbiCoder
    const encodedData = abiCoder.encode([UserAddressesEncoding], [users])
    return encodedData
}

export function decodeUsers(encodedData: string): string[] {
    const abiCoder = ethers.utils.defaultAbiCoder
    const decodedData = abiCoder.decode([UserAddressesEncoding], encodedData) as string[][]
    let u: string[] = []
    if (decodedData.length) {
        // decoded value is in element 0 of the array
        u = decodedData[0]
    }
    return u
}

export function createUserEntitlementStruct(
    moduleAddress: string,
    users: string[],
): EntitlementStruct {
    const data = encodeUsers(users)
    return {
        module: moduleAddress,
        data,
    }
}

export function createRuleEntitlementStruct(
    moduleAddress: Address,
    ruleData: IRuleEntitlementBase.RuleDataStruct,
): EntitlementStruct {
    const encoded = encodeEntitlementData(ruleData)
    return {
        module: moduleAddress,
        data: encoded,
    }
}

export function convertRuleDataV1ToV2(
    ruleData: IRuleEntitlementBase.RuleDataStruct,
): IRuleEntitlementV2Base.RuleDataV2Struct {
    const operations: IRuleEntitlementBase.OperationStruct[] = ruleData.operations.map(
        (op): IRuleEntitlementV2Base.OperationStruct => {
            return { ...op }
        },
    )
    const logicalOperations = ruleData.logicalOperations.map(
        (op): IRuleEntitlementV2Base.LogicalOperationStruct => {
            return { ...op }
        },
    )
    const checkOperations = ruleData.checkOperations.map(
        (op): IRuleEntitlementV2Base.CheckOperationV2Struct => {
            switch (op.opType) {
                case CheckOperationType.MOCK:
                case CheckOperationType.ERC20:
                case CheckOperationType.ERC721:
                case CheckOperationType.NATIVE_COIN_BALANCE: {
                    const threshold = ethers.BigNumber.from(op.threshold).toBigInt()
                    return {
                        opType: op.opType,
                        chainId: op.chainId,
                        contractAddress: op.contractAddress,
                        params: encodeThresholdParams({ threshold }),
                    }
                }
                case CheckOperationType.ERC1155:
                    throw new Error('ERC1155 not supported for V1 Rule Data')

                case CheckOperationType.ISENTITLED:
                    return {
                        opType: op.opType,
                        chainId: op.chainId,
                        contractAddress: op.contractAddress,
                        params: `0x`,
                    }

                case CheckOperationType.NONE:
                default:
                    throw new Error('Unsupported Check Operation Type')
            }
        },
    )
    return {
        operations,
        logicalOperations,
        checkOperations,
    } as IRuleEntitlementV2Base.RuleDataV2Struct
}

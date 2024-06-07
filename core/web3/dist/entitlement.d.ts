import { IRuleEntitlement, IRuleEntitlementAbi } from './v3/IRuleEntitlementShim';
import { PublicClient } from 'viem';
import { ethers } from 'ethers';
import { Address } from './ContractTypes';
type ReadContractFunction = typeof publicClient.readContract<typeof IRuleEntitlementAbi, 'getRuleData'>;
type ReadContractReturnType = ReturnType<ReadContractFunction>;
export type RuleData = Awaited<ReadContractReturnType>;
export declare enum OperationType {
    NONE = 0,
    CHECK = 1,
    LOGICAL = 2
}
export declare enum CheckOperationType {
    NONE = 0,
    MOCK = 1,
    ERC20 = 2,
    ERC721 = 3,
    ERC1155 = 4,
    ISENTITLED = 5
}
export declare enum LogicalOperationType {
    NONE = 0,
    AND = 1,
    OR = 2
}
export type ContractOperation = {
    opType: OperationType;
    index: number;
};
export type ContractLogicalOperation = {
    logOpType: LogicalOperationType;
    leftOperationIndex: number;
    rightOperationIndex: number;
};
export declare function isContractLogicalOperation(operation: ContractOperation): boolean;
export type CheckOperation = {
    opType: OperationType.CHECK;
    checkType: CheckOperationType;
    chainId: bigint;
    contractAddress: Address;
    threshold: bigint;
};
export type OrOperation = {
    opType: OperationType.LOGICAL;
    logicalType: LogicalOperationType.OR;
    leftOperation: Operation;
    rightOperation: Operation;
};
export type AndOperation = {
    opType: OperationType.LOGICAL;
    logicalType: LogicalOperationType.AND;
    leftOperation: Operation;
    rightOperation: Operation;
};
export type NoOperation = {
    opType: OperationType.NONE;
    index: number;
};
export declare const NoopOperation: NoOperation;
export declare const NoopRuleData: {
    operations: NoOperation[];
    checkOperations: never[];
    logicalOperations: never[];
};
type EntitledWalletOrZeroAddress = string;
export type LogicalOperation = OrOperation | AndOperation;
export type Operation = CheckOperation | OrOperation | AndOperation | NoOperation;
declare const publicClient: PublicClient;
export declare function postOrderArrayToTree(operations: Operation[]): Operation;
export declare const getOperationTree: (address: Address, roleId: bigint) => Promise<Operation>;
export declare function encodeEntitlementData(ruleData: IRuleEntitlement.RuleDataStruct): Address;
export declare function decodeEntitlementData(entitlementData: Address): IRuleEntitlement.RuleDataStruct[];
export declare function ruleDataToOperations(data: IRuleEntitlement.RuleDataStruct[]): Operation[];
type DeepWriteable<T> = {
    -readonly [P in keyof T]: DeepWriteable<T[P]>;
};
export declare function postOrderTraversal(operation: Operation, data: DeepWriteable<RuleData>): void;
export declare function treeToRuleData(root: Operation): IRuleEntitlement.RuleDataStruct;
/**
 *
 * @param operations
 * @param linkedWallets
 * @param providers
 * @returns An entitled wallet or the zero address, indicating no entitlement
 */
export declare function evaluateOperationsForEntitledWallet(operations: Operation[], linkedWallets: string[], providers: ethers.providers.StaticJsonRpcProvider[]): Promise<string>;
export declare function evaluateTree(controller: AbortController, linkedWallets: string[], providers: ethers.providers.StaticJsonRpcProvider[], entry?: Operation): Promise<EntitledWalletOrZeroAddress>;
export declare function createExternalTokenStruct(addresses: Address[]): IRuleEntitlement.RuleDataStruct;
export declare function createExternalNFTStruct(addresses: Address[]): IRuleEntitlement.RuleDataStruct;
export type ContractCheckOperation = {
    type: CheckOperationType;
    chainId: bigint;
    address: Address;
    threshold: bigint;
};
export declare function createOperationsTree(checkOp: (Omit<ContractCheckOperation, 'threshold'> & {
    threshold?: bigint;
})[]): IRuleEntitlement.RuleDataStruct;
export declare function createContractCheckOperationFromTree(entitlementData: IRuleEntitlement.RuleDataStruct): ContractCheckOperation[];
export {};
//# sourceMappingURL=entitlement.d.ts.map
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export declare namespace IEntitlementDataQueryableBase {
  export type EntitlementDataStruct = {
    entitlementType: PromiseOrValue<string>;
    entitlementData: PromiseOrValue<BytesLike>;
  };

  export type EntitlementDataStructOutput = [string, string] & {
    entitlementType: string;
    entitlementData: string;
  };
}

export declare namespace IRuleEntitlementBase {
  export type OperationStruct = {
    opType: PromiseOrValue<BigNumberish>;
    index: PromiseOrValue<BigNumberish>;
  };

  export type OperationStructOutput = [number, number] & {
    opType: number;
    index: number;
  };

  export type CheckOperationStruct = {
    opType: PromiseOrValue<BigNumberish>;
    chainId: PromiseOrValue<BigNumberish>;
    contractAddress: PromiseOrValue<string>;
    threshold: PromiseOrValue<BigNumberish>;
  };

  export type CheckOperationStructOutput = [
    number,
    BigNumber,
    string,
    BigNumber
  ] & {
    opType: number;
    chainId: BigNumber;
    contractAddress: string;
    threshold: BigNumber;
  };

  export type LogicalOperationStruct = {
    logOpType: PromiseOrValue<BigNumberish>;
    leftOperationIndex: PromiseOrValue<BigNumberish>;
    rightOperationIndex: PromiseOrValue<BigNumberish>;
  };

  export type LogicalOperationStructOutput = [number, number, number] & {
    logOpType: number;
    leftOperationIndex: number;
    rightOperationIndex: number;
  };

  export type RuleDataStruct = {
    operations: IRuleEntitlementBase.OperationStruct[];
    checkOperations: IRuleEntitlementBase.CheckOperationStruct[];
    logicalOperations: IRuleEntitlementBase.LogicalOperationStruct[];
  };

  export type RuleDataStructOutput = [
    IRuleEntitlementBase.OperationStructOutput[],
    IRuleEntitlementBase.CheckOperationStructOutput[],
    IRuleEntitlementBase.LogicalOperationStructOutput[]
  ] & {
    operations: IRuleEntitlementBase.OperationStructOutput[];
    checkOperations: IRuleEntitlementBase.CheckOperationStructOutput[];
    logicalOperations: IRuleEntitlementBase.LogicalOperationStructOutput[];
  };

  export type CheckOperationV2Struct = {
    opType: PromiseOrValue<BigNumberish>;
    chainId: PromiseOrValue<BigNumberish>;
    contractAddress: PromiseOrValue<string>;
    params: PromiseOrValue<BytesLike>;
  };

  export type CheckOperationV2StructOutput = [
    number,
    BigNumber,
    string,
    string
  ] & {
    opType: number;
    chainId: BigNumber;
    contractAddress: string;
    params: string;
  };

  export type RuleDataV2Struct = {
    operations: IRuleEntitlementBase.OperationStruct[];
    checkOperations: IRuleEntitlementBase.CheckOperationV2Struct[];
    logicalOperations: IRuleEntitlementBase.LogicalOperationStruct[];
  };

  export type RuleDataV2StructOutput = [
    IRuleEntitlementBase.OperationStructOutput[],
    IRuleEntitlementBase.CheckOperationV2StructOutput[],
    IRuleEntitlementBase.LogicalOperationStructOutput[]
  ] & {
    operations: IRuleEntitlementBase.OperationStructOutput[];
    checkOperations: IRuleEntitlementBase.CheckOperationV2StructOutput[];
    logicalOperations: IRuleEntitlementBase.LogicalOperationStructOutput[];
  };
}

export interface MockEntitlementGatedInterface extends utils.Interface {
  functions: {
    "__EntitlementGated_init(address)": FunctionFragment;
    "getCrossChainEntitlementData(bytes32,uint256)": FunctionFragment;
    "getRuleData(uint256)": FunctionFragment;
    "getRuleData(bytes32,uint256)": FunctionFragment;
    "getRuleDataV2(uint256)": FunctionFragment;
    "postEntitlementCheckResult(bytes32,uint256,uint8)": FunctionFragment;
    "postEntitlementCheckResultV2(bytes32,uint256,uint8)": FunctionFragment;
    "requestEntitlementCheck(uint256,((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))": FunctionFragment;
    "requestEntitlementCheckV2(uint256[],((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]))": FunctionFragment;
    "requestEntitlementCheckV3(uint256[],((uint8,uint8)[],(uint8,uint256,address,bytes)[],(uint8,uint8,uint8)[]))": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "__EntitlementGated_init"
      | "getCrossChainEntitlementData"
      | "getRuleData(uint256)"
      | "getRuleData(bytes32,uint256)"
      | "getRuleDataV2"
      | "postEntitlementCheckResult"
      | "postEntitlementCheckResultV2"
      | "requestEntitlementCheck"
      | "requestEntitlementCheckV2"
      | "requestEntitlementCheckV3"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "__EntitlementGated_init",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getCrossChainEntitlementData",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getRuleData(uint256)",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getRuleData(bytes32,uint256)",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getRuleDataV2",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "postEntitlementCheckResult",
    values: [
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "postEntitlementCheckResultV2",
    values: [
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "requestEntitlementCheck",
    values: [PromiseOrValue<BigNumberish>, IRuleEntitlementBase.RuleDataStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "requestEntitlementCheckV2",
    values: [
      PromiseOrValue<BigNumberish>[],
      IRuleEntitlementBase.RuleDataV2Struct
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "requestEntitlementCheckV3",
    values: [
      PromiseOrValue<BigNumberish>[],
      IRuleEntitlementBase.RuleDataV2Struct
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "__EntitlementGated_init",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getCrossChainEntitlementData",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRuleData(uint256)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRuleData(bytes32,uint256)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRuleDataV2",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "postEntitlementCheckResult",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "postEntitlementCheckResultV2",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestEntitlementCheck",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestEntitlementCheckV2",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requestEntitlementCheckV3",
    data: BytesLike
  ): Result;

  events: {
    "EntitlementCheckResultPosted(bytes32,uint8)": EventFragment;
    "Initialized(uint32)": EventFragment;
    "InterfaceAdded(bytes4)": EventFragment;
    "InterfaceRemoved(bytes4)": EventFragment;
  };

  getEvent(
    nameOrSignatureOrTopic: "EntitlementCheckResultPosted"
  ): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Initialized"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "InterfaceAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "InterfaceRemoved"): EventFragment;
}

export interface EntitlementCheckResultPostedEventObject {
  transactionId: string;
  result: number;
}
export type EntitlementCheckResultPostedEvent = TypedEvent<
  [string, number],
  EntitlementCheckResultPostedEventObject
>;

export type EntitlementCheckResultPostedEventFilter =
  TypedEventFilter<EntitlementCheckResultPostedEvent>;

export interface InitializedEventObject {
  version: number;
}
export type InitializedEvent = TypedEvent<[number], InitializedEventObject>;

export type InitializedEventFilter = TypedEventFilter<InitializedEvent>;

export interface InterfaceAddedEventObject {
  interfaceId: string;
}
export type InterfaceAddedEvent = TypedEvent<
  [string],
  InterfaceAddedEventObject
>;

export type InterfaceAddedEventFilter = TypedEventFilter<InterfaceAddedEvent>;

export interface InterfaceRemovedEventObject {
  interfaceId: string;
}
export type InterfaceRemovedEvent = TypedEvent<
  [string],
  InterfaceRemovedEventObject
>;

export type InterfaceRemovedEventFilter =
  TypedEventFilter<InterfaceRemovedEvent>;

export interface MockEntitlementGated extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MockEntitlementGatedInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    __EntitlementGated_init(
      entitlementChecker: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getCrossChainEntitlementData(
      arg0: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[IEntitlementDataQueryableBase.EntitlementDataStructOutput]>;

    "getRuleData(uint256)"(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[IRuleEntitlementBase.RuleDataStructOutput]>;

    "getRuleData(bytes32,uint256)"(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[IRuleEntitlementBase.RuleDataStructOutput]>;

    getRuleDataV2(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[IRuleEntitlementBase.RuleDataV2StructOutput]>;

    postEntitlementCheckResult(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      result: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    postEntitlementCheckResultV2(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      result: PromiseOrValue<BigNumberish>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    requestEntitlementCheck(
      roleId: PromiseOrValue<BigNumberish>,
      ruleData: IRuleEntitlementBase.RuleDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    requestEntitlementCheckV2(
      roleIds: PromiseOrValue<BigNumberish>[],
      ruleData: IRuleEntitlementBase.RuleDataV2Struct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    requestEntitlementCheckV3(
      roleIds: PromiseOrValue<BigNumberish>[],
      ruleData: IRuleEntitlementBase.RuleDataV2Struct,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  __EntitlementGated_init(
    entitlementChecker: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getCrossChainEntitlementData(
    arg0: PromiseOrValue<BytesLike>,
    roleId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<IEntitlementDataQueryableBase.EntitlementDataStructOutput>;

  "getRuleData(uint256)"(
    roleId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<IRuleEntitlementBase.RuleDataStructOutput>;

  "getRuleData(bytes32,uint256)"(
    transactionId: PromiseOrValue<BytesLike>,
    roleId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<IRuleEntitlementBase.RuleDataStructOutput>;

  getRuleDataV2(
    roleId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<IRuleEntitlementBase.RuleDataV2StructOutput>;

  postEntitlementCheckResult(
    transactionId: PromiseOrValue<BytesLike>,
    roleId: PromiseOrValue<BigNumberish>,
    result: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  postEntitlementCheckResultV2(
    transactionId: PromiseOrValue<BytesLike>,
    roleId: PromiseOrValue<BigNumberish>,
    result: PromiseOrValue<BigNumberish>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  requestEntitlementCheck(
    roleId: PromiseOrValue<BigNumberish>,
    ruleData: IRuleEntitlementBase.RuleDataStruct,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  requestEntitlementCheckV2(
    roleIds: PromiseOrValue<BigNumberish>[],
    ruleData: IRuleEntitlementBase.RuleDataV2Struct,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  requestEntitlementCheckV3(
    roleIds: PromiseOrValue<BigNumberish>[],
    ruleData: IRuleEntitlementBase.RuleDataV2Struct,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    __EntitlementGated_init(
      entitlementChecker: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    getCrossChainEntitlementData(
      arg0: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<IEntitlementDataQueryableBase.EntitlementDataStructOutput>;

    "getRuleData(uint256)"(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<IRuleEntitlementBase.RuleDataStructOutput>;

    "getRuleData(bytes32,uint256)"(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<IRuleEntitlementBase.RuleDataStructOutput>;

    getRuleDataV2(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<IRuleEntitlementBase.RuleDataV2StructOutput>;

    postEntitlementCheckResult(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      result: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    postEntitlementCheckResultV2(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      result: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    requestEntitlementCheck(
      roleId: PromiseOrValue<BigNumberish>,
      ruleData: IRuleEntitlementBase.RuleDataStruct,
      overrides?: CallOverrides
    ): Promise<string>;

    requestEntitlementCheckV2(
      roleIds: PromiseOrValue<BigNumberish>[],
      ruleData: IRuleEntitlementBase.RuleDataV2Struct,
      overrides?: CallOverrides
    ): Promise<string>;

    requestEntitlementCheckV3(
      roleIds: PromiseOrValue<BigNumberish>[],
      ruleData: IRuleEntitlementBase.RuleDataV2Struct,
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {
    "EntitlementCheckResultPosted(bytes32,uint8)"(
      transactionId?: PromiseOrValue<BytesLike> | null,
      result?: null
    ): EntitlementCheckResultPostedEventFilter;
    EntitlementCheckResultPosted(
      transactionId?: PromiseOrValue<BytesLike> | null,
      result?: null
    ): EntitlementCheckResultPostedEventFilter;

    "Initialized(uint32)"(version?: null): InitializedEventFilter;
    Initialized(version?: null): InitializedEventFilter;

    "InterfaceAdded(bytes4)"(
      interfaceId?: PromiseOrValue<BytesLike> | null
    ): InterfaceAddedEventFilter;
    InterfaceAdded(
      interfaceId?: PromiseOrValue<BytesLike> | null
    ): InterfaceAddedEventFilter;

    "InterfaceRemoved(bytes4)"(
      interfaceId?: PromiseOrValue<BytesLike> | null
    ): InterfaceRemovedEventFilter;
    InterfaceRemoved(
      interfaceId?: PromiseOrValue<BytesLike> | null
    ): InterfaceRemovedEventFilter;
  };

  estimateGas: {
    __EntitlementGated_init(
      entitlementChecker: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getCrossChainEntitlementData(
      arg0: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getRuleData(uint256)"(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getRuleData(bytes32,uint256)"(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getRuleDataV2(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    postEntitlementCheckResult(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      result: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    postEntitlementCheckResultV2(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      result: PromiseOrValue<BigNumberish>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    requestEntitlementCheck(
      roleId: PromiseOrValue<BigNumberish>,
      ruleData: IRuleEntitlementBase.RuleDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    requestEntitlementCheckV2(
      roleIds: PromiseOrValue<BigNumberish>[],
      ruleData: IRuleEntitlementBase.RuleDataV2Struct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    requestEntitlementCheckV3(
      roleIds: PromiseOrValue<BigNumberish>[],
      ruleData: IRuleEntitlementBase.RuleDataV2Struct,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    __EntitlementGated_init(
      entitlementChecker: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getCrossChainEntitlementData(
      arg0: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getRuleData(uint256)"(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getRuleData(bytes32,uint256)"(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRuleDataV2(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    postEntitlementCheckResult(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      result: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    postEntitlementCheckResultV2(
      transactionId: PromiseOrValue<BytesLike>,
      roleId: PromiseOrValue<BigNumberish>,
      result: PromiseOrValue<BigNumberish>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    requestEntitlementCheck(
      roleId: PromiseOrValue<BigNumberish>,
      ruleData: IRuleEntitlementBase.RuleDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    requestEntitlementCheckV2(
      roleIds: PromiseOrValue<BigNumberish>[],
      ruleData: IRuleEntitlementBase.RuleDataV2Struct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    requestEntitlementCheckV3(
      roleIds: PromiseOrValue<BigNumberish>[],
      ruleData: IRuleEntitlementBase.RuleDataV2Struct,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}

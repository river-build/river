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
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../common";

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
}

export interface IRuleEntitlementInterface extends utils.Interface {
  functions: {
    "description()": FunctionFragment;
    "encodeRuleData(((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[]))": FunctionFragment;
    "getEntitlementDataByRoleId(uint256)": FunctionFragment;
    "getRuleData(uint256)": FunctionFragment;
    "initialize(address)": FunctionFragment;
    "isCrosschain()": FunctionFragment;
    "isEntitled(bytes32,address[],bytes32)": FunctionFragment;
    "moduleType()": FunctionFragment;
    "name()": FunctionFragment;
    "removeEntitlement(uint256)": FunctionFragment;
    "setEntitlement(uint256,bytes)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "description"
      | "encodeRuleData"
      | "getEntitlementDataByRoleId"
      | "getRuleData"
      | "initialize"
      | "isCrosschain"
      | "isEntitled"
      | "moduleType"
      | "name"
      | "removeEntitlement"
      | "setEntitlement"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "description",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "encodeRuleData",
    values: [IRuleEntitlementBase.RuleDataStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "getEntitlementDataByRoleId",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getRuleData",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "isCrosschain",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "isEntitled",
    values: [
      PromiseOrValue<BytesLike>,
      PromiseOrValue<string>[],
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "moduleType",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "name", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "removeEntitlement",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "setEntitlement",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BytesLike>]
  ): string;

  decodeFunctionResult(
    functionFragment: "description",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "encodeRuleData",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getEntitlementDataByRoleId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRuleData",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "isCrosschain",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "isEntitled", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "moduleType", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "removeEntitlement",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setEntitlement",
    data: BytesLike
  ): Result;

  events: {};
}

export interface IRuleEntitlement extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IRuleEntitlementInterface;

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
    description(overrides?: CallOverrides): Promise<[string]>;

    encodeRuleData(
      data: IRuleEntitlementBase.RuleDataStruct,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getEntitlementDataByRoleId(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getRuleData(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [IRuleEntitlementBase.RuleDataStructOutput] & {
        data: IRuleEntitlementBase.RuleDataStructOutput;
      }
    >;

    initialize(
      space: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    isCrosschain(overrides?: CallOverrides): Promise<[boolean]>;

    isEntitled(
      channelId: PromiseOrValue<BytesLike>,
      user: PromiseOrValue<string>[],
      permission: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    moduleType(overrides?: CallOverrides): Promise<[string]>;

    name(overrides?: CallOverrides): Promise<[string]>;

    removeEntitlement(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setEntitlement(
      roleId: PromiseOrValue<BigNumberish>,
      entitlementData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  description(overrides?: CallOverrides): Promise<string>;

  encodeRuleData(
    data: IRuleEntitlementBase.RuleDataStruct,
    overrides?: CallOverrides
  ): Promise<string>;

  getEntitlementDataByRoleId(
    roleId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  getRuleData(
    roleId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<IRuleEntitlementBase.RuleDataStructOutput>;

  initialize(
    space: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  isCrosschain(overrides?: CallOverrides): Promise<boolean>;

  isEntitled(
    channelId: PromiseOrValue<BytesLike>,
    user: PromiseOrValue<string>[],
    permission: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  moduleType(overrides?: CallOverrides): Promise<string>;

  name(overrides?: CallOverrides): Promise<string>;

  removeEntitlement(
    roleId: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setEntitlement(
    roleId: PromiseOrValue<BigNumberish>,
    entitlementData: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    description(overrides?: CallOverrides): Promise<string>;

    encodeRuleData(
      data: IRuleEntitlementBase.RuleDataStruct,
      overrides?: CallOverrides
    ): Promise<string>;

    getEntitlementDataByRoleId(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    getRuleData(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<IRuleEntitlementBase.RuleDataStructOutput>;

    initialize(
      space: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    isCrosschain(overrides?: CallOverrides): Promise<boolean>;

    isEntitled(
      channelId: PromiseOrValue<BytesLike>,
      user: PromiseOrValue<string>[],
      permission: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    moduleType(overrides?: CallOverrides): Promise<string>;

    name(overrides?: CallOverrides): Promise<string>;

    removeEntitlement(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    setEntitlement(
      roleId: PromiseOrValue<BigNumberish>,
      entitlementData: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    description(overrides?: CallOverrides): Promise<BigNumber>;

    encodeRuleData(
      data: IRuleEntitlementBase.RuleDataStruct,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getEntitlementDataByRoleId(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getRuleData(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initialize(
      space: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    isCrosschain(overrides?: CallOverrides): Promise<BigNumber>;

    isEntitled(
      channelId: PromiseOrValue<BytesLike>,
      user: PromiseOrValue<string>[],
      permission: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    moduleType(overrides?: CallOverrides): Promise<BigNumber>;

    name(overrides?: CallOverrides): Promise<BigNumber>;

    removeEntitlement(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setEntitlement(
      roleId: PromiseOrValue<BigNumberish>,
      entitlementData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    description(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    encodeRuleData(
      data: IRuleEntitlementBase.RuleDataStruct,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getEntitlementDataByRoleId(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRuleData(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initialize(
      space: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    isCrosschain(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isEntitled(
      channelId: PromiseOrValue<BytesLike>,
      user: PromiseOrValue<string>[],
      permission: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    moduleType(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    name(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    removeEntitlement(
      roleId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setEntitlement(
      roleId: PromiseOrValue<BigNumberish>,
      entitlementData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}

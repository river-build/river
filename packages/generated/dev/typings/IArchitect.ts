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

export declare namespace IMembershipBase {
  export type MembershipStruct = {
    name: PromiseOrValue<string>;
    symbol: PromiseOrValue<string>;
    price: PromiseOrValue<BigNumberish>;
    maxSupply: PromiseOrValue<BigNumberish>;
    duration: PromiseOrValue<BigNumberish>;
    currency: PromiseOrValue<string>;
    feeRecipient: PromiseOrValue<string>;
    freeAllocation: PromiseOrValue<BigNumberish>;
    pricingModule: PromiseOrValue<string>;
  };

  export type MembershipStructOutput = [
    string,
    string,
    BigNumber,
    BigNumber,
    BigNumber,
    string,
    string,
    BigNumber,
    string
  ] & {
    name: string;
    symbol: string;
    price: BigNumber;
    maxSupply: BigNumber;
    duration: BigNumber;
    currency: string;
    feeRecipient: string;
    freeAllocation: BigNumber;
    pricingModule: string;
  };
}

export declare namespace IRuleEntitlement {
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
    operations: IRuleEntitlement.OperationStruct[];
    checkOperations: IRuleEntitlement.CheckOperationStruct[];
    logicalOperations: IRuleEntitlement.LogicalOperationStruct[];
  };

  export type RuleDataStructOutput = [
    IRuleEntitlement.OperationStructOutput[],
    IRuleEntitlement.CheckOperationStructOutput[],
    IRuleEntitlement.LogicalOperationStructOutput[]
  ] & {
    operations: IRuleEntitlement.OperationStructOutput[];
    checkOperations: IRuleEntitlement.CheckOperationStructOutput[];
    logicalOperations: IRuleEntitlement.LogicalOperationStructOutput[];
  };
}

export declare namespace IArchitectBase {
  export type MembershipRequirementsStruct = {
    everyone: PromiseOrValue<boolean>;
    users: PromiseOrValue<string>[];
    ruleData: IRuleEntitlement.RuleDataStruct;
  };

  export type MembershipRequirementsStructOutput = [
    boolean,
    string[],
    IRuleEntitlement.RuleDataStructOutput
  ] & {
    everyone: boolean;
    users: string[];
    ruleData: IRuleEntitlement.RuleDataStructOutput;
  };

  export type MembershipStruct = {
    settings: IMembershipBase.MembershipStruct;
    requirements: IArchitectBase.MembershipRequirementsStruct;
    permissions: PromiseOrValue<string>[];
  };

  export type MembershipStructOutput = [
    IMembershipBase.MembershipStructOutput,
    IArchitectBase.MembershipRequirementsStructOutput,
    string[]
  ] & {
    settings: IMembershipBase.MembershipStructOutput;
    requirements: IArchitectBase.MembershipRequirementsStructOutput;
    permissions: string[];
  };

  export type ChannelInfoStruct = { metadata: PromiseOrValue<string> };

  export type ChannelInfoStructOutput = [string] & { metadata: string };

  export type SpaceInfoStruct = {
    name: PromiseOrValue<string>;
    uri: PromiseOrValue<string>;
    shortDescription: PromiseOrValue<string>;
    longDescription: PromiseOrValue<string>;
    membership: IArchitectBase.MembershipStruct;
    channel: IArchitectBase.ChannelInfoStruct;
  };

  export type SpaceInfoStructOutput = [
    string,
    string,
    string,
    string,
    IArchitectBase.MembershipStructOutput,
    IArchitectBase.ChannelInfoStructOutput
  ] & {
    name: string;
    uri: string;
    shortDescription: string;
    longDescription: string;
    membership: IArchitectBase.MembershipStructOutput;
    channel: IArchitectBase.ChannelInfoStructOutput;
  };
}

export interface IArchitectInterface extends utils.Interface {
  functions: {
    "createSpace((string,string,string,string,((string,string,uint256,uint256,uint64,address,address,uint256,address),(bool,address[],((uint8,uint8)[],(uint8,uint256,address,uint256)[],(uint8,uint8,uint8)[])),string[]),(string)))": FunctionFragment;
    "getSpaceArchitectImplementations()": FunctionFragment;
    "getSpaceByTokenId(uint256)": FunctionFragment;
    "getTokenIdBySpace(address)": FunctionFragment;
    "setSpaceArchitectImplementations(address,address,address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "createSpace"
      | "getSpaceArchitectImplementations"
      | "getSpaceByTokenId"
      | "getTokenIdBySpace"
      | "setSpaceArchitectImplementations"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "createSpace",
    values: [IArchitectBase.SpaceInfoStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "getSpaceArchitectImplementations",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getSpaceByTokenId",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getTokenIdBySpace",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setSpaceArchitectImplementations",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "createSpace",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getSpaceArchitectImplementations",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getSpaceByTokenId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTokenIdBySpace",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setSpaceArchitectImplementations",
    data: BytesLike
  ): Result;

  events: {
    "SpaceCreated(address,uint256,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "SpaceCreated"): EventFragment;
}

export interface SpaceCreatedEventObject {
  owner: string;
  tokenId: BigNumber;
  space: string;
}
export type SpaceCreatedEvent = TypedEvent<
  [string, BigNumber, string],
  SpaceCreatedEventObject
>;

export type SpaceCreatedEventFilter = TypedEventFilter<SpaceCreatedEvent>;

export interface IArchitect extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IArchitectInterface;

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
    createSpace(
      SpaceInfo: IArchitectBase.SpaceInfoStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getSpaceArchitectImplementations(
      overrides?: CallOverrides
    ): Promise<
      [string, string, string] & {
        ownerTokenImplementation: string;
        userEntitlementImplementation: string;
        ruleEntitlementImplementation: string;
      }
    >;

    getSpaceByTokenId(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string] & { space: string }>;

    getTokenIdBySpace(
      space: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    setSpaceArchitectImplementations(
      ownerTokenImplementation: PromiseOrValue<string>,
      userEntitlementImplementation: PromiseOrValue<string>,
      ruleEntitlementImplementation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  createSpace(
    SpaceInfo: IArchitectBase.SpaceInfoStruct,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getSpaceArchitectImplementations(
    overrides?: CallOverrides
  ): Promise<
    [string, string, string] & {
      ownerTokenImplementation: string;
      userEntitlementImplementation: string;
      ruleEntitlementImplementation: string;
    }
  >;

  getSpaceByTokenId(
    tokenId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  getTokenIdBySpace(
    space: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  setSpaceArchitectImplementations(
    ownerTokenImplementation: PromiseOrValue<string>,
    userEntitlementImplementation: PromiseOrValue<string>,
    ruleEntitlementImplementation: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    createSpace(
      SpaceInfo: IArchitectBase.SpaceInfoStruct,
      overrides?: CallOverrides
    ): Promise<string>;

    getSpaceArchitectImplementations(
      overrides?: CallOverrides
    ): Promise<
      [string, string, string] & {
        ownerTokenImplementation: string;
        userEntitlementImplementation: string;
        ruleEntitlementImplementation: string;
      }
    >;

    getSpaceByTokenId(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    getTokenIdBySpace(
      space: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setSpaceArchitectImplementations(
      ownerTokenImplementation: PromiseOrValue<string>,
      userEntitlementImplementation: PromiseOrValue<string>,
      ruleEntitlementImplementation: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "SpaceCreated(address,uint256,address)"(
      owner?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null,
      space?: PromiseOrValue<string> | null
    ): SpaceCreatedEventFilter;
    SpaceCreated(
      owner?: PromiseOrValue<string> | null,
      tokenId?: PromiseOrValue<BigNumberish> | null,
      space?: PromiseOrValue<string> | null
    ): SpaceCreatedEventFilter;
  };

  estimateGas: {
    createSpace(
      SpaceInfo: IArchitectBase.SpaceInfoStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getSpaceArchitectImplementations(
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getSpaceByTokenId(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getTokenIdBySpace(
      space: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setSpaceArchitectImplementations(
      ownerTokenImplementation: PromiseOrValue<string>,
      userEntitlementImplementation: PromiseOrValue<string>,
      ruleEntitlementImplementation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    createSpace(
      SpaceInfo: IArchitectBase.SpaceInfoStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getSpaceArchitectImplementations(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getSpaceByTokenId(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getTokenIdBySpace(
      space: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setSpaceArchitectImplementations(
      ownerTokenImplementation: PromiseOrValue<string>,
      userEntitlementImplementation: PromiseOrValue<string>,
      ruleEntitlementImplementation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}

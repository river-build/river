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

export interface INodeOperatorInterface extends utils.Interface {
  functions: {
    "getClaimAddressForOperator(address)": FunctionFragment;
    "getCommissionRate(address)": FunctionFragment;
    "getOperatorStatus(address)": FunctionFragment;
    "getOperators()": FunctionFragment;
    "isOperator(address)": FunctionFragment;
    "registerOperator(address)": FunctionFragment;
    "setClaimAddressForOperator(address,address)": FunctionFragment;
    "setCommissionRate(uint256)": FunctionFragment;
    "setOperatorStatus(address,uint8)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "getClaimAddressForOperator"
      | "getCommissionRate"
      | "getOperatorStatus"
      | "getOperators"
      | "isOperator"
      | "registerOperator"
      | "setClaimAddressForOperator"
      | "setCommissionRate"
      | "setOperatorStatus"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "getClaimAddressForOperator",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getCommissionRate",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getOperatorStatus",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getOperators",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "isOperator",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "registerOperator",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setClaimAddressForOperator",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setCommissionRate",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "setOperatorStatus",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;

  decodeFunctionResult(
    functionFragment: "getClaimAddressForOperator",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getCommissionRate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getOperatorStatus",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getOperators",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "isOperator", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "registerOperator",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setClaimAddressForOperator",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setCommissionRate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setOperatorStatus",
    data: BytesLike
  ): Result;

  events: {
    "OperatorClaimAddressChanged(address,address)": EventFragment;
    "OperatorCommissionChanged(address,uint256)": EventFragment;
    "OperatorRegistered(address)": EventFragment;
    "OperatorStatusChanged(address,uint8)": EventFragment;
  };

  getEvent(
    nameOrSignatureOrTopic: "OperatorClaimAddressChanged"
  ): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OperatorCommissionChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OperatorRegistered"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OperatorStatusChanged"): EventFragment;
}

export interface OperatorClaimAddressChangedEventObject {
  operator: string;
  claimAddress: string;
}
export type OperatorClaimAddressChangedEvent = TypedEvent<
  [string, string],
  OperatorClaimAddressChangedEventObject
>;

export type OperatorClaimAddressChangedEventFilter =
  TypedEventFilter<OperatorClaimAddressChangedEvent>;

export interface OperatorCommissionChangedEventObject {
  operator: string;
  commission: BigNumber;
}
export type OperatorCommissionChangedEvent = TypedEvent<
  [string, BigNumber],
  OperatorCommissionChangedEventObject
>;

export type OperatorCommissionChangedEventFilter =
  TypedEventFilter<OperatorCommissionChangedEvent>;

export interface OperatorRegisteredEventObject {
  operator: string;
}
export type OperatorRegisteredEvent = TypedEvent<
  [string],
  OperatorRegisteredEventObject
>;

export type OperatorRegisteredEventFilter =
  TypedEventFilter<OperatorRegisteredEvent>;

export interface OperatorStatusChangedEventObject {
  operator: string;
  newStatus: number;
}
export type OperatorStatusChangedEvent = TypedEvent<
  [string, number],
  OperatorStatusChangedEventObject
>;

export type OperatorStatusChangedEventFilter =
  TypedEventFilter<OperatorStatusChangedEvent>;

export interface INodeOperator extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: INodeOperatorInterface;

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
    getClaimAddressForOperator(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getCommissionRate(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getOperatorStatus(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[number]>;

    getOperators(overrides?: CallOverrides): Promise<[string[]]>;

    isOperator(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    registerOperator(
      claimer: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setClaimAddressForOperator(
      claimer: PromiseOrValue<string>,
      operator: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setCommissionRate(
      commission: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setOperatorStatus(
      operator: PromiseOrValue<string>,
      newStatus: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  getClaimAddressForOperator(
    operator: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  getCommissionRate(
    operator: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getOperatorStatus(
    operator: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<number>;

  getOperators(overrides?: CallOverrides): Promise<string[]>;

  isOperator(
    operator: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  registerOperator(
    claimer: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setClaimAddressForOperator(
    claimer: PromiseOrValue<string>,
    operator: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setCommissionRate(
    commission: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setOperatorStatus(
    operator: PromiseOrValue<string>,
    newStatus: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    getClaimAddressForOperator(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    getCommissionRate(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getOperatorStatus(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<number>;

    getOperators(overrides?: CallOverrides): Promise<string[]>;

    isOperator(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    registerOperator(
      claimer: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    setClaimAddressForOperator(
      claimer: PromiseOrValue<string>,
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    setCommissionRate(
      commission: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    setOperatorStatus(
      operator: PromiseOrValue<string>,
      newStatus: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "OperatorClaimAddressChanged(address,address)"(
      operator?: PromiseOrValue<string> | null,
      claimAddress?: PromiseOrValue<string> | null
    ): OperatorClaimAddressChangedEventFilter;
    OperatorClaimAddressChanged(
      operator?: PromiseOrValue<string> | null,
      claimAddress?: PromiseOrValue<string> | null
    ): OperatorClaimAddressChangedEventFilter;

    "OperatorCommissionChanged(address,uint256)"(
      operator?: PromiseOrValue<string> | null,
      commission?: PromiseOrValue<BigNumberish> | null
    ): OperatorCommissionChangedEventFilter;
    OperatorCommissionChanged(
      operator?: PromiseOrValue<string> | null,
      commission?: PromiseOrValue<BigNumberish> | null
    ): OperatorCommissionChangedEventFilter;

    "OperatorRegistered(address)"(
      operator?: PromiseOrValue<string> | null
    ): OperatorRegisteredEventFilter;
    OperatorRegistered(
      operator?: PromiseOrValue<string> | null
    ): OperatorRegisteredEventFilter;

    "OperatorStatusChanged(address,uint8)"(
      operator?: PromiseOrValue<string> | null,
      newStatus?: PromiseOrValue<BigNumberish> | null
    ): OperatorStatusChangedEventFilter;
    OperatorStatusChanged(
      operator?: PromiseOrValue<string> | null,
      newStatus?: PromiseOrValue<BigNumberish> | null
    ): OperatorStatusChangedEventFilter;
  };

  estimateGas: {
    getClaimAddressForOperator(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getCommissionRate(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getOperatorStatus(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getOperators(overrides?: CallOverrides): Promise<BigNumber>;

    isOperator(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    registerOperator(
      claimer: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setClaimAddressForOperator(
      claimer: PromiseOrValue<string>,
      operator: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setCommissionRate(
      commission: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setOperatorStatus(
      operator: PromiseOrValue<string>,
      newStatus: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getClaimAddressForOperator(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getCommissionRate(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getOperatorStatus(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getOperators(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isOperator(
      operator: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    registerOperator(
      claimer: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setClaimAddressForOperator(
      claimer: PromiseOrValue<string>,
      operator: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setCommissionRate(
      commission: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setOperatorStatus(
      operator: PromiseOrValue<string>,
      newStatus: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}

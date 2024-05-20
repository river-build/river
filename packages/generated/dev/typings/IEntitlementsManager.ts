/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
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

export declare namespace IEntitlementsManager {
  export type EntitlementDataStruct = {
    entitlementType: PromiseOrValue<string>;
    entitlementData: PromiseOrValue<BytesLike>;
  };

  export type EntitlementDataStructOutput = [string, string] & {
    entitlementType: string;
    entitlementData: string;
  };
}

export declare namespace IEntitlementsManagerBase {
  export type EntitlementStruct = {
    name: PromiseOrValue<string>;
    moduleAddress: PromiseOrValue<string>;
    moduleType: PromiseOrValue<string>;
    isImmutable: PromiseOrValue<boolean>;
  };

  export type EntitlementStructOutput = [string, string, string, boolean] & {
    name: string;
    moduleAddress: string;
    moduleType: string;
    isImmutable: boolean;
  };
}

export interface IEntitlementsManagerInterface extends utils.Interface {
  functions: {
    "addEntitlementModule(address)": FunctionFragment;
    "addImmutableEntitlements(address[])": FunctionFragment;
    "getChannelEntitlementDataByPermission(bytes32,string)": FunctionFragment;
    "getEntitlement(address)": FunctionFragment;
    "getEntitlementDataByPermission(string)": FunctionFragment;
    "getEntitlements()": FunctionFragment;
    "isEntitledToChannel(bytes32,address,string)": FunctionFragment;
    "isEntitledToSpace(address,string)": FunctionFragment;
    "removeEntitlementModule(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "addEntitlementModule"
      | "addImmutableEntitlements"
      | "getChannelEntitlementDataByPermission"
      | "getEntitlement"
      | "getEntitlementDataByPermission"
      | "getEntitlements"
      | "isEntitledToChannel"
      | "isEntitledToSpace"
      | "removeEntitlementModule"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "addEntitlementModule",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "addImmutableEntitlements",
    values: [PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getChannelEntitlementDataByPermission",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getEntitlement",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getEntitlementDataByPermission",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getEntitlements",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "isEntitledToChannel",
    values: [
      PromiseOrValue<BytesLike>,
      PromiseOrValue<string>,
      PromiseOrValue<string>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "isEntitledToSpace",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "removeEntitlementModule",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "addEntitlementModule",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "addImmutableEntitlements",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getChannelEntitlementDataByPermission",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getEntitlement",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getEntitlementDataByPermission",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getEntitlements",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isEntitledToChannel",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isEntitledToSpace",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeEntitlementModule",
    data: BytesLike
  ): Result;

  events: {
    "EntitlementModuleAdded(address,address)": EventFragment;
    "EntitlementModuleRemoved(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "EntitlementModuleAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "EntitlementModuleRemoved"): EventFragment;
}

export interface EntitlementModuleAddedEventObject {
  caller: string;
  entitlement: string;
}
export type EntitlementModuleAddedEvent = TypedEvent<
  [string, string],
  EntitlementModuleAddedEventObject
>;

export type EntitlementModuleAddedEventFilter =
  TypedEventFilter<EntitlementModuleAddedEvent>;

export interface EntitlementModuleRemovedEventObject {
  caller: string;
  entitlement: string;
}
export type EntitlementModuleRemovedEvent = TypedEvent<
  [string, string],
  EntitlementModuleRemovedEventObject
>;

export type EntitlementModuleRemovedEventFilter =
  TypedEventFilter<EntitlementModuleRemovedEvent>;

export interface IEntitlementsManager extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IEntitlementsManagerInterface;

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
    addEntitlementModule(
      entitlement: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    addImmutableEntitlements(
      entitlements: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getChannelEntitlementDataByPermission(
      channelId: PromiseOrValue<BytesLike>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[IEntitlementsManager.EntitlementDataStructOutput[]]>;

    getEntitlement(
      entitlement: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<
      [IEntitlementsManagerBase.EntitlementStructOutput] & {
        entitlements: IEntitlementsManagerBase.EntitlementStructOutput;
      }
    >;

    getEntitlementDataByPermission(
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[IEntitlementsManager.EntitlementDataStructOutput[]]>;

    getEntitlements(
      overrides?: CallOverrides
    ): Promise<
      [IEntitlementsManagerBase.EntitlementStructOutput[]] & {
        entitlements: IEntitlementsManagerBase.EntitlementStructOutput[];
      }
    >;

    isEntitledToChannel(
      channelId: PromiseOrValue<BytesLike>,
      user: PromiseOrValue<string>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    isEntitledToSpace(
      user: PromiseOrValue<string>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    removeEntitlementModule(
      entitlement: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  addEntitlementModule(
    entitlement: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  addImmutableEntitlements(
    entitlements: PromiseOrValue<string>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getChannelEntitlementDataByPermission(
    channelId: PromiseOrValue<BytesLike>,
    permission: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<IEntitlementsManager.EntitlementDataStructOutput[]>;

  getEntitlement(
    entitlement: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<IEntitlementsManagerBase.EntitlementStructOutput>;

  getEntitlementDataByPermission(
    permission: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<IEntitlementsManager.EntitlementDataStructOutput[]>;

  getEntitlements(
    overrides?: CallOverrides
  ): Promise<IEntitlementsManagerBase.EntitlementStructOutput[]>;

  isEntitledToChannel(
    channelId: PromiseOrValue<BytesLike>,
    user: PromiseOrValue<string>,
    permission: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  isEntitledToSpace(
    user: PromiseOrValue<string>,
    permission: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  removeEntitlementModule(
    entitlement: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    addEntitlementModule(
      entitlement: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    addImmutableEntitlements(
      entitlements: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<void>;

    getChannelEntitlementDataByPermission(
      channelId: PromiseOrValue<BytesLike>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<IEntitlementsManager.EntitlementDataStructOutput[]>;

    getEntitlement(
      entitlement: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<IEntitlementsManagerBase.EntitlementStructOutput>;

    getEntitlementDataByPermission(
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<IEntitlementsManager.EntitlementDataStructOutput[]>;

    getEntitlements(
      overrides?: CallOverrides
    ): Promise<IEntitlementsManagerBase.EntitlementStructOutput[]>;

    isEntitledToChannel(
      channelId: PromiseOrValue<BytesLike>,
      user: PromiseOrValue<string>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    isEntitledToSpace(
      user: PromiseOrValue<string>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    removeEntitlementModule(
      entitlement: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "EntitlementModuleAdded(address,address)"(
      caller?: PromiseOrValue<string> | null,
      entitlement?: null
    ): EntitlementModuleAddedEventFilter;
    EntitlementModuleAdded(
      caller?: PromiseOrValue<string> | null,
      entitlement?: null
    ): EntitlementModuleAddedEventFilter;

    "EntitlementModuleRemoved(address,address)"(
      caller?: PromiseOrValue<string> | null,
      entitlement?: null
    ): EntitlementModuleRemovedEventFilter;
    EntitlementModuleRemoved(
      caller?: PromiseOrValue<string> | null,
      entitlement?: null
    ): EntitlementModuleRemovedEventFilter;
  };

  estimateGas: {
    addEntitlementModule(
      entitlement: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    addImmutableEntitlements(
      entitlements: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getChannelEntitlementDataByPermission(
      channelId: PromiseOrValue<BytesLike>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getEntitlement(
      entitlement: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getEntitlementDataByPermission(
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getEntitlements(overrides?: CallOverrides): Promise<BigNumber>;

    isEntitledToChannel(
      channelId: PromiseOrValue<BytesLike>,
      user: PromiseOrValue<string>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isEntitledToSpace(
      user: PromiseOrValue<string>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    removeEntitlementModule(
      entitlement: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    addEntitlementModule(
      entitlement: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    addImmutableEntitlements(
      entitlements: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getChannelEntitlementDataByPermission(
      channelId: PromiseOrValue<BytesLike>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getEntitlement(
      entitlement: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getEntitlementDataByPermission(
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getEntitlements(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isEntitledToChannel(
      channelId: PromiseOrValue<BytesLike>,
      user: PromiseOrValue<string>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isEntitledToSpace(
      user: PromiseOrValue<string>,
      permission: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    removeEntitlementModule(
      entitlement: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}

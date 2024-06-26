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

export interface IProxyManagerInterface extends utils.Interface {
  functions: {
    "getImplementation(bytes4)": FunctionFragment;
    "setImplementation(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic: "getImplementation" | "setImplementation"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "getImplementation",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "setImplementation",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "getImplementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setImplementation",
    data: BytesLike
  ): Result;

  events: {
    "ProxyManager__ImplementationSet(address)": EventFragment;
  };

  getEvent(
    nameOrSignatureOrTopic: "ProxyManager__ImplementationSet"
  ): EventFragment;
}

export interface ProxyManager__ImplementationSetEventObject {
  implementation: string;
}
export type ProxyManager__ImplementationSetEvent = TypedEvent<
  [string],
  ProxyManager__ImplementationSetEventObject
>;

export type ProxyManager__ImplementationSetEventFilter =
  TypedEventFilter<ProxyManager__ImplementationSetEvent>;

export interface IProxyManager extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IProxyManagerInterface;

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
    getImplementation(
      selector: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    setImplementation(
      implementation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  getImplementation(
    selector: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<string>;

  setImplementation(
    implementation: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    getImplementation(
      selector: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    setImplementation(
      implementation: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "ProxyManager__ImplementationSet(address)"(
      implementation?: null
    ): ProxyManager__ImplementationSetEventFilter;
    ProxyManager__ImplementationSet(
      implementation?: null
    ): ProxyManager__ImplementationSetEventFilter;
  };

  estimateGas: {
    getImplementation(
      selector: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setImplementation(
      implementation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getImplementation(
      selector: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setImplementation(
      implementation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}

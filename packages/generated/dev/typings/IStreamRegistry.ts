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

export type StreamStruct = {
  lastMiniblockHash: PromiseOrValue<BytesLike>;
  lastMiniblockNum: PromiseOrValue<BigNumberish>;
  reserved0: PromiseOrValue<BigNumberish>;
  flags: PromiseOrValue<BigNumberish>;
  nodes: PromiseOrValue<string>[];
};

export type StreamStructOutput = [
  string,
  BigNumber,
  BigNumber,
  BigNumber,
  string[]
] & {
  lastMiniblockHash: string;
  lastMiniblockNum: BigNumber;
  reserved0: BigNumber;
  flags: BigNumber;
  nodes: string[];
};

export type StreamWithIdStruct = {
  id: PromiseOrValue<BytesLike>;
  stream: StreamStruct;
};

export type StreamWithIdStructOutput = [string, StreamStructOutput] & {
  id: string;
  stream: StreamStructOutput;
};

export type SetMiniblockStruct = {
  streamId: PromiseOrValue<BytesLike>;
  prevMiniBlockHash: PromiseOrValue<BytesLike>;
  lastMiniblockHash: PromiseOrValue<BytesLike>;
  lastMiniblockNum: PromiseOrValue<BigNumberish>;
  isSealed: PromiseOrValue<boolean>;
};

export type SetMiniblockStructOutput = [
  string,
  string,
  string,
  BigNumber,
  boolean
] & {
  streamId: string;
  prevMiniBlockHash: string;
  lastMiniblockHash: string;
  lastMiniblockNum: BigNumber;
  isSealed: boolean;
};

export interface IStreamRegistryInterface extends utils.Interface {
  functions: {
    "allocateStream(bytes32,address[],bytes32,bytes)": FunctionFragment;
    "getPaginatedStreams(uint256,uint256)": FunctionFragment;
    "getStream(bytes32)": FunctionFragment;
    "getStreamCount()": FunctionFragment;
    "getStreamCountOnNode(address)": FunctionFragment;
    "getStreamWithGenesis(bytes32)": FunctionFragment;
    "isStream(bytes32)": FunctionFragment;
    "placeStreamOnNode(bytes32,address)": FunctionFragment;
    "removeStreamFromNode(bytes32,address)": FunctionFragment;
    "setStreamLastMiniblockBatch((bytes32,bytes32,bytes32,uint64,bool)[])": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "allocateStream"
      | "getPaginatedStreams"
      | "getStream"
      | "getStreamCount"
      | "getStreamCountOnNode"
      | "getStreamWithGenesis"
      | "isStream"
      | "placeStreamOnNode"
      | "removeStreamFromNode"
      | "setStreamLastMiniblockBatch"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "allocateStream",
    values: [
      PromiseOrValue<BytesLike>,
      PromiseOrValue<string>[],
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getPaginatedStreams",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getStream",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "getStreamCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getStreamCountOnNode",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getStreamWithGenesis",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "isStream",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "placeStreamOnNode",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "removeStreamFromNode",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setStreamLastMiniblockBatch",
    values: [SetMiniblockStruct[]]
  ): string;

  decodeFunctionResult(
    functionFragment: "allocateStream",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getPaginatedStreams",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getStream", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getStreamCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getStreamCountOnNode",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getStreamWithGenesis",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "isStream", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "placeStreamOnNode",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeStreamFromNode",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setStreamLastMiniblockBatch",
    data: BytesLike
  ): Result;

  events: {
    "StreamAllocated(bytes32,address[],bytes32,bytes)": EventFragment;
    "StreamLastMiniblockUpdateFailed(bytes32,bytes32,uint64,string)": EventFragment;
    "StreamLastMiniblockUpdated(bytes32,bytes32,uint64,bool)": EventFragment;
    "StreamPlacementUpdated(bytes32,address,bool)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "StreamAllocated"): EventFragment;
  getEvent(
    nameOrSignatureOrTopic: "StreamLastMiniblockUpdateFailed"
  ): EventFragment;
  getEvent(nameOrSignatureOrTopic: "StreamLastMiniblockUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "StreamPlacementUpdated"): EventFragment;
}

export interface StreamAllocatedEventObject {
  streamId: string;
  nodes: string[];
  genesisMiniblockHash: string;
  genesisMiniblock: string;
}
export type StreamAllocatedEvent = TypedEvent<
  [string, string[], string, string],
  StreamAllocatedEventObject
>;

export type StreamAllocatedEventFilter = TypedEventFilter<StreamAllocatedEvent>;

export interface StreamLastMiniblockUpdateFailedEventObject {
  streamId: string;
  lastMiniblockHash: string;
  lastMiniblockNum: BigNumber;
  reason: string;
}
export type StreamLastMiniblockUpdateFailedEvent = TypedEvent<
  [string, string, BigNumber, string],
  StreamLastMiniblockUpdateFailedEventObject
>;

export type StreamLastMiniblockUpdateFailedEventFilter =
  TypedEventFilter<StreamLastMiniblockUpdateFailedEvent>;

export interface StreamLastMiniblockUpdatedEventObject {
  streamId: string;
  lastMiniblockHash: string;
  lastMiniblockNum: BigNumber;
  isSealed: boolean;
}
export type StreamLastMiniblockUpdatedEvent = TypedEvent<
  [string, string, BigNumber, boolean],
  StreamLastMiniblockUpdatedEventObject
>;

export type StreamLastMiniblockUpdatedEventFilter =
  TypedEventFilter<StreamLastMiniblockUpdatedEvent>;

export interface StreamPlacementUpdatedEventObject {
  streamId: string;
  nodeAddress: string;
  isAdded: boolean;
}
export type StreamPlacementUpdatedEvent = TypedEvent<
  [string, string, boolean],
  StreamPlacementUpdatedEventObject
>;

export type StreamPlacementUpdatedEventFilter =
  TypedEventFilter<StreamPlacementUpdatedEvent>;

export interface IStreamRegistry extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IStreamRegistryInterface;

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
    allocateStream(
      streamId: PromiseOrValue<BytesLike>,
      nodes: PromiseOrValue<string>[],
      genesisMiniblockHash: PromiseOrValue<BytesLike>,
      genesisMiniblock: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getPaginatedStreams(
      start: PromiseOrValue<BigNumberish>,
      stop: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[StreamWithIdStructOutput[], boolean]>;

    getStream(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[StreamStructOutput]>;

    getStreamCount(overrides?: CallOverrides): Promise<[BigNumber]>;

    getStreamCountOnNode(
      nodeAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getStreamWithGenesis(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[StreamStructOutput, string, string]>;

    isStream(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    placeStreamOnNode(
      streamId: PromiseOrValue<BytesLike>,
      nodeAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    removeStreamFromNode(
      streamId: PromiseOrValue<BytesLike>,
      nodeAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setStreamLastMiniblockBatch(
      miniblocks: SetMiniblockStruct[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  allocateStream(
    streamId: PromiseOrValue<BytesLike>,
    nodes: PromiseOrValue<string>[],
    genesisMiniblockHash: PromiseOrValue<BytesLike>,
    genesisMiniblock: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getPaginatedStreams(
    start: PromiseOrValue<BigNumberish>,
    stop: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<[StreamWithIdStructOutput[], boolean]>;

  getStream(
    streamId: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<StreamStructOutput>;

  getStreamCount(overrides?: CallOverrides): Promise<BigNumber>;

  getStreamCountOnNode(
    nodeAddress: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getStreamWithGenesis(
    streamId: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<[StreamStructOutput, string, string]>;

  isStream(
    streamId: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  placeStreamOnNode(
    streamId: PromiseOrValue<BytesLike>,
    nodeAddress: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  removeStreamFromNode(
    streamId: PromiseOrValue<BytesLike>,
    nodeAddress: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setStreamLastMiniblockBatch(
    miniblocks: SetMiniblockStruct[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    allocateStream(
      streamId: PromiseOrValue<BytesLike>,
      nodes: PromiseOrValue<string>[],
      genesisMiniblockHash: PromiseOrValue<BytesLike>,
      genesisMiniblock: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    getPaginatedStreams(
      start: PromiseOrValue<BigNumberish>,
      stop: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[StreamWithIdStructOutput[], boolean]>;

    getStream(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<StreamStructOutput>;

    getStreamCount(overrides?: CallOverrides): Promise<BigNumber>;

    getStreamCountOnNode(
      nodeAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getStreamWithGenesis(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[StreamStructOutput, string, string]>;

    isStream(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    placeStreamOnNode(
      streamId: PromiseOrValue<BytesLike>,
      nodeAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    removeStreamFromNode(
      streamId: PromiseOrValue<BytesLike>,
      nodeAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    setStreamLastMiniblockBatch(
      miniblocks: SetMiniblockStruct[],
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "StreamAllocated(bytes32,address[],bytes32,bytes)"(
      streamId?: null,
      nodes?: null,
      genesisMiniblockHash?: null,
      genesisMiniblock?: null
    ): StreamAllocatedEventFilter;
    StreamAllocated(
      streamId?: null,
      nodes?: null,
      genesisMiniblockHash?: null,
      genesisMiniblock?: null
    ): StreamAllocatedEventFilter;

    "StreamLastMiniblockUpdateFailed(bytes32,bytes32,uint64,string)"(
      streamId?: null,
      lastMiniblockHash?: null,
      lastMiniblockNum?: null,
      reason?: null
    ): StreamLastMiniblockUpdateFailedEventFilter;
    StreamLastMiniblockUpdateFailed(
      streamId?: null,
      lastMiniblockHash?: null,
      lastMiniblockNum?: null,
      reason?: null
    ): StreamLastMiniblockUpdateFailedEventFilter;

    "StreamLastMiniblockUpdated(bytes32,bytes32,uint64,bool)"(
      streamId?: null,
      lastMiniblockHash?: null,
      lastMiniblockNum?: null,
      isSealed?: null
    ): StreamLastMiniblockUpdatedEventFilter;
    StreamLastMiniblockUpdated(
      streamId?: null,
      lastMiniblockHash?: null,
      lastMiniblockNum?: null,
      isSealed?: null
    ): StreamLastMiniblockUpdatedEventFilter;

    "StreamPlacementUpdated(bytes32,address,bool)"(
      streamId?: null,
      nodeAddress?: null,
      isAdded?: null
    ): StreamPlacementUpdatedEventFilter;
    StreamPlacementUpdated(
      streamId?: null,
      nodeAddress?: null,
      isAdded?: null
    ): StreamPlacementUpdatedEventFilter;
  };

  estimateGas: {
    allocateStream(
      streamId: PromiseOrValue<BytesLike>,
      nodes: PromiseOrValue<string>[],
      genesisMiniblockHash: PromiseOrValue<BytesLike>,
      genesisMiniblock: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getPaginatedStreams(
      start: PromiseOrValue<BigNumberish>,
      stop: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getStream(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getStreamCount(overrides?: CallOverrides): Promise<BigNumber>;

    getStreamCountOnNode(
      nodeAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getStreamWithGenesis(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isStream(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    placeStreamOnNode(
      streamId: PromiseOrValue<BytesLike>,
      nodeAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    removeStreamFromNode(
      streamId: PromiseOrValue<BytesLike>,
      nodeAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setStreamLastMiniblockBatch(
      miniblocks: SetMiniblockStruct[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    allocateStream(
      streamId: PromiseOrValue<BytesLike>,
      nodes: PromiseOrValue<string>[],
      genesisMiniblockHash: PromiseOrValue<BytesLike>,
      genesisMiniblock: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getPaginatedStreams(
      start: PromiseOrValue<BigNumberish>,
      stop: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getStream(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getStreamCount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getStreamCountOnNode(
      nodeAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getStreamWithGenesis(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isStream(
      streamId: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    placeStreamOnNode(
      streamId: PromiseOrValue<BytesLike>,
      nodeAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    removeStreamFromNode(
      streamId: PromiseOrValue<BytesLike>,
      nodeAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setStreamLastMiniblockBatch(
      miniblocks: SetMiniblockStruct[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}

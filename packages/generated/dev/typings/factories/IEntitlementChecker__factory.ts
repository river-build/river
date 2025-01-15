/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IEntitlementChecker,
  IEntitlementCheckerInterface,
} from "../IEntitlementChecker";

const _abi = [
  {
    type: "function",
    name: "getNodeAtIndex",
    inputs: [
      {
        name: "index",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getNodeCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getNodesByOperator",
    inputs: [
      {
        name: "operator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRandomNodes",
    inputs: [
      {
        name: "count",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isValidNode",
    inputs: [
      {
        name: "node",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerNode",
    inputs: [
      {
        name: "node",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestEntitlementCheck",
    inputs: [
      {
        name: "callerAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "transactionId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "roleId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "nodes",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestEntitlementCheckV2",
    inputs: [
      {
        name: "walletAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "transactionId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "requestId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "unregisterNode",
    inputs: [
      {
        name: "node",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "EntitlementCheckRequested",
    inputs: [
      {
        name: "callerAddress",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "contractAddress",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "transactionId",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "roleId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "selectedNodes",
        type: "address[]",
        indexed: false,
        internalType: "address[]",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "EntitlementCheckRequestedV2",
    inputs: [
      {
        name: "walletAddress",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "spaceAddress",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "resolverAddress",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "transactionId",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "roleId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "selectedNodes",
        type: "address[]",
        indexed: false,
        internalType: "address[]",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "NodeRegistered",
    inputs: [
      {
        name: "nodeAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "NodeUnregistered",
    inputs: [
      {
        name: "nodeAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "EntitlementChecker_InsufficientNumberOfNodes",
    inputs: [],
  },
  {
    type: "error",
    name: "EntitlementChecker_InvalidNodeOperator",
    inputs: [],
  },
  {
    type: "error",
    name: "EntitlementChecker_InvalidOperator",
    inputs: [],
  },
  {
    type: "error",
    name: "EntitlementChecker_NodeAlreadyRegistered",
    inputs: [],
  },
  {
    type: "error",
    name: "EntitlementChecker_NodeNotRegistered",
    inputs: [],
  },
  {
    type: "error",
    name: "EntitlementChecker_OperatorNotActive",
    inputs: [],
  },
] as const;

export class IEntitlementChecker__factory {
  static readonly abi = _abi;
  static createInterface(): IEntitlementCheckerInterface {
    return new utils.Interface(_abi) as IEntitlementCheckerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IEntitlementChecker {
    return new Contract(address, _abi, signerOrProvider) as IEntitlementChecker;
  }
}

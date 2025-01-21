/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ITownsPoints, ITownsPointsInterface } from "../ITownsPoints";

const _abi = [
  {
    type: "function",
    name: "batchMintPoints",
    inputs: [
      {
        name: "data",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "checkIn",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getCurrentStreak",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
    ],
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
    name: "getLastCheckIn",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
    ],
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
    name: "getPoints",
    inputs: [
      {
        name: "action",
        type: "uint8",
        internalType: "enum ITownsPointsBase.Action",
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes",
      },
    ],
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
    name: "mint",
    inputs: [
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "CheckedIn",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "points",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "streak",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "lastCheckIn",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "TownsPoints__CheckInPeriodNotPassed",
    inputs: [],
  },
  {
    type: "error",
    name: "TownsPoints__InvalidArrayLength",
    inputs: [],
  },
  {
    type: "error",
    name: "TownsPoints__InvalidCallData",
    inputs: [],
  },
  {
    type: "error",
    name: "TownsPoints__InvalidSpace",
    inputs: [],
  },
] as const;

export class ITownsPoints__factory {
  static readonly abi = _abi;
  static createInterface(): ITownsPointsInterface {
    return new utils.Interface(_abi) as ITownsPointsInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ITownsPoints {
    return new Contract(address, _abi, signerOrProvider) as ITownsPoints;
  }
}

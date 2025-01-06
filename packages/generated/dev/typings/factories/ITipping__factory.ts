/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ITipping, ITippingInterface } from "../ITipping";

const _abi = [
  {
    type: "function",
    name: "tip",
    inputs: [
      {
        name: "tipRequest",
        type: "tuple",
        internalType: "struct ITippingBase.TipRequest",
        components: [
          {
            name: "tokenId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "currency",
            type: "address",
            internalType: "address",
          },
          {
            name: "amount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "messageId",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "channelId",
            type: "bytes32",
            internalType: "bytes32",
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "tipAmountByCurrency",
    inputs: [
      {
        name: "currency",
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
    name: "tippingCurrencies",
    inputs: [],
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
    name: "tipsByCurrencyAndTokenId",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "currency",
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
    name: "totalTipsByCurrency",
    inputs: [
      {
        name: "currency",
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
    type: "event",
    name: "Tip",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "currency",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "sender",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "receiver",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "messageId",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "channelId",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "AmountIsZero",
    inputs: [],
  },
  {
    type: "error",
    name: "CannotTipSelf",
    inputs: [],
  },
  {
    type: "error",
    name: "CurrencyIsZero",
    inputs: [],
  },
  {
    type: "error",
    name: "ReceiverIsNotMember",
    inputs: [],
  },
  {
    type: "error",
    name: "TokenDoesNotExist",
    inputs: [],
  },
] as const;

export class ITipping__factory {
  static readonly abi = _abi;
  static createInterface(): ITippingInterface {
    return new utils.Interface(_abi) as ITippingInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ITipping {
    return new Contract(address, _abi, signerOrProvider) as ITipping;
  }
}

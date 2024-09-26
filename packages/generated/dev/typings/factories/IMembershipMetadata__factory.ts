/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IMembershipMetadata,
  IMembershipMetadataInterface,
} from "../IMembershipMetadata";

const _abi = [
  {
    type: "function",
    name: "refreshMetadata",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "BatchMetadataUpdate",
    inputs: [
      {
        name: "_fromTokenId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "_toTokenId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MetadataUpdate",
    inputs: [
      {
        name: "_tokenId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

export class IMembershipMetadata__factory {
  static readonly abi = _abi;
  static createInterface(): IMembershipMetadataInterface {
    return new utils.Interface(_abi) as IMembershipMetadataInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IMembershipMetadata {
    return new Contract(address, _abi, signerOrProvider) as IMembershipMetadata;
  }
}

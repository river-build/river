/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IERC5267, IERC5267Interface } from "../../cryptography/IERC5267";

const _abi = [
  {
    type: "function",
    name: "eip712Domain",
    inputs: [],
    outputs: [
      {
        name: "fields",
        type: "bytes1",
        internalType: "bytes1",
      },
      {
        name: "name",
        type: "string",
        internalType: "string",
      },
      {
        name: "version",
        type: "string",
        internalType: "string",
      },
      {
        name: "chainId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "verifyingContract",
        type: "address",
        internalType: "address",
      },
      {
        name: "salt",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "extensions",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "EIP712DomainChanged",
    inputs: [],
    anonymous: false,
  },
] as const;

export class IERC5267__factory {
  static readonly abi = _abi;
  static createInterface(): IERC5267Interface {
    return new utils.Interface(_abi) as IERC5267Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IERC5267 {
    return new Contract(address, _abi, signerOrProvider) as IERC5267;
  }
}

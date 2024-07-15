/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IEntitlementDataQueryableV2,
  IEntitlementDataQueryableV2Interface,
} from "../IEntitlementDataQueryableV2";

const _abi = [
  {
    type: "function",
    name: "getChannelEntitlementDataByPermission",
    inputs: [
      {
        name: "channelId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "permission",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct IEntitlementDataQueryableBase.EntitlementData[]",
        components: [
          {
            name: "entitlementType",
            type: "string",
            internalType: "string",
          },
          {
            name: "entitlementData",
            type: "bytes",
            internalType: "bytes",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getChannelEntitlementDataByPermissionV2",
    inputs: [
      {
        name: "channelId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "permission",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType:
          "struct IEntitlementDataQueryableBaseV2.EntitlementData[]",
        components: [
          {
            name: "entitlementType",
            type: "string",
            internalType: "string",
          },
          {
            name: "entitlementData",
            type: "bytes",
            internalType: "bytes",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEntitlementDataByPermission",
    inputs: [
      {
        name: "permission",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct IEntitlementDataQueryableBase.EntitlementData[]",
        components: [
          {
            name: "entitlementType",
            type: "string",
            internalType: "string",
          },
          {
            name: "entitlementData",
            type: "bytes",
            internalType: "bytes",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEntitlementDataByPermissionV2",
    inputs: [
      {
        name: "permission",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType:
          "struct IEntitlementDataQueryableBaseV2.EntitlementData[]",
        components: [
          {
            name: "entitlementType",
            type: "string",
            internalType: "string",
          },
          {
            name: "entitlementData",
            type: "bytes",
            internalType: "bytes",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

export class IEntitlementDataQueryableV2__factory {
  static readonly abi = _abi;
  static createInterface(): IEntitlementDataQueryableV2Interface {
    return new utils.Interface(_abi) as IEntitlementDataQueryableV2Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IEntitlementDataQueryableV2 {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as IEntitlementDataQueryableV2;
  }
}

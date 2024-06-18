/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { PrepayFacet, PrepayFacetInterface } from "../PrepayFacet";

const _abi = [
  {
    type: "function",
    name: "__PrepayFacet_init",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "calculateMembershipPrepayFee",
    inputs: [
      {
        name: "supply",
        type: "uint256",
        internalType: "uint256",
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
    name: "prepaidMembershipSupply",
    inputs: [
      {
        name: "account",
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
    name: "prepayMembership",
    inputs: [
      {
        name: "membership",
        type: "address",
        internalType: "address",
      },
      {
        name: "supply",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "event",
    name: "Initialized",
    inputs: [
      {
        name: "version",
        type: "uint32",
        indexed: false,
        internalType: "uint32",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "InterfaceAdded",
    inputs: [
      {
        name: "interfaceId",
        type: "bytes4",
        indexed: true,
        internalType: "bytes4",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "InterfaceRemoved",
    inputs: [
      {
        name: "interfaceId",
        type: "bytes4",
        indexed: true,
        internalType: "bytes4",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlatformFeeRecipientSet",
    inputs: [
      {
        name: "recipient",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlatformMembershipBpsSet",
    inputs: [
      {
        name: "bps",
        type: "uint16",
        indexed: false,
        internalType: "uint16",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlatformMembershipDurationSet",
    inputs: [
      {
        name: "duration",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlatformMembershipFeeSet",
    inputs: [
      {
        name: "fee",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlatformMembershipMinPriceSet",
    inputs: [
      {
        name: "minPrice",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlatformMembershipMintLimitSet",
    inputs: [
      {
        name: "limit",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PrepayBase__Prepaid",
    inputs: [
      {
        name: "membership",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "supply",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "Initializable_InInitializingState",
    inputs: [],
  },
  {
    type: "error",
    name: "Initializable_NotInInitializingState",
    inputs: [],
  },
  {
    type: "error",
    name: "Introspection_AlreadySupported",
    inputs: [],
  },
  {
    type: "error",
    name: "Introspection_NotSupported",
    inputs: [],
  },
  {
    type: "error",
    name: "Platform__InvalidFeeRecipient",
    inputs: [],
  },
  {
    type: "error",
    name: "Platform__InvalidMembershipBps",
    inputs: [],
  },
  {
    type: "error",
    name: "Platform__InvalidMembershipDuration",
    inputs: [],
  },
  {
    type: "error",
    name: "Platform__InvalidMembershipMinPrice",
    inputs: [],
  },
  {
    type: "error",
    name: "Platform__InvalidMembershipMintLimit",
    inputs: [],
  },
  {
    type: "error",
    name: "PrepayBase__InvalidAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "PrepayBase__InvalidAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "PrepayBase__InvalidMembership",
    inputs: [],
  },
  {
    type: "error",
    name: "ReentrancyGuard__ReentrantCall",
    inputs: [],
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b5061001961001e565b6100c4565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef520008054640100000000900460ff161561006a576040516366008a2d60e01b815260040160405180910390fd5b805463ffffffff90811610156100c157805463ffffffff191663ffffffff90811782556040519081527fe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c9060200160405180910390a15b50565b6106f6806100d36000396000f3fe60806040526004361061003f5760003560e01c806327bc79f11461004457806386272406146100765780639262b1b31461008b578063aabe967d146100ab575b600080fd5b34801561005057600080fd5b5061006461005f3660046105ff565b6100c0565b60405190815260200160405180910390f35b610089610084366004610630565b6100d1565b005b34801561009757600080fd5b506100646100a636600461065c565b61032e565b3480156100b757600080fd5b5061008961036b565b60006100cb826103c7565b92915050565b60027f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a00540361011357604051635db5c7cd60e11b815260040160405180910390fd5b61013c60027f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0055565b8060000361015d57604051632484b54d60e01b815260040160405180910390fd5b6001600160a01b03821661018457604051631ea9dac160e21b815260040160405180910390fd5b336001600160a01b0316826001600160a01b0316638da5cb5b6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156101cc573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101f09190610680565b6001600160a01b03161461021757604051631ea9dac160e21b815260040160405180910390fd5b600061024a7fb29a817dd0719f30ad87abc8dff26e6354077e5b46bf38f34d5ac48732860d02546001600160a01b031690565b90506000610257836103c7565b905080341461027957604051632484b54d60e01b815260040160405180910390fd5b600083856001600160a01b03166318160ddd6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156102ba573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102de919061069d565b6102e891906106cc565b90506102f485826103fb565b6102fe8383610475565b50505061032a60017f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0055565b5050565b6001600160a01b03811660009081527f097b4f25b64e012d0cf55f67e9b34fe5d57f15b11b95baa4ddd136b424967c0060205260408120546100cb565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef5200054640100000000900460ff166103b557604051630ef4733760e31b815260040160405180910390fd5b6103c5630cfe7b1160e21b610521565b565b60006103f17fb29a817dd0719f30ad87abc8dff26e6354077e5b46bf38f34d5ac48732860d005490565b6100cb90836106df565b60007f097b4f25b64e012d0cf55f67e9b34fe5d57f15b11b95baa4ddd136b424967c006001600160a01b03841660008181526020838152604091829020869055905185815292935090917f884527d8d797310d66e571e2a24daeddc15ae52474ef2c763ab29b60c5678369910160405180910390a2505050565b6000826001600160a01b03168260405160006040518083038185875af1925050503d80600081146104c2576040519150601f19603f3d011682016040523d82523d6000602084013e6104c7565b606091505b505090508061051c5760405162461bcd60e51b815260206004820152601c60248201527f6e617469766520746f6b656e207472616e73666572206661696c656400000000604482015260640160405180910390fd5b505050565b6001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b00602052604090205460ff1615156001146105ae576001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b0060205260409020805460ff191660011790556105c7565b604051637967f77d60e11b815260040160405180910390fd5b6040516001600160e01b03198216907f78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f2290600090a250565b60006020828403121561061157600080fd5b5035919050565b6001600160a01b038116811461062d57600080fd5b50565b6000806040838503121561064357600080fd5b823561064e81610618565b946020939093013593505050565b60006020828403121561066e57600080fd5b813561067981610618565b9392505050565b60006020828403121561069257600080fd5b815161067981610618565b6000602082840312156106af57600080fd5b5051919050565b634e487b7160e01b600052601160045260246000fd5b808201808211156100cb576100cb6106b6565b80820281158282048414176100cb576100cb6106b656";

type PrepayFacetConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: PrepayFacetConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class PrepayFacet__factory extends ContractFactory {
  constructor(...args: PrepayFacetConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<PrepayFacet> {
    return super.deploy(overrides || {}) as Promise<PrepayFacet>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): PrepayFacet {
    return super.attach(address) as PrepayFacet;
  }
  override connect(signer: Signer): PrepayFacet__factory {
    return super.connect(signer) as PrepayFacet__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): PrepayFacetInterface {
    return new utils.Interface(_abi) as PrepayFacetInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): PrepayFacet {
    return new Contract(address, _abi, signerOrProvider) as PrepayFacet;
  }
}

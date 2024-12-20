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
    name: "prepayMembership",
    inputs: [
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
    name: "Approval",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "approved",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ApprovalForAll",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "operator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "approved",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Banned",
    inputs: [
      {
        name: "moderator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ConsecutiveTransfer",
    inputs: [
      {
        name: "fromTokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "toTokenId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
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
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Paused",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Prepay__Prepaid",
    inputs: [
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
    type: "event",
    name: "SubscriptionUpdate",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "expiration",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Unbanned",
    inputs: [
      {
        name: "moderator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Unpaused",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "ApprovalCallerNotOwnerNorApproved",
    inputs: [],
  },
  {
    type: "error",
    name: "ApprovalQueryForNonexistentToken",
    inputs: [],
  },
  {
    type: "error",
    name: "BalanceQueryForZeroAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "Banning__AlreadyBanned",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "Banning__CannotBanOwner",
    inputs: [],
  },
  {
    type: "error",
    name: "Banning__CannotBanSelf",
    inputs: [],
  },
  {
    type: "error",
    name: "Banning__InvalidTokenId",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "Banning__NotBanned",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ERC5643__DurationZero",
    inputs: [],
  },
  {
    type: "error",
    name: "ERC5643__InvalidTokenId",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ERC5643__NotApprovedOrOwner",
    inputs: [],
  },
  {
    type: "error",
    name: "ERC5643__SubscriptionNotRenewable",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "Entitlement__InvalidValue",
    inputs: [],
  },
  {
    type: "error",
    name: "Entitlement__NotAllowed",
    inputs: [],
  },
  {
    type: "error",
    name: "Entitlement__NotMember",
    inputs: [],
  },
  {
    type: "error",
    name: "Entitlement__ValueAlreadyExists",
    inputs: [],
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
    name: "MintERC2309QuantityExceedsLimit",
    inputs: [],
  },
  {
    type: "error",
    name: "MintToZeroAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "MintZeroQuantity",
    inputs: [],
  },
  {
    type: "error",
    name: "Ownable__NotOwner",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "Ownable__ZeroAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "OwnerQueryForNonexistentToken",
    inputs: [],
  },
  {
    type: "error",
    name: "OwnershipNotInitializedForExtraData",
    inputs: [],
  },
  {
    type: "error",
    name: "Pausable__NotPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "Pausable__Paused",
    inputs: [],
  },
  {
    type: "error",
    name: "Prepay__InvalidAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "Prepay__InvalidAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "Prepay__InvalidMembership",
    inputs: [],
  },
  {
    type: "error",
    name: "Prepay__InvalidSupplyAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "Reentrancy",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferCallerNotOwnerNorApproved",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferFromIncorrectOwner",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferToNonERC721ReceiverImplementer",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferToZeroAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "URIQueryForNonexistentToken",
    inputs: [],
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b5061001961001e565b6100c4565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef520008054640100000000900460ff161561006a576040516366008a2d60e01b815260040160405180910390fd5b805463ffffffff90811610156100c157805463ffffffff191663ffffffff90811782556040519081527fe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c9060200160405180910390a15b50565b61073d806100d36000396000f3fe60806040526004361061003f5760003560e01c806306499d7f1461004457806327bc79f114610059578063aabe967d1461008b578063b6a45cd6146100a0575b600080fd5b610057610052366004610695565b6100b5565b005b34801561006557600080fd5b50610079610074366004610695565b61027b565b60405190815260200160405180910390f35b34801561009757600080fd5b50610057610340565b3480156100ac57600080fd5b5061007961039c565b3068929eee149b4bd2126854036100d45763ab143c066000526004601cfd5b3068929eee149b4bd2126855806000036101015760405163305b66fd60e01b815260040160405180910390fd5b7fc21004fcc619240a31f006438274d15cd813308303284436eef6055f0fdcb6065460408051630eac306d60e01b815290517fc21004fcc619240a31f006438274d15cd813308303284436eef6055f0fdcb600926001600160a01b0316916000918391630eac306d9160048083019260209291908290030181865afa15801561018e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101b291906106ae565b6101bc90856106dd565b90508034146101de5760405163cd27698760e01b815260040160405180910390fd5b6101e7846103cb565b600480840154604080516301332c8360e61b815290516001600160a01b0392831693600093871692634ccb20c092818301926020928290030181865afa158015610235573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061025991906106fa565b90506102678233838661043c565b50505050503868929eee149b4bd212685550565b7fc21004fcc619240a31f006438274d15cd813308303284436eef6055f0fdcb6065460408051630eac306d60e01b815290516000927fc21004fcc619240a31f006438274d15cd813308303284436eef6055f0fdcb600926001600160a01b03909116918291630eac306d9160048083019260209291908290030181865afa15801561030a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061032e91906106ae565b61033890856106dd565b949350505050565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef5200054640100000000900460ff1661038a57604051630ef4733760e31b815260040160405180910390fd5b61039a6312ea370b60e31b610488565b565b60006103c67f097b4f25b64e012d0cf55f67e9b34fe5d57f15b11b95baa4ddd136b424967c005490565b905090565b7f097b4f25b64e012d0cf55f67e9b34fe5d57f15b11b95baa4ddd136b424967c0080548290829060009061040090849061072a565b90915550506040518281527fad9b877dcdf275e10be629bbe390dc68f7b5de14e3cc5f11f1745d300bb3852e9060200160405180910390a15050565b80156104825773eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeed196001600160a01b03851601610476576104718282610561565b610482565b61048284848484610578565b50505050565b6001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b00602052604090205460ff16610510576001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b0060205260409020805460ff19166001179055610529565b604051637967f77d60e11b815260040160405180910390fd5b6040516001600160e01b03198216907f78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f2290600090a250565b6105746001600160a01b038316826105cb565b5050565b816001600160a01b0316836001600160a01b0316031561048257306001600160a01b038416036105b6576104716001600160a01b03851683836105e7565b6104826001600160a01b038516848484610637565b60003860003884865af16105745763b12d13eb6000526004601cfd5b816014528060345263a9059cbb60601b60005260206000604460106000875af1806001600051141661062c57803d853b15171061062c576390b8ec186000526004601cfd5b506000603452505050565b60405181606052826040528360601b602c526323b872dd60601b600c52602060006064601c6000895af1806001600051141661068657803d873b15171061068657637939f4246000526004601cfd5b50600060605260405250505050565b6000602082840312156106a757600080fd5b5035919050565b6000602082840312156106c057600080fd5b5051919050565b634e487b7160e01b600052601160045260246000fd5b80820281158282048414176106f4576106f46106c7565b92915050565b60006020828403121561070c57600080fd5b81516001600160a01b038116811461072357600080fd5b9392505050565b808201808211156106f4576106f46106c756";

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

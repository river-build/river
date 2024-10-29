/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type {
  MockEntitlementGated,
  MockEntitlementGatedInterface,
} from "../MockEntitlementGated";

const _abi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "checker",
        type: "address",
        internalType: "contract IEntitlementChecker",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "__EntitlementGated_init",
    inputs: [
      {
        name: "entitlementChecker",
        type: "address",
        internalType: "contract IEntitlementChecker",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getCrossChainEntitlementData",
    inputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "roleId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IEntitlementDataQueryableBase.EntitlementData",
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
    name: "getRuleData",
    inputs: [
      {
        name: "roleId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IRuleEntitlementBase.RuleData",
        components: [
          {
            name: "operations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.Operation[]",
            components: [
              {
                name: "opType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.CombinedOperationType",
              },
              {
                name: "index",
                type: "uint8",
                internalType: "uint8",
              },
            ],
          },
          {
            name: "checkOperations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.CheckOperation[]",
            components: [
              {
                name: "opType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.CheckOperationType",
              },
              {
                name: "chainId",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "contractAddress",
                type: "address",
                internalType: "address",
              },
              {
                name: "threshold",
                type: "uint256",
                internalType: "uint256",
              },
            ],
          },
          {
            name: "logicalOperations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.LogicalOperation[]",
            components: [
              {
                name: "logOpType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.LogicalOperationType",
              },
              {
                name: "leftOperationIndex",
                type: "uint8",
                internalType: "uint8",
              },
              {
                name: "rightOperationIndex",
                type: "uint8",
                internalType: "uint8",
              },
            ],
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRuleData",
    inputs: [
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
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IRuleEntitlementBase.RuleData",
        components: [
          {
            name: "operations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.Operation[]",
            components: [
              {
                name: "opType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.CombinedOperationType",
              },
              {
                name: "index",
                type: "uint8",
                internalType: "uint8",
              },
            ],
          },
          {
            name: "checkOperations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.CheckOperation[]",
            components: [
              {
                name: "opType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.CheckOperationType",
              },
              {
                name: "chainId",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "contractAddress",
                type: "address",
                internalType: "address",
              },
              {
                name: "threshold",
                type: "uint256",
                internalType: "uint256",
              },
            ],
          },
          {
            name: "logicalOperations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.LogicalOperation[]",
            components: [
              {
                name: "logOpType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.LogicalOperationType",
              },
              {
                name: "leftOperationIndex",
                type: "uint8",
                internalType: "uint8",
              },
              {
                name: "rightOperationIndex",
                type: "uint8",
                internalType: "uint8",
              },
            ],
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRuleDataV2",
    inputs: [
      {
        name: "roleId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IRuleEntitlementBase.RuleDataV2",
        components: [
          {
            name: "operations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.Operation[]",
            components: [
              {
                name: "opType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.CombinedOperationType",
              },
              {
                name: "index",
                type: "uint8",
                internalType: "uint8",
              },
            ],
          },
          {
            name: "checkOperations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.CheckOperationV2[]",
            components: [
              {
                name: "opType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.CheckOperationType",
              },
              {
                name: "chainId",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "contractAddress",
                type: "address",
                internalType: "address",
              },
              {
                name: "params",
                type: "bytes",
                internalType: "bytes",
              },
            ],
          },
          {
            name: "logicalOperations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.LogicalOperation[]",
            components: [
              {
                name: "logOpType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.LogicalOperationType",
              },
              {
                name: "leftOperationIndex",
                type: "uint8",
                internalType: "uint8",
              },
              {
                name: "rightOperationIndex",
                type: "uint8",
                internalType: "uint8",
              },
            ],
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "postEntitlementCheckResult",
    inputs: [
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
        name: "result",
        type: "uint8",
        internalType: "enum IEntitlementGatedBase.NodeVoteStatus",
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
        name: "roleId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "ruleData",
        type: "tuple",
        internalType: "struct IRuleEntitlementBase.RuleData",
        components: [
          {
            name: "operations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.Operation[]",
            components: [
              {
                name: "opType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.CombinedOperationType",
              },
              {
                name: "index",
                type: "uint8",
                internalType: "uint8",
              },
            ],
          },
          {
            name: "checkOperations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.CheckOperation[]",
            components: [
              {
                name: "opType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.CheckOperationType",
              },
              {
                name: "chainId",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "contractAddress",
                type: "address",
                internalType: "address",
              },
              {
                name: "threshold",
                type: "uint256",
                internalType: "uint256",
              },
            ],
          },
          {
            name: "logicalOperations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.LogicalOperation[]",
            components: [
              {
                name: "logOpType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.LogicalOperationType",
              },
              {
                name: "leftOperationIndex",
                type: "uint8",
                internalType: "uint8",
              },
              {
                name: "rightOperationIndex",
                type: "uint8",
                internalType: "uint8",
              },
            ],
          },
        ],
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestEntitlementCheckV2",
    inputs: [
      {
        name: "roleIds",
        type: "uint256[]",
        internalType: "uint256[]",
      },
      {
        name: "ruleData",
        type: "tuple",
        internalType: "struct IRuleEntitlementBase.RuleDataV2",
        components: [
          {
            name: "operations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.Operation[]",
            components: [
              {
                name: "opType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.CombinedOperationType",
              },
              {
                name: "index",
                type: "uint8",
                internalType: "uint8",
              },
            ],
          },
          {
            name: "checkOperations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.CheckOperationV2[]",
            components: [
              {
                name: "opType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.CheckOperationType",
              },
              {
                name: "chainId",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "contractAddress",
                type: "address",
                internalType: "address",
              },
              {
                name: "params",
                type: "bytes",
                internalType: "bytes",
              },
            ],
          },
          {
            name: "logicalOperations",
            type: "tuple[]",
            internalType: "struct IRuleEntitlementBase.LogicalOperation[]",
            components: [
              {
                name: "logOpType",
                type: "uint8",
                internalType: "enum IRuleEntitlementBase.LogicalOperationType",
              },
              {
                name: "leftOperationIndex",
                type: "uint8",
                internalType: "uint8",
              },
              {
                name: "rightOperationIndex",
                type: "uint8",
                internalType: "uint8",
              },
            ],
          },
        ],
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "EntitlementCheckResultPosted",
    inputs: [
      {
        name: "transactionId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "result",
        type: "uint8",
        indexed: false,
        internalType: "enum IEntitlementGatedBase.NodeVoteStatus",
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
    type: "error",
    name: "EntitlementGated_InvalidAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "EntitlementGated_NodeAlreadyVoted",
    inputs: [],
  },
  {
    type: "error",
    name: "EntitlementGated_NodeNotFound",
    inputs: [],
  },
  {
    type: "error",
    name: "EntitlementGated_TransactionCheckAlreadyCompleted",
    inputs: [],
  },
  {
    type: "error",
    name: "EntitlementGated_TransactionCheckAlreadyRegistered",
    inputs: [],
  },
  {
    type: "error",
    name: "EntitlementGated_TransactionNotRegistered",
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
    name: "ReentrancyGuard__ReentrantCall",
    inputs: [],
  },
] as const;

const _bytecode =
  "0x60806040523480156200001157600080fd5b50604051620029bc380380620029bc833981016040819052620000349162000127565b6200003e6200007f565b7f9075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e0080546001600160a01b0319166001600160a01b0383161790555062000159565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef520008054640100000000900460ff1615620000cc576040516366008a2d60e01b815260040160405180910390fd5b805463ffffffff90811610156200012457805463ffffffff191663ffffffff90811782556040519081527fe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c9060200160405180910390a15b50565b6000602082840312156200013a57600080fd5b81516001600160a01b03811681146200015257600080fd5b9392505050565b61285380620001696000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c806368ab7dd61161005b57806368ab7dd61461010c5780637adc9cbe1461012c57806383f1cfa51461013f57806392c399ff1461015257600080fd5b8063069a3ee91461008d5780630fe44a21146100b65780634739e805146100d657806357e70027146100eb575b600080fd5b6100a061009b3660046113a4565b610165565b6040516100ad91906114a0565b60405180910390f35b6100c96100c436600461155d565b610398565b6040516100ad91906115c5565b6100e96100e4366004611614565b61047b565b005b6100fe6100f9366004611665565b61051f565b6040519081526020016100ad565b61011f61011a3660046113a4565b61058c565b6040516100ad91906116ab565b6100e961013a366004611799565b610839565b6100fe61014d3660046117b6565b61088f565b6100a061016036600461155d565b61095c565b61018960405180606001604052806060815260200160608152602001606081525090565b6000828152602081815260408083208151815460809481028201850190935260608101838152909491938593919285929185015b8282101561022657600084815260209020604080518082019091529083018054829060ff1660028111156101f3576101f36113bd565b6002811115610204576102046113bd565b81529054610100900460ff1660209182015290825260019290920191016101bd565b50505050815260200160018201805480602002602001604051908101604052809291908181526020016000905b828210156102de576000848152602090206040805160808101909152600484029091018054829060ff16600681111561028e5761028e6113bd565b600681111561029f5761029f6113bd565b815260018281015460208084019190915260028401546001600160a01b0316604084015260039093015460609092019190915291835292019101610253565b50505050815260200160028201805480602002602001604051908101604052809291908181526020016000905b8282101561038a5760008481526020902060408051606081019091529083018054829060ff166002811115610342576103426113bd565b6002811115610353576103536113bd565b8152905460ff610100820481166020808501919091526201000090920416604090920191909152908252600192909201910161030b565b505050915250909392505050565b6040805180820190915260608082526020820152600082815260208190526040902054156104255760408051608081018252600f8183019081526e149d5b19515b9d1a5d1b195b595b9d608a1b606083015281526000848152602081815290839020925191928184019261040c92016118fa565b6040516020818303038152906040528152509050610475565b60408051608081018252601181830190815270293ab632a2b73a34ba3632b6b2b73a2b1960791b6060830152815260008481526001602090815290839020925191928184019261040c92016119f0565b92915050565b60027f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0054036104bd57604051635db5c7cd60e11b815260040160405180910390fd5b6104e660027f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0055565b6104f183838361098a565b61051a60017f54f22f54f370bd020e00ee80e1a5099a71652e2ccbcf6a75281e4c70a3e11a0055565b505050565b600082815260208190526040812082906105398282611ee0565b50506040516bffffffffffffffffffffffff193260601b166020820152436034820152600090605401604051602081830303815290604052805190602001209050610585813086610c37565b9392505050565b6105b060405180606001604052806060815260200160608152602001606081525090565b60008281526001602090815260408083208151815460809481028201850190935260608101838152909491938593919285929185015b8282101561064f57600084815260209020604080518082019091529083018054829060ff16600281111561061c5761061c6113bd565b600281111561062d5761062d6113bd565b81529054610100900460ff1660209182015290825260019290920191016105e6565b50505050815260200160018201805480602002602001604051908101604052809291908181526020016000905b8282101561078d576000848152602090206040805160808101909152600484029091018054829060ff1660068111156106b7576106b76113bd565b60068111156106c8576106c86113bd565b81526001820154602082015260028201546001600160a01b031660408201526003820180546060909201916106fc906119bc565b80601f0160208091040260200160405190810160405280929190818152602001828054610728906119bc565b80156107755780601f1061074a57610100808354040283529160200191610775565b820191906000526020600020905b81548152906001019060200180831161075857829003601f168201915b5050505050815250508152602001906001019061067c565b50505050815260200160028201805480602002602001604051908101604052809291908181526020016000905b8282101561038a5760008481526020902060408051606081019091529083018054829060ff1660028111156107f1576107f16113bd565b6002811115610802576108026113bd565b8152905460ff61010082048116602080850191909152620100009092041660409092019190915290825260019290920191016107ba565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef5200054640100000000900460ff1661088357604051630ef4733760e31b815260040160405180910390fd5b61088c81610ee7565b50565b6000805b838110156108dd5782600160008787858181106108b2576108b2611fa9565b90506020020135815260200190815260200160002081816108d391906122b5565b5050600101610893565b506040516bffffffffffffffffffffffff193260601b16602082015243603482015260009060540160405160208183030381529060405280519060200120905060005b848110156109535761094b823088888581811061093f5761093f611fa9565b90506020020135610c37565b600101610920565b50949350505050565b61098060405180606001604052806060815260200160608152602001606081525090565b6105858383610f22565b6000838152600080516020612833833981519152602052604090208054600080516020612813833981519152919061010090046001600160a01b031615806109d45750805460ff16155b156109f257604051637ad5a43960e11b815260040160405180910390fd5b600084815260028201602052604090205460ff1615610a2457604051637912b73960e01b815260040160405180910390fd5b60008481526001820160205260408120805482918291825b81811015610b3e576000838281548110610a5857610a58611fa9565b60009182526020909120018054909150336001600160a01b0390911603610ae45760008154600160a01b900460ff166002811115610a9857610a986113bd565b14610ab6576040516347592a4d60e01b815260040160405180910390fd5b80548a90829060ff60a01b1916600160a01b836002811115610ada57610ada6113bd565b0217905550600196505b8054600160a01b900460ff166001816002811115610b0457610b046113bd565b03610b1457866001019650610b34565b6002816002811115610b2857610b286113bd565b03610b34578560010195505b5050600101610a3c565b5084610b5d57604051638223a7e960e01b815260040160405180910390fd5b610b6860028261235b565b841180610b7e5750610b7b60028261235b565b83115b15610c2b5760008981526002870160205260408120805460ff19166001179055838511610bac576002610baf565b60015b90506000610bbc8c611013565b90506001826002811115610bd257610bd26113bd565b1480610bdb5750805b15610c19578b7fb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c63383604051610c10919061237d565b60405180910390a25b8015610c2857610c288c6110b0565b50505b50505050505050505050565b6000838152600080516020612833833981519152602052604090208054600080516020612813833981519152919060ff1615610cc757600481015460005b81811015610cc45784836004018281548110610c9357610c93611fa9565b906000526020600020015403610cbc576040516301ab53df60e31b815260040160405180910390fd5b600101610c75565b50505b81546001600160a01b0316610cde57610cde611186565b8154604051634f84544560e01b8152600560048201526000916001600160a01b031690634f84544590602401600060405180830381865afa158015610d27573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610d4f919081019061244f565b825490915060ff16610d905781546003830180546001600160a01b0319166001600160a01b0388161790556001600160a81b03191661010033021760011782555b600482018054600181810183556000928352602080842090920187905583518784529085019091526040822090915b82811015610e8357816040518060400160405280868481518110610de557610de5611fa9565b60200260200101516001600160a01b0316815260200160006002811115610e0e57610e0e6113bd565b9052815460018101835560009283526020928390208251910180546001600160a01b031981166001600160a01b03909316928317825593830151929390929183916001600160a81b03191617600160a01b836002811115610e7157610e716113bd565b02179055505050806001019050610dbf565b50845460405163541da4e560e01b81526001600160a01b039091169063541da4e590610eb99033908c908b9089906004016124ed565b600060405180830381600087803b158015610ed357600080fd5b505af1158015610c28573d6000803e3d6000fd5b610ef7636afd38fd60e11b611257565b60008051602061281383398151915280546001600160a01b0319166001600160a01b03831617905550565b610f4660405180606001604052806060815260200160608152602001606081525090565b6000838152600080516020612833833981519152602052604090208054600080516020612813833981519152919060ff16610f9457604051637ad5a43960e11b815260040160405180910390fd5b600381015460405163069a3ee960e01b8152600481018690526001600160a01b0390911690819063069a3ee990602401600060405180830381865afa158015610fe1573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f1916820160405261100991908101906126b6565b9695505050505050565b60008181526000805160206128338339815191526020526040812060048101546000805160206128138339815191529190835b818110156110a05782600201600084600401838154811061106957611069611fa9565b6000918252602080832090910154835282019290925260400190205460ff166110985750600095945050505050565b600101611046565b50600195945050505050565b5050565b6000818152600080516020612833833981519152602052604081206004810154600080516020612813833981519152925b818110156111315782600101600084600401838154811061110457611104611fa9565b9060005260206000200154815260200190815260200160002060006111299190611330565b6001016110e1565b5061114060048301600061134e565b6000848152600184016020526040812080546001600160a81b03191681556003810180546001600160a01b03191690559061117e600483018261134e565b505050505050565b6000600080516020612813833981519152905060007fc21004fcc619240a31f006438274d15cd813308303284436eef6055f0fdcb60060060154604051628956cd60e71b81526c29b830b1b2a7b832b930ba37b960991b60048201526001600160a01b03909116906344ab668090602401602060405180830381865afa158015611214573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061123891906127f5565b82546001600160a01b0319166001600160a01b03919091161790915550565b6001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b00602052604090205460ff166112df576001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b0060205260409020805460ff191660011790556112f8565b604051637967f77d60e11b815260040160405180910390fd5b6040516001600160e01b03198216907f78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f2290600090a250565b508054600082559060005260206000209081019061088c919061136c565b508054600082559060005260206000209081019061088c919061138f565b5b8082111561138b5780546001600160a81b031916815560010161136d565b5090565b5b8082111561138b5760008155600101611390565b6000602082840312156113b657600080fd5b5035919050565b634e487b7160e01b600052602160045260246000fd5b6003811061088c5761088c6113bd565b60008151808452602080850194506020840160005b8381101561142b578151805161140d816113d3565b885283015160ff1683880152604090960195908201906001016113f8565b509495945050505050565b60078110611446576114466113bd565b9052565b60008151808452602080850194506020840160005b8381101561142b5781518051611474816113d3565b88528084015160ff908116858a015260409182015116908801526060909601959082019060010161145f565b6000602080835260808451606080848701526114bf60808701836113e3565b915083870151601f196040818986030160408a015284835180875288870191508885019650600094505b808510156115325786516114fe838251611436565b808a0151838b0152838101516001600160a01b031684840152860151868301529588019560019490940193908701906114e9565b5060408b01519750828a82030160608b015261154e818961144a565b9b9a5050505050505050505050565b6000806040838503121561157057600080fd5b50508035926020909101359150565b6000815180845260005b818110156115a557602081850181015186830182015201611589565b506000602082860101526020601f19601f83011685010191505092915050565b6020815260008251604060208401526115e1606084018261157f565b90506020840151601f198483030160408501526115fe828261157f565b95945050505050565b6003811061088c57600080fd5b60008060006060848603121561162957600080fd5b8335925060208401359150604084013561164281611607565b809150509250925092565b60006060828403121561165f57600080fd5b50919050565b6000806040838503121561167857600080fd5b8235915060208301356001600160401b0381111561169557600080fd5b6116a18582860161164d565b9150509250929050565b6000602080835260808451606080848701526116ca60808701836113e3565b915083870151601f196040818986030160408a01528483518087528887019150888160051b880101898601955060005b8281101561175757858983030184528651611716838251611436565b808c0151838d0152858101516001600160a01b0316868401528801518883018b90526117448b84018261157f565b978c0197948c01949250506001016116fa565b5060408d01519950848c82030160608d0152611773818b61144a565b9d9c50505050505050505050505050565b6001600160a01b038116811461088c57600080fd5b6000602082840312156117ab57600080fd5b813561058581611784565b6000806000604084860312156117cb57600080fd5b83356001600160401b03808211156117e257600080fd5b818601915086601f8301126117f657600080fd5b81358181111561180557600080fd5b8760208260051b850101111561181a57600080fd5b60209283019550935090850135908082111561183557600080fd5b506118428682870161164d565b9150509250925092565b600081548084526020808501945083600052602060002060005b8381101561142b57815460ff80821661187e816113d3565b895260089190911c168388015260409096019560019182019101611866565b600081548084526020808501945083600052602060002060005b8381101561142b57815460ff8082166118cf816113d3565b8952600882901c8116858a015260109190911c166040880152606090960195600191820191016118b7565b6000602080835260806060806020860152611918608086018761184c565b6001808801601f196040818a86030160408b01528483548087526020870191508460005260206000209650600094505b808510156119945761195e8260ff895416611436565b86860154828b015260028701546001600160a01b0316838301526003870154888301526004909601959385019390880190611948565b50828b82030160608c01526119ac8160028e0161189d565b9c9b505050505050505050505050565b600181811c908216806119d057607f821691505b60208210810361165f57634e487b7160e01b600052602260045260246000fd5b60006020808352606081840152611a0a608084018561184c565b60018501601f19808684030160408701528282548085528585019150858160051b86010160008581528781209550805b83811015611b0e5785888403018552611a578360ff895416611436565b6001870154838a015260028701546001600160a01b03166040840152608060608401526003870180548390611a8b816119bc565b8060808801526001821660008114611aaa5760018114611ac657611af5565b60ff19831660a089015260a082151560051b8901019350611af5565b8487528d8720875b83811015611aec5781548a820160a001526001909101908f01611ace565b890160a0019450505b50505060049890980197958a0195935050600101611a3a565b5050838982030160608a0152611b278160028c0161189d565b9a9950505050505050505050565b6000808335601e19843603018112611b4c57600080fd5b8301803591506001600160401b03821115611b6657600080fd5b6020019150600681901b3603821315611b7e57600080fd5b9250929050565b634e487b7160e01b600052604160045260246000fd5b600281901b6001600160fe1b0382168214611bc657634e487b7160e01b600052601160045260246000fd5b919050565b60ff8116811461088c57600080fd5b8135611be581611607565b611bee816113d3565b60ff1982541660ff82168117835550506020820135611c0c81611bcb565b815461ff001916600882901b61ff0016178255505050565b6000808335601e19843603018112611c3b57600080fd5b8301803591506001600160401b03821115611c5557600080fd5b6020019150600781901b3603821315611b7e57600080fd5b6007811061088c57600080fd5b60078210611c8a57611c8a6113bd565b60ff1981541660ff831681178255505050565b80546001600160a01b0319166001600160a01b0392909216919091179055565b8135611cc881611c6d565b611cd28183611c7a565b50602082013560018201556040820135611ceb81611784565b611cf88160028401611c9d565b50606082013560038201555050565b600160401b831115611d1b57611d1b611b85565b805483825580841015611d7957611d3181611b9b565b611d3a85611b9b565b6000848152602081209283019291909101905b82821015611d7557808255806001830155806002830155806003830155600482019150611d4d565b5050505b5060008181526020812083915b8581101561117e57611d988383611cbd565b6080929092019160049190910190600101611d86565b6000808335601e19843603018112611dc557600080fd5b8301803591506001600160401b03821115611ddf57600080fd5b6020019150606081023603821315611b7e57600080fd5b8135611e0181611607565b611e0a816113d3565b60ff1982541660ff82168117835550506020820135611e2881611bcb565b815461ff001916600882901b61ff0016178255506040820135611e4a81611bcb565b815462ff0000191660109190911b62ff00001617905550565b600160401b831115611e7757611e77611b85565b805483825580841015611eae576000828152602081208581019083015b80821015611eaa57828255600182019150611e94565b5050505b5060008181526020812083915b8581101561117e57611ecd8383611df6565b6060929092019160019182019101611ebb565b611eea8283611b35565b600160401b811115611efe57611efe611b85565b825481845580821015611f35576000848152602081208381019083015b80821015611f3157828255600182019150611f1b565b5050505b5060008381526020902060005b82811015611f6757611f548483611bda565b6040939093019260019182019101611f42565b50505050611f786020830183611c24565b611f86818360018601611d07565b5050611f956040830183611dae565b611fa3818360028601611e63565b50505050565b634e487b7160e01b600052603260045260246000fd5b6000808335601e19843603018112611fd657600080fd5b8301803591506001600160401b03821115611ff057600080fd5b6020019150600581901b3603821315611b7e57600080fd5b60008235607e1983360301811261201e57600080fd5b9190910192915050565b5b818110156110ac5760008155600101612029565b601f82111561051a57806000526020600020601f840160051c810160208510156120645750805b612076601f850160051c830182612028565b5050505050565b813561208881611c6d565b6120928183611c7a565b506001602080840135600184015560408401356120ae81611784565b6120bb8160028601611c9d565b50600383016060850135601e198636030181126120d757600080fd5b850180356001600160401b038111156120ef57600080fd5b803603848301131561210057600080fd5b6121148161210e85546119bc565b8561203d565b6000601f82116001811461214a576000831561213257508382018601355b600019600385901b1c1916600184901b1785556121a5565b600085815260209020601f19841690835b8281101561217a5786850189013582559388019390890190880161215b565b50848210156121995760001960f88660031b161c198885880101351681555b505060018360011b0185555b505050505050505050565b600160401b8311156121c4576121c4611b85565b805483825580841015612277576121da81611b9b565b6121e385611b9b565b6000848152602081209283019291909101905b8282101561227357808255600181818401558160028401556003830161221c81546119bc565b801561226557601f8082116001811461223757858455612262565b60008481526020902061225383850160051c8201878301612028565b50600084815260208120818655555b50505b5050506004820191506121f6565b5050505b5060008181526020812083915b8581101561117e5761229f6122998487612008565b8361207d565b6020929092019160049190910190600101612284565b6122bf8283611b35565b600160401b8111156122d3576122d3611b85565b82548184558082101561230a576000848152602081208381019083015b80821015612306578282556001820191506122f0565b5050505b5060008381526020902060005b8281101561233c576123298483611bda565b6040939093019260019182019101612317565b5050505061234d6020830183611fbf565b611f868183600186016121b0565b60008261237857634e487b7160e01b600052601260045260246000fd5b500490565b6020810161238a836113d3565b91905290565b604051608081016001600160401b03811182821017156123b2576123b2611b85565b60405290565b604051606081016001600160401b03811182821017156123b2576123b2611b85565b604080519081016001600160401b03811182821017156123b2576123b2611b85565b604051601f8201601f191681016001600160401b038111828210171561242457612424611b85565b604052919050565b60006001600160401b0382111561244557612445611b85565b5060051b60200190565b6000602080838503121561246257600080fd5b82516001600160401b0381111561247857600080fd5b8301601f8101851361248957600080fd5b805161249c6124978261242c565b6123fc565b81815260059190911b820183019083810190878311156124bb57600080fd5b928401925b828410156124e25783516124d381611784565b825292840192908401906124c0565b979650505050505050565b60006080820160018060a01b03808816845260208760208601528660408601526080606086015282865180855260a08701915060208801945060005b81811015612547578551851683529483019491830191600101612529565b50909a9950505050505050505050565b600082601f83011261256857600080fd5b815160206125786124978361242c565b82815260079290921b8401810191818101908684111561259757600080fd5b8286015b848110156125fc57608081890312156125b45760008081fd5b6125bc612390565b81516125c781611c6d565b815281850151858201526040808301516125e081611784565b908201526060828101519082015283529183019160800161259b565b509695505050505050565b600082601f83011261261857600080fd5b815160206126286124978361242c565b8281526060928302850182019282820191908785111561264757600080fd5b8387015b858110156126a95781818a0312156126635760008081fd5b61266b6123b8565b815161267681611607565b81528186015161268581611bcb565b8187015260408281015161269881611bcb565b90820152845292840192810161264b565b5090979650505050505050565b600060208083850312156126c957600080fd5b82516001600160401b03808211156126e057600080fd5b90840190606082870312156126f457600080fd5b6126fc6123b8565b82518281111561270b57600080fd5b8301601f8101881361271c57600080fd5b805161272a6124978261242c565b81815260069190911b8201860190868101908a83111561274957600080fd5b928701925b8284101561279f576040848c0312156127675760008081fd5b61276f6123da565b845161277a81611607565b81528489015161278981611bcb565b818a01528252604093909301929087019061274e565b845250505082840151828111156127b557600080fd5b6127c188828601612557565b858301525060408301519350818411156127da57600080fd5b6127e687858501612607565b60408201529695505050505050565b60006020828403121561280757600080fd5b81516105858161178456fe9075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e009075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e01";

type MockEntitlementGatedConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockEntitlementGatedConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockEntitlementGated__factory extends ContractFactory {
  constructor(...args: MockEntitlementGatedConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    checker: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<MockEntitlementGated> {
    return super.deploy(
      checker,
      overrides || {}
    ) as Promise<MockEntitlementGated>;
  }
  override getDeployTransaction(
    checker: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(checker, overrides || {});
  }
  override attach(address: string): MockEntitlementGated {
    return super.attach(address) as MockEntitlementGated;
  }
  override connect(signer: Signer): MockEntitlementGated__factory {
    return super.connect(signer) as MockEntitlementGated__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockEntitlementGatedInterface {
    return new utils.Interface(_abi) as MockEntitlementGatedInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MockEntitlementGated {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as MockEntitlementGated;
  }
}

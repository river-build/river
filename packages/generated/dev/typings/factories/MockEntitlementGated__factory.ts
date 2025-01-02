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
    name: "Reentrancy",
    inputs: [],
  },
] as const;

const _bytecode =
  "0x60806040523480156200001157600080fd5b506040516200297f3803806200297f833981016040819052620000349162000127565b6200003e6200007f565b7f9075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e0080546001600160a01b0319166001600160a01b0383161790555062000159565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef520008054640100000000900460ff1615620000cc576040516366008a2d60e01b815260040160405180910390fd5b805463ffffffff90811610156200012457805463ffffffff191663ffffffff90811782556040519081527fe9c9b456cb2994b80aeef036cf59d26e9617df80f816a6ee5a5b4166e07e2f5c9060200160405180910390a15b50565b6000602082840312156200013a57600080fd5b81516001600160a01b03811681146200015257600080fd5b9392505050565b61281680620001696000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c806368ab7dd61161005b57806368ab7dd61461010c5780637adc9cbe1461012c57806383f1cfa51461013f57806392c399ff1461015257600080fd5b8063069a3ee91461008d5780630fe44a21146100b65780634739e805146100d657806357e70027146100eb575b600080fd5b6100a061009b366004611362565b610165565b6040516100ad919061145e565b60405180910390f35b6100c96100c436600461151b565b610398565b6040516100ad9190611583565b6100e96100e43660046115d2565b61047b565b005b6100fe6100f9366004611623565b6104c2565b6040519081526020016100ad565b61011f61011a366004611362565b610530565b6040516100ad9190611669565b6100e961013a366004611757565b6107dd565b6100fe61014d366004611774565b610833565b6100a061016036600461151b565b610901565b61018960405180606001604052806060815260200160608152602001606081525090565b6000828152602081815260408083208151815460809481028201850190935260608101838152909491938593919285929185015b8282101561022657600084815260209020604080518082019091529083018054829060ff1660028111156101f3576101f361137b565b60028111156102045761020461137b565b81529054610100900460ff1660209182015290825260019290920191016101bd565b50505050815260200160018201805480602002602001604051908101604052809291908181526020016000905b828210156102de576000848152602090206040805160808101909152600484029091018054829060ff16600681111561028e5761028e61137b565b600681111561029f5761029f61137b565b815260018281015460208084019190915260028401546001600160a01b0316604084015260039093015460609092019190915291835292019101610253565b50505050815260200160028201805480602002602001604051908101604052809291908181526020016000905b8282101561038a5760008481526020902060408051606081019091529083018054829060ff1660028111156103425761034261137b565b60028111156103535761035361137b565b8152905460ff610100820481166020808501919091526201000090920416604090920191909152908252600192909201910161030b565b505050915250909392505050565b6040805180820190915260608082526020820152600082815260208190526040902054156104255760408051608081018252600f8183019081526e149d5b19515b9d1a5d1b195b595b9d608a1b606083015281526000848152602081815290839020925191928184019261040c92016118b8565b6040516020818303038152906040528152509050610475565b60408051608081018252601181830190815270293ab632a2b73a34ba3632b6b2b73a2b1960791b6060830152815260008481526001602090815290839020925191928184019261040c92016119ae565b92915050565b3068929eee149b4bd21268540361049a5763ab143c066000526004601cfd5b3068929eee149b4bd21268556104b183838361092f565b3868929eee149b4bd2126855505050565b600082815260208190526040812082906104dc8282611ea3565b50506040516bffffffffffffffffffffffff193260601b16602082015243603482015260009060540160405160208183030381529060405280519060200120905061052933823087610bdc565b9392505050565b61055460405180606001604052806060815260200160608152602001606081525090565b60008281526001602090815260408083208151815460809481028201850190935260608101838152909491938593919285929185015b828210156105f357600084815260209020604080518082019091529083018054829060ff1660028111156105c0576105c061137b565b60028111156105d1576105d161137b565b81529054610100900460ff16602091820152908252600192909201910161058a565b50505050815260200160018201805480602002602001604051908101604052809291908181526020016000905b82821015610731576000848152602090206040805160808101909152600484029091018054829060ff16600681111561065b5761065b61137b565b600681111561066c5761066c61137b565b81526001820154602082015260028201546001600160a01b031660408201526003820180546060909201916106a09061197a565b80601f01602080910402602001604051908101604052809291908181526020018280546106cc9061197a565b80156107195780601f106106ee57610100808354040283529160200191610719565b820191906000526020600020905b8154815290600101906020018083116106fc57829003601f168201915b50505050508152505081526020019060010190610620565b50505050815260200160028201805480602002602001604051908101604052809291908181526020016000905b8282101561038a5760008481526020902060408051606081019091529083018054829060ff1660028111156107955761079561137b565b60028111156107a6576107a661137b565b8152905460ff610100820481166020808501919091526201000090920416604090920191909152908252600192909201910161075e565b7f59b501c3653afc186af7d48dda36cf6732bd21629a6295693664240a6ef5200054640100000000900460ff1661082757604051630ef4733760e31b815260040160405180910390fd5b61083081610ea5565b50565b6000805b8381101561088157826001600087878581811061085657610856611f6c565b90506020020135815260200190815260200160002081816108779190612278565b5050600101610837565b506040516bffffffffffffffffffffffff193260601b16602082015243603482015260009060540160405160208183030381529060405280519060200120905060005b848110156108f8576108f03383308989868181106108e4576108e4611f6c565b90506020020135610bdc565b6001016108c4565b50949350505050565b61092560405180606001604052806060815260200160608152602001606081525090565b6105298383610ee0565b60008381526000805160206127f68339815191526020526040902080546000805160206127d6833981519152919061010090046001600160a01b031615806109795750805460ff16155b1561099757604051637ad5a43960e11b815260040160405180910390fd5b600084815260028201602052604090205460ff16156109c957604051637912b73960e01b815260040160405180910390fd5b60008481526001820160205260408120805482918291825b81811015610ae35760008382815481106109fd576109fd611f6c565b60009182526020909120018054909150336001600160a01b0390911603610a895760008154600160a01b900460ff166002811115610a3d57610a3d61137b565b14610a5b576040516347592a4d60e01b815260040160405180910390fd5b80548a90829060ff60a01b1916600160a01b836002811115610a7f57610a7f61137b565b0217905550600196505b8054600160a01b900460ff166001816002811115610aa957610aa961137b565b03610ab957866001019650610ad9565b6002816002811115610acd57610acd61137b565b03610ad9578560010195505b50506001016109e1565b5084610b0257604051638223a7e960e01b815260040160405180910390fd5b610b0d60028261231e565b841180610b235750610b2060028261231e565b83115b15610bd05760008981526002870160205260408120805460ff19166001179055838511610b51576002610b54565b60015b90506000610b618c610fd1565b90506001826002811115610b7757610b7761137b565b1480610b805750805b15610bbe578b7fb9d6ce397e562841871d119aaf77469c60a3b5bf8b99a5d9851656015015c63383604051610bb59190612340565b60405180910390a25b8015610bcd57610bcd8c61106e565b50505b50505050505050505050565b60008381526000805160206127f68339815191526020526040902080546000805160206127d6833981519152919060ff1615610c6c57600481015460005b81811015610c695784836004018281548110610c3857610c38611f6c565b906000526020600020015403610c61576040516301ab53df60e31b815260040160405180910390fd5b600101610c1a565b50505b81546001600160a01b0316610c8357610c83611144565b8154604051634f84544560e01b8152600560048201526000916001600160a01b031690634f84544590602401600060405180830381865afa158015610ccc573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610cf49190810190612412565b825490915060ff16610d3f5781546003830180546001600160a01b038089166001600160a01b0319909216919091179091558816610100026001600160a81b03199091161760011782555b600482018054600181810183556000928352602080842090920187905583518784529085019091526040822090915b82811015610e3257816040518060400160405280868481518110610d9457610d94611f6c565b60200260200101516001600160a01b0316815260200160006002811115610dbd57610dbd61137b565b9052815460018101835560009283526020928390208251910180546001600160a01b031981166001600160a01b03909316928317825593830151929390929183916001600160a81b03191617600160a01b836002811115610e2057610e2061137b565b02179055505050806001019050610d6e565b50845460405163541da4e560e01b81526001600160a01b039091169063541da4e590610e68908c908c908b9089906004016124b0565b600060405180830381600087803b158015610e8257600080fd5b505af1158015610e96573d6000803e3d6000fd5b50505050505050505050505050565b610eb5636afd38fd60e11b611215565b6000805160206127d683398151915280546001600160a01b0319166001600160a01b03831617905550565b610f0460405180606001604052806060815260200160608152602001606081525090565b60008381526000805160206127f68339815191526020526040902080546000805160206127d6833981519152919060ff16610f5257604051637ad5a43960e11b815260040160405180910390fd5b600381015460405163069a3ee960e01b8152600481018690526001600160a01b0390911690819063069a3ee990602401600060405180830381865afa158015610f9f573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610fc79190810190612679565b9695505050505050565b60008181526000805160206127f68339815191526020526040812060048101546000805160206127d68339815191529190835b8181101561105e5782600201600084600401838154811061102757611027611f6c565b6000918252602080832090910154835282019290925260400190205460ff166110565750600095945050505050565b600101611004565b50600195945050505050565b5050565b60008181526000805160206127f68339815191526020526040812060048101546000805160206127d6833981519152925b818110156110ef578260010160008460040183815481106110c2576110c2611f6c565b9060005260206000200154815260200190815260200160002060006110e791906112ee565b60010161109f565b506110fe60048301600061130c565b6000848152600184016020526040812080546001600160a81b03191681556003810180546001600160a01b03191690559061113c600483018261130c565b505050505050565b60006000805160206127d6833981519152905060007fc21004fcc619240a31f006438274d15cd813308303284436eef6055f0fdcb60060060154604051628956cd60e71b81526c29b830b1b2a7b832b930ba37b960991b60048201526001600160a01b03909116906344ab668090602401602060405180830381865afa1580156111d2573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111f691906127b8565b82546001600160a01b0319166001600160a01b03919091161790915550565b6001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b00602052604090205460ff1661129d576001600160e01b0319811660009081527f81088bbc801e045ea3e7620779ab349988f58afbdfba10dff983df3f33522b0060205260409020805460ff191660011790556112b6565b604051637967f77d60e11b815260040160405180910390fd5b6040516001600160e01b03198216907f78f84e5b1c5c05be2b5ad3800781dd404d6d6c6302bc755c0fe20f58a33a7f2290600090a250565b5080546000825590600052602060002090810190610830919061132a565b5080546000825590600052602060002090810190610830919061134d565b5b808211156113495780546001600160a81b031916815560010161132b565b5090565b5b80821115611349576000815560010161134e565b60006020828403121561137457600080fd5b5035919050565b634e487b7160e01b600052602160045260246000fd5b600381106108305761083061137b565b60008151808452602080850194506020840160005b838110156113e957815180516113cb81611391565b885283015160ff1683880152604090960195908201906001016113b6565b509495945050505050565b600781106114045761140461137b565b9052565b60008151808452602080850194506020840160005b838110156113e9578151805161143281611391565b88528084015160ff908116858a015260409182015116908801526060909601959082019060010161141d565b60006020808352608084516060808487015261147d60808701836113a1565b915083870151601f196040818986030160408a015284835180875288870191508885019650600094505b808510156114f05786516114bc8382516113f4565b808a0151838b0152838101516001600160a01b031684840152860151868301529588019560019490940193908701906114a7565b5060408b01519750828a82030160608b015261150c8189611408565b9b9a5050505050505050505050565b6000806040838503121561152e57600080fd5b50508035926020909101359150565b6000815180845260005b8181101561156357602081850181015186830182015201611547565b506000602082860101526020601f19601f83011685010191505092915050565b60208152600082516040602084015261159f606084018261153d565b90506020840151601f198483030160408501526115bc828261153d565b95945050505050565b6003811061083057600080fd5b6000806000606084860312156115e757600080fd5b83359250602084013591506040840135611600816115c5565b809150509250925092565b60006060828403121561161d57600080fd5b50919050565b6000806040838503121561163657600080fd5b8235915060208301356001600160401b0381111561165357600080fd5b61165f8582860161160b565b9150509250929050565b60006020808352608084516060808487015261168860808701836113a1565b915083870151601f196040818986030160408a01528483518087528887019150888160051b880101898601955060005b82811015611715578589830301845286516116d48382516113f4565b808c0151838d0152858101516001600160a01b0316868401528801518883018b90526117028b84018261153d565b978c0197948c01949250506001016116b8565b5060408d01519950848c82030160608d0152611731818b611408565b9d9c50505050505050505050505050565b6001600160a01b038116811461083057600080fd5b60006020828403121561176957600080fd5b813561052981611742565b60008060006040848603121561178957600080fd5b83356001600160401b03808211156117a057600080fd5b818601915086601f8301126117b457600080fd5b8135818111156117c357600080fd5b8760208260051b85010111156117d857600080fd5b6020928301955093509085013590808211156117f357600080fd5b506118008682870161160b565b9150509250925092565b600081548084526020808501945083600052602060002060005b838110156113e957815460ff80821661183c81611391565b895260089190911c168388015260409096019560019182019101611824565b600081548084526020808501945083600052602060002060005b838110156113e957815460ff80821661188d81611391565b8952600882901c8116858a015260109190911c16604088015260609096019560019182019101611875565b60006020808352608060608060208601526118d6608086018761180a565b6001808801601f196040818a86030160408b01528483548087526020870191508460005260206000209650600094505b808510156119525761191c8260ff8954166113f4565b86860154828b015260028701546001600160a01b0316838301526003870154888301526004909601959385019390880190611906565b50828b82030160608c015261196a8160028e0161185b565b9c9b505050505050505050505050565b600181811c9082168061198e57607f821691505b60208210810361161d57634e487b7160e01b600052602260045260246000fd5b600060208083526060818401526119c8608084018561180a565b60018501601f19808684030160408701528282548085528585019150858160051b86010160008581528781209550805b83811015611acc5785888403018552611a158360ff8954166113f4565b6001870154838a015260028701546001600160a01b03166040840152608060608401526003870180548390611a498161197a565b8060808801526001821660008114611a685760018114611a8457611ab3565b60ff19831660a089015260a082151560051b8901019350611ab3565b8487528d8720875b83811015611aaa5781548a820160a001526001909101908f01611a8c565b890160a0019450505b50505060049890980197958a01959350506001016119f8565b5050838982030160608a0152611ae58160028c0161185b565b9a9950505050505050505050565b6000808335601e19843603018112611b0a57600080fd5b8301803591506001600160401b03821115611b2457600080fd5b6020019150600681901b3603821315611b3c57600080fd5b9250929050565b634e487b7160e01b600052604160045260246000fd5b600281901b6001600160fe1b0382168214611b8457634e487b7160e01b600052601160045260246000fd5b919050565b60ff8116811461083057600080fd5b8135611ba3816115c5565b611bac81611391565b60ff1982541660ff82168117835550506020820135611bca81611b89565b815461ff001916600882901b61ff0016178255505050565b505050565b6000808335601e19843603018112611bfe57600080fd5b8301803591506001600160401b03821115611c1857600080fd5b6020019150600781901b3603821315611b3c57600080fd5b6007811061083057600080fd5b60078210611c4d57611c4d61137b565b60ff1981541660ff831681178255505050565b80546001600160a01b0319166001600160a01b0392909216919091179055565b8135611c8b81611c30565b611c958183611c3d565b50602082013560018201556040820135611cae81611742565b611cbb8160028401611c60565b50606082013560038201555050565b600160401b831115611cde57611cde611b43565b805483825580841015611d3c57611cf481611b59565b611cfd85611b59565b6000848152602081209283019291909101905b82821015611d3857808255806001830155806002830155806003830155600482019150611d10565b5050505b5060008181526020812083915b8581101561113c57611d5b8383611c80565b6080929092019160049190910190600101611d49565b6000808335601e19843603018112611d8857600080fd5b8301803591506001600160401b03821115611da257600080fd5b6020019150606081023603821315611b3c57600080fd5b8135611dc4816115c5565b611dcd81611391565b60ff1982541660ff82168117835550506020820135611deb81611b89565b815461ff001916600882901b61ff0016178255506040820135611e0d81611b89565b815462ff0000191660109190911b62ff00001617905550565b600160401b831115611e3a57611e3a611b43565b805483825580841015611e71576000828152602081208581019083015b80821015611e6d57828255600182019150611e57565b5050505b5060008181526020812083915b8581101561113c57611e908383611db9565b6060929092019160019182019101611e7e565b611ead8283611af3565b600160401b811115611ec157611ec1611b43565b825481845580821015611ef8576000848152602081208381019083015b80821015611ef457828255600182019150611ede565b5050505b5060008381526020902060005b82811015611f2a57611f178483611b98565b6040939093019260019182019101611f05565b50505050611f3b6020830183611be7565b611f49818360018601611cca565b5050611f586040830183611d71565b611f66818360028601611e26565b50505050565b634e487b7160e01b600052603260045260246000fd5b6000808335601e19843603018112611f9957600080fd5b8301803591506001600160401b03821115611fb357600080fd5b6020019150600581901b3603821315611b3c57600080fd5b60008235607e19833603018112611fe157600080fd5b9190910192915050565b5b8181101561106a5760008155600101611fec565b601f821115611be257806000526020600020601f840160051c810160208510156120275750805b612039601f850160051c830182611feb565b5050505050565b813561204b81611c30565b6120558183611c3d565b5060016020808401356001840155604084013561207181611742565b61207e8160028601611c60565b50600383016060850135601e1986360301811261209a57600080fd5b850180356001600160401b038111156120b257600080fd5b80360384830113156120c357600080fd5b6120d7816120d1855461197a565b85612000565b6000601f82116001811461210d57600083156120f557508382018601355b600019600385901b1c1916600184901b178555612168565b600085815260209020601f19841690835b8281101561213d5786850189013582559388019390890190880161211e565b508482101561215c5760001960f88660031b161c198885880101351681555b505060018360011b0185555b505050505050505050565b600160401b83111561218757612187611b43565b80548382558084101561223a5761219d81611b59565b6121a685611b59565b6000848152602081209283019291909101905b828210156122365780825560018181840155816002840155600383016121df815461197a565b801561222857601f808211600181146121fa57858455612225565b60008481526020902061221683850160051c8201878301611feb565b50600084815260208120818655555b50505b5050506004820191506121b9565b5050505b5060008181526020812083915b8581101561113c5761226261225c8487611fcb565b83612040565b6020929092019160049190910190600101612247565b6122828283611af3565b600160401b81111561229657612296611b43565b8254818455808210156122cd576000848152602081208381019083015b808210156122c9578282556001820191506122b3565b5050505b5060008381526020902060005b828110156122ff576122ec8483611b98565b60409390930192600191820191016122da565b505050506123106020830183611f82565b611f49818360018601612173565b60008261233b57634e487b7160e01b600052601260045260246000fd5b500490565b6020810161234d83611391565b91905290565b604051608081016001600160401b038111828210171561237557612375611b43565b60405290565b604051606081016001600160401b038111828210171561237557612375611b43565b604080519081016001600160401b038111828210171561237557612375611b43565b604051601f8201601f191681016001600160401b03811182821017156123e7576123e7611b43565b604052919050565b60006001600160401b0382111561240857612408611b43565b5060051b60200190565b6000602080838503121561242557600080fd5b82516001600160401b0381111561243b57600080fd5b8301601f8101851361244c57600080fd5b805161245f61245a826123ef565b6123bf565b81815260059190911b8201830190838101908783111561247e57600080fd5b928401925b828410156124a557835161249681611742565b82529284019290840190612483565b979650505050505050565b60006080820160018060a01b03808816845260208760208601528660408601526080606086015282865180855260a08701915060208801945060005b8181101561250a5785518516835294830194918301916001016124ec565b50909a9950505050505050505050565b600082601f83011261252b57600080fd5b8151602061253b61245a836123ef565b82815260079290921b8401810191818101908684111561255a57600080fd5b8286015b848110156125bf57608081890312156125775760008081fd5b61257f612353565b815161258a81611c30565b815281850151858201526040808301516125a381611742565b908201526060828101519082015283529183019160800161255e565b509695505050505050565b600082601f8301126125db57600080fd5b815160206125eb61245a836123ef565b8281526060928302850182019282820191908785111561260a57600080fd5b8387015b8581101561266c5781818a0312156126265760008081fd5b61262e61237b565b8151612639816115c5565b81528186015161264881611b89565b8187015260408281015161265b81611b89565b90820152845292840192810161260e565b5090979650505050505050565b6000602080838503121561268c57600080fd5b82516001600160401b03808211156126a357600080fd5b90840190606082870312156126b757600080fd5b6126bf61237b565b8251828111156126ce57600080fd5b8301601f810188136126df57600080fd5b80516126ed61245a826123ef565b81815260069190911b8201860190868101908a83111561270c57600080fd5b928701925b82841015612762576040848c03121561272a5760008081fd5b61273261239d565b845161273d816115c5565b81528489015161274c81611b89565b818a015282526040939093019290870190612711565b8452505050828401518281111561277857600080fd5b6127848882860161251a565b8583015250604083015193508184111561279d57600080fd5b6127a9878585016125ca565b60408201529695505050505050565b6000602082840312156127ca57600080fd5b81516105298161174256fe9075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e009075c515a635ba70c9696f31149324218d75cf00afe836c482e6473f38b19e01";

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

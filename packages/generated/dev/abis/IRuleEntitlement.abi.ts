export default [
  {
    "type": "function",
    "name": "description",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEntitlementDataByRoleId",
    "inputs": [
      {
        "name": "roleId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRuleData",
    "inputs": [
      {
        "name": "roleId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "data",
        "type": "tuple",
        "internalType": "struct IRuleEntitlement.RuleData",
        "components": [
          {
            "name": "operations",
            "type": "tuple[]",
            "internalType": "struct IRuleEntitlement.Operation[]",
            "components": [
              {
                "name": "opType",
                "type": "uint8",
                "internalType": "enum IRuleEntitlement.CombinedOperationType"
              },
              {
                "name": "index",
                "type": "uint8",
                "internalType": "uint8"
              }
            ]
          },
          {
            "name": "checkOperations",
            "type": "tuple[]",
            "internalType": "struct IRuleEntitlement.CheckOperation[]",
            "components": [
              {
                "name": "opType",
                "type": "uint8",
                "internalType": "enum IRuleEntitlement.CheckOperationType"
              },
              {
                "name": "chainId",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "contractAddress",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "threshold",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "logicalOperations",
            "type": "tuple[]",
            "internalType": "struct IRuleEntitlement.LogicalOperation[]",
            "components": [
              {
                "name": "logOpType",
                "type": "uint8",
                "internalType": "enum IRuleEntitlement.LogicalOperationType"
              },
              {
                "name": "leftOperationIndex",
                "type": "uint8",
                "internalType": "uint8"
              },
              {
                "name": "rightOperationIndex",
                "type": "uint8",
                "internalType": "uint8"
              }
            ]
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "space",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isCrosschain",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isEntitled",
    "inputs": [
      {
        "name": "channelId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "user",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "permission",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "moduleType",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "removeEntitlement",
    "inputs": [
      {
        "name": "roleId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setEntitlement",
    "inputs": [
      {
        "name": "roleId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "entitlementData",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "error",
    "name": "CheckOperationsLimitReaced",
    "inputs": [
      {
        "name": "limit",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "Entitlement__InvalidValue",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Entitlement__NotAllowed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Entitlement__NotMember",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Entitlement__ValueAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidCheckOperationIndex",
    "inputs": [
      {
        "name": "operationIndex",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "checkOperationsLength",
        "type": "uint8",
        "internalType": "uint8"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidLeftOperationIndex",
    "inputs": [
      {
        "name": "leftOperationIndex",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "currentOperationIndex",
        "type": "uint8",
        "internalType": "uint8"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidLogicalOperationIndex",
    "inputs": [
      {
        "name": "operationIndex",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "logicalOperationsLength",
        "type": "uint8",
        "internalType": "uint8"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidOperationType",
    "inputs": [
      {
        "name": "opType",
        "type": "uint8",
        "internalType": "enum IRuleEntitlement.CombinedOperationType"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidRightOperationIndex",
    "inputs": [
      {
        "name": "rightOperationIndex",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "currentOperationIndex",
        "type": "uint8",
        "internalType": "uint8"
      }
    ]
  },
  {
    "type": "error",
    "name": "LogicalOperationLimitReached",
    "inputs": [
      {
        "name": "limit",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "OperationsLimitReached",
    "inputs": [
      {
        "name": "limit",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  }
] as const

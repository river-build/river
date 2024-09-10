export default [
  {
    "type": "function",
    "name": "__Architect_init",
    "inputs": [
      {
        "name": "ownerImplementation",
        "type": "address",
        "internalType": "contract ISpaceOwner"
      },
      {
        "name": "userEntitlementImplementation",
        "type": "address",
        "internalType": "contract IUserEntitlement"
      },
      {
        "name": "ruleEntitlementImplementation",
        "type": "address",
        "internalType": "contract IRuleEntitlementV2"
      },
      {
        "name": "legacyRuleEntitlement",
        "type": "address",
        "internalType": "contract IRuleEntitlement"
      },
      {
        "name": "proxyInitializer",
        "type": "address",
        "internalType": "contract ISpaceProxyInitializer"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createSpace",
    "inputs": [
      {
        "name": "spaceInfo",
        "type": "tuple",
        "internalType": "struct IArchitectBase.SpaceInfo",
        "components": [
          {
            "name": "name",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "uri",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "membership",
            "type": "tuple",
            "internalType": "struct IArchitectBase.Membership",
            "components": [
              {
                "name": "settings",
                "type": "tuple",
                "internalType": "struct IMembershipBase.Membership",
                "components": [
                  {
                    "name": "name",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "symbol",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "price",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "maxSupply",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "duration",
                    "type": "uint64",
                    "internalType": "uint64"
                  },
                  {
                    "name": "currency",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "feeRecipient",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "freeAllocation",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "pricingModule",
                    "type": "address",
                    "internalType": "address"
                  }
                ]
              },
              {
                "name": "requirements",
                "type": "tuple",
                "internalType": "struct IArchitectBase.MembershipRequirements",
                "components": [
                  {
                    "name": "everyone",
                    "type": "bool",
                    "internalType": "bool"
                  },
                  {
                    "name": "users",
                    "type": "address[]",
                    "internalType": "address[]"
                  },
                  {
                    "name": "ruleData",
                    "type": "bytes",
                    "internalType": "bytes"
                  }
                ]
              },
              {
                "name": "permissions",
                "type": "string[]",
                "internalType": "string[]"
              }
            ]
          },
          {
            "name": "channel",
            "type": "tuple",
            "internalType": "struct IArchitectBase.ChannelInfo",
            "components": [
              {
                "name": "metadata",
                "type": "string",
                "internalType": "string"
              }
            ]
          },
          {
            "name": "shortDescription",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "longDescription",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createSpaceWithPrepay",
    "inputs": [
      {
        "name": "spaceInfo",
        "type": "tuple",
        "internalType": "struct IArchitectBase.CreateSpace",
        "components": [
          {
            "name": "metadata",
            "type": "tuple",
            "internalType": "struct IArchitectBase.Metadata",
            "components": [
              {
                "name": "name",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "uri",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "shortDescription",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "longDescription",
                "type": "string",
                "internalType": "string"
              }
            ]
          },
          {
            "name": "membership",
            "type": "tuple",
            "internalType": "struct IArchitectBase.Membership",
            "components": [
              {
                "name": "settings",
                "type": "tuple",
                "internalType": "struct IMembershipBase.Membership",
                "components": [
                  {
                    "name": "name",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "symbol",
                    "type": "string",
                    "internalType": "string"
                  },
                  {
                    "name": "price",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "maxSupply",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "duration",
                    "type": "uint64",
                    "internalType": "uint64"
                  },
                  {
                    "name": "currency",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "feeRecipient",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "freeAllocation",
                    "type": "uint256",
                    "internalType": "uint256"
                  },
                  {
                    "name": "pricingModule",
                    "type": "address",
                    "internalType": "address"
                  }
                ]
              },
              {
                "name": "requirements",
                "type": "tuple",
                "internalType": "struct IArchitectBase.MembershipRequirements",
                "components": [
                  {
                    "name": "everyone",
                    "type": "bool",
                    "internalType": "bool"
                  },
                  {
                    "name": "users",
                    "type": "address[]",
                    "internalType": "address[]"
                  },
                  {
                    "name": "ruleData",
                    "type": "bytes",
                    "internalType": "bytes"
                  }
                ]
              },
              {
                "name": "permissions",
                "type": "string[]",
                "internalType": "string[]"
              }
            ]
          },
          {
            "name": "channel",
            "type": "tuple",
            "internalType": "struct IArchitectBase.ChannelInfo",
            "components": [
              {
                "name": "metadata",
                "type": "string",
                "internalType": "string"
              }
            ]
          },
          {
            "name": "prepay",
            "type": "tuple",
            "internalType": "struct IArchitectBase.Prepay",
            "components": [
              {
                "name": "supply",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getSpaceArchitectImplementations",
    "inputs": [],
    "outputs": [
      {
        "name": "spaceToken",
        "type": "address",
        "internalType": "contract ISpaceOwner"
      },
      {
        "name": "userEntitlementImplementation",
        "type": "address",
        "internalType": "contract IUserEntitlement"
      },
      {
        "name": "ruleEntitlementImplementation",
        "type": "address",
        "internalType": "contract IRuleEntitlementV2"
      },
      {
        "name": "legacyRuleEntitlement",
        "type": "address",
        "internalType": "contract IRuleEntitlement"
      },
      {
        "name": "spaceProxyInitializer",
        "type": "address",
        "internalType": "contract ISpaceProxyInitializer"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSpaceByTokenId",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTokenIdBySpace",
    "inputs": [
      {
        "name": "space",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setSpaceArchitectImplementations",
    "inputs": [
      {
        "name": "spaceToken",
        "type": "address",
        "internalType": "contract ISpaceOwner"
      },
      {
        "name": "userEntitlementImplementation",
        "type": "address",
        "internalType": "contract IUserEntitlement"
      },
      {
        "name": "ruleEntitlementImplementation",
        "type": "address",
        "internalType": "contract IRuleEntitlementV2"
      },
      {
        "name": "legacyRuleEntitlement",
        "type": "address",
        "internalType": "contract IRuleEntitlement"
      },
      {
        "name": "spaceProxyInitializer",
        "type": "address",
        "internalType": "contract ISpaceProxyInitializer"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InterfaceAdded",
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4",
        "indexed": true,
        "internalType": "bytes4"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InterfaceRemoved",
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4",
        "indexed": true,
        "internalType": "bytes4"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Paused",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PricingModuleAdded",
    "inputs": [
      {
        "name": "module",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PricingModuleRemoved",
    "inputs": [
      {
        "name": "module",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PricingModuleUpdated",
    "inputs": [
      {
        "name": "module",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SpaceCreated",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "space",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Unpaused",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "Architect__InvalidAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Architect__InvalidNetworkId",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Architect__InvalidPricingModule",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Architect__InvalidStringLength",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Architect__NotContract",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Factory__FailedDeployment",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Initializable_InInitializingState",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Initializable_NotInInitializingState",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Introspection_AlreadySupported",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Introspection_NotSupported",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidPricingModule",
    "inputs": [
      {
        "name": "module",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "Ownable__NotOwner",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "Ownable__ZeroAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Pausable__NotPaused",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Pausable__Paused",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyGuard__ReentrantCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Validator__InvalidAddress",
    "inputs": []
  }
] as const

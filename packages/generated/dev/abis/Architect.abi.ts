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
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getProxyInitializer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract ISpaceProxyInitializer"
      }
    ],
    "stateMutability": "view"
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
    "name": "setProxyInitializer",
    "inputs": [
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
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Architect__ProxyInitializerSet",
    "inputs": [
      {
        "name": "proxyInitializer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
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
    "name": "PermissionsAddedToChannelRole",
    "inputs": [
      {
        "name": "updater",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "roleId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "channelId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PermissionsRemovedFromChannelRole",
    "inputs": [
      {
        "name": "updater",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "roleId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "channelId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PermissionsUpdatedForChannelRole",
    "inputs": [
      {
        "name": "updater",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "roleId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "channelId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
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
    "name": "RoleCreated",
    "inputs": [
      {
        "name": "creator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "roleId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoleRemoved",
    "inputs": [
      {
        "name": "remover",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "roleId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoleUpdated",
    "inputs": [
      {
        "name": "updater",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "roleId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
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
    "name": "Reentrancy",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Roles__EntitlementAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Roles__EntitlementDoesNotExist",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Roles__InvalidEntitlementAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Roles__InvalidPermission",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Roles__PermissionAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Roles__PermissionDoesNotExist",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Roles__RoleDoesNotExist",
    "inputs": []
  }
] as const

export default [
  {
    "type": "function",
    "name": "__PrepayFacet_init",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "calculateMembershipPrepayFee",
    "inputs": [
      {
        "name": "supply",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "prepaidMembershipSupply",
    "inputs": [
      {
        "name": "account",
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
    "name": "prepayMembership",
    "inputs": [
      {
        "name": "membership",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "supply",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
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
    "name": "PlatformFeeRecipientSet",
    "inputs": [
      {
        "name": "recipient",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlatformMembershipBpsSet",
    "inputs": [
      {
        "name": "bps",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlatformMembershipDurationSet",
    "inputs": [
      {
        "name": "duration",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlatformMembershipFeeSet",
    "inputs": [
      {
        "name": "fee",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlatformMembershipMinPriceSet",
    "inputs": [
      {
        "name": "minPrice",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlatformMembershipMintLimitSet",
    "inputs": [
      {
        "name": "limit",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PrepayBase__Prepaid",
    "inputs": [
      {
        "name": "membership",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "supply",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
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
    "name": "Platform__InvalidFeeRecipient",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Platform__InvalidMembershipBps",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Platform__InvalidMembershipDuration",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Platform__InvalidMembershipMinPrice",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Platform__InvalidMembershipMintLimit",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PrepayBase__FreeAllocationNotUsed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PrepayBase__InvalidAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PrepayBase__InvalidAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PrepayBase__InvalidMembership",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyGuard__ReentrantCall",
    "inputs": []
  }
] as const

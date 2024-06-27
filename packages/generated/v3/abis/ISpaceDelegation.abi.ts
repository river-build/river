export default [
  {
    "type": "function",
    "name": "getSpaceDelegation",
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
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSpaceDelegationsByOperator",
    "inputs": [
      {
        "name": "operator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalDelegation",
    "inputs": [
      {
        "name": "operator",
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
    "name": "riverToken",
    "inputs": [],
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
    "name": "setMainnetDelegation",
    "inputs": [
      {
        "name": "mainnetDelegation_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setRiverToken",
    "inputs": [
      {
        "name": "riverToken",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setStakeRequirement",
    "inputs": [
      {
        "name": "stakeRequirement_",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "MainnetDelegationChanged",
    "inputs": [
      {
        "name": "mainnetDelegation",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RiverTokenChanged",
    "inputs": [
      {
        "name": "riverToken",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SpaceDelegatedToOperator",
    "inputs": [
      {
        "name": "space",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "operator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "StakeRequirementChanged",
    "inputs": [
      {
        "name": "stakeRequirement",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "SpaceDelegation__AlreadyDelegated",
    "inputs": [
      {
        "name": "operator",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "SpaceDelegation__AlreadyRegistered",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SpaceDelegation__InvalidAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SpaceDelegation__InvalidOperator",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SpaceDelegation__InvalidSpace",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SpaceDelegation__InvalidStakeRequirement",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SpaceDelegation__InvalidStatusTransition",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SpaceDelegation__NotEnoughStake",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SpaceDelegation__NotRegistered",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SpaceDelegation__NotTransferable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SpaceDelegation__StatusNotChanged",
    "inputs": []
  }
] as const

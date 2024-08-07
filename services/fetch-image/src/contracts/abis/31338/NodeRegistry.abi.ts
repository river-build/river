export default [
  {
    "type": "function",
    "name": "getAllNodeAddresses",
    "inputs": [],
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
    "name": "getAllNodes",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct Node[]",
        "components": [
          {
            "name": "status",
            "type": "uint8",
            "internalType": "enum NodeStatus"
          },
          {
            "name": "url",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "nodeAddress",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "operator",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getNode",
    "inputs": [
      {
        "name": "nodeAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct Node",
        "components": [
          {
            "name": "status",
            "type": "uint8",
            "internalType": "enum NodeStatus"
          },
          {
            "name": "url",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "nodeAddress",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "operator",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getNodeCount",
    "inputs": [],
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
    "name": "registerNode",
    "inputs": [
      {
        "name": "nodeAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "url",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "status",
        "type": "uint8",
        "internalType": "enum NodeStatus"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeNode",
    "inputs": [
      {
        "name": "nodeAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateNodeStatus",
    "inputs": [
      {
        "name": "nodeAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "status",
        "type": "uint8",
        "internalType": "enum NodeStatus"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateNodeUrl",
    "inputs": [
      {
        "name": "nodeAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "url",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "NodeAdded",
    "inputs": [
      {
        "name": "nodeAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "url",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "status",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum NodeStatus"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "NodeRemoved",
    "inputs": [
      {
        "name": "nodeAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "NodeStatusUpdated",
    "inputs": [
      {
        "name": "nodeAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "status",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum NodeStatus"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "NodeUrlUpdated",
    "inputs": [
      {
        "name": "nodeAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "url",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  }
] as const

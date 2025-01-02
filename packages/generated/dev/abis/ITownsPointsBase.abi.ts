export default [
  {
    "type": "event",
    "name": "CheckedIn",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "points",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "streak",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "lastCheckIn",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "TownsPoints__CheckInPeriodNotPassed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TownsPoints__InvalidArrayLength",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TownsPoints__InvalidSpace",
    "inputs": []
  }
] as const
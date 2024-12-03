export default [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "initDiamondCut",
        "type": "tuple",
        "internalType": "struct Diamond.InitParams",
        "components": [
          {
            "name": "baseFacets",
            "type": "tuple[]",
            "internalType": "struct IDiamond.FacetCut[]",
            "components": [
              {
                "name": "facetAddress",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "action",
                "type": "uint8",
                "internalType": "enum IDiamond.FacetCutAction"
              },
              {
                "name": "functionSelectors",
                "type": "bytes4[]",
                "internalType": "bytes4[]"
              }
            ]
          },
          {
            "name": "init",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "initData",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "fallback",
    "stateMutability": "payable"
  },
  {
    "type": "receive",
    "stateMutability": "payable"
  },
  {
    "type": "event",
    "name": "DiamondCut",
    "inputs": [
      {
        "name": "facetCuts",
        "type": "tuple[]",
        "indexed": false,
        "internalType": "struct IDiamond.FacetCut[]",
        "components": [
          {
            "name": "facetAddress",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "action",
            "type": "uint8",
            "internalType": "enum IDiamond.FacetCutAction"
          },
          {
            "name": "functionSelectors",
            "type": "bytes4[]",
            "internalType": "bytes4[]"
          }
        ]
      },
      {
        "name": "init",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "initPayload",
        "type": "bytes",
        "indexed": false,
        "internalType": "bytes"
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
    "type": "error",
    "name": "AddressEmptyCode",
    "inputs": [
      {
        "name": "target",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "DiamondCut_FunctionAlreadyExists",
    "inputs": [
      {
        "name": "selector",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ]
  },
  {
    "type": "error",
    "name": "DiamondCut_FunctionDoesNotExist",
    "inputs": [
      {
        "name": "facet",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "DiamondCut_FunctionFromSameFacetAlreadyExists",
    "inputs": [
      {
        "name": "selector",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ]
  },
  {
    "type": "error",
    "name": "DiamondCut_ImmutableFacet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DiamondCut_InvalidContract",
    "inputs": [
      {
        "name": "init",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "DiamondCut_InvalidFacet",
    "inputs": [
      {
        "name": "facet",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "DiamondCut_InvalidFacetCutLength",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DiamondCut_InvalidFacetRemoval",
    "inputs": [
      {
        "name": "facet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "selector",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ]
  },
  {
    "type": "error",
    "name": "DiamondCut_InvalidFacetSelectors",
    "inputs": [
      {
        "name": "facet",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "DiamondCut_InvalidSelector",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Diamond_UnsupportedFunction",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FailedCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Initializable_AlreadyInitialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "error",
    "name": "Proxy__ImplementationIsNotContract",
    "inputs": []
  }
] as const

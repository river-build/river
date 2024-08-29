package utils

import (
	"context"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Facet represents the struct returned by the facets() function
type Facet struct {
	FacetAddress common.Address
	Selectors    [][4]byte
	SelectorsHex []string `abi:"-"`
}

// ReadAllFacets reads all the facets from the given contract address
func ReadAllFacets(client *ethclient.Client, contractAddress string) ([]Facet, error) {
	if client == nil {
		return nil, fmt.Errorf("Ethereum client is nil")
	}

	// Parse the ABI
	contractABI, err := abi.JSON(strings.NewReader(`[
        {
            "inputs": [],
            "name": "facets",
            "outputs": [{
                "components": [
                    {"internalType": "address", "name": "facet", "type": "address"},
                    {"internalType": "bytes4[]", "name": "selectors", "type": "bytes4[]"}
                ],
                "internalType": "struct IDiamondLoupeBase.Facet[]",
                "name": "",
                "type": "tuple[]"
            }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "address", "name": "_facet", "type": "address"}],
            "name": "facetFunctionSelectors",
            "outputs": [{"internalType": "bytes4[]", "name": "", "type": "bytes4[]"}],
            "stateMutability": "view",
            "type": "function"
        }
    ]`))
	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %v", err)
	}

	// Create a new instance of the contract
	contract := common.HexToAddress(contractAddress)

	// Call the facets() function
	data, err := contractABI.Pack("facets")
	if err != nil {
		return nil, fmt.Errorf("failed to pack data: %v", err)
	}

	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contract,
		Data: data,
	}, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to call contract: %v", err)
	}

	// Unpack the result
	var facets []Facet
	err = contractABI.UnpackIntoInterface(&facets, "facets", result)
	if err != nil {
		return nil, fmt.Errorf("failed to unpack result: %v", err)
	}

	// Iterate through all facet addresses and call facetFunctionSelectors
	for i, facet := range facets {
		data, err := contractABI.Pack("facetFunctionSelectors", facet.FacetAddress)
		if err != nil {
			return nil, fmt.Errorf("failed to pack data for facetFunctionSelectors: %v", err)
		}

		result, err := client.CallContract(context.Background(), ethereum.CallMsg{
			To:   &contract,
			Data: data,
		}, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to call facetFunctionSelectors: %v", err)
		}
		var selectors []common.Hash
		err = contractABI.UnpackIntoInterface(&selectors, "facetFunctionSelectors", result)
		if err != nil {
			return nil, fmt.Errorf("failed to unpack facetFunctionSelectors result: %v", err)
		}

		// Convert selectors to hex strings
		hexSelectors := make([]string, len(selectors))
		for j, selector := range selectors {
			// Convert the 4-byte selector to a hex string, preserving all bytes
			hexString := hex.EncodeToString(selector[:])

			// Trim trailing zeros, but ensure at least one character remains
			trimmed := strings.TrimRight(hexString, "0")
			if trimmed == "" {
				trimmed = "0"
			}

			// Ensure the string represents at least one byte (two hex characters)
			if len(trimmed)%2 != 0 {
				trimmed = "0" + trimmed
			}

			// Add "0x" prefix
			hexSelectors[j] = "0x" + trimmed
		}

		facets[i].SelectorsHex = hexSelectors
	}

	return facets, nil
}

func CreateEthereumClients(baseRpcUrl, baseSepoliaRpcUrl, originEnvironment, targetEnvironment string, verbose bool) (map[string]*ethclient.Client, error) {
	clients := make(map[string]*ethclient.Client)

	for _, env := range []string{originEnvironment, targetEnvironment} {
		var rpcUrl string
		if env == "alpha" || env == "gamma" {
			rpcUrl = baseSepoliaRpcUrl
		} else {
			rpcUrl = baseRpcUrl
		}

		client, err := ethclient.Dial(rpcUrl)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to the Ethereum client for %s: %v", env, err)
		}

		clients[env] = client

		if verbose {
			fmt.Printf("Successfully connected to Ethereum client for %s\n", env)
		}
	}

	return clients, nil
}

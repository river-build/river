package cmd

import (
	"bytecode-diff/utils"
	"fmt"
	"os"
	"path/filepath"

	"github.com/ethereum/go-ethereum/common"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
)

var AddHashesCmd = &cobra.Command{
	Use:   "add-hashes [environment] [yaml_file_path]",
	Short: "Add bytecode hashes to a YAML file for a specific environment",
	Args:  cobra.ExactArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		environment := args[0]
		yamlFilePath := args[1]

		supportedEnvironments := []string{"alpha", "gamma", "omega"}
		if !utils.Contains(supportedEnvironments, environment) {
			log.Fatal().
				Str("environment", environment).
				Msg("Environment not supported. Environment can be one of alpha, gamma, or omega.")
		}

		if baseRpcUrl == "" {
			log.Fatal().
				Msg("Base RPC URL not provided. Set it using --base-rpc-url flag or BASE_RPC_URL environment variable")
		}

		if baseSepoliaRpcUrl == "" {
			log.Fatal().
				Msg("Base Sepolia RPC URL not provided. Set it using --base-sepolia-rpc-url flag or BASE_SEPOLIA_RPC_URL environment variable")
		}

		// Create Ethereum client
		clients, err := utils.CreateEthereumClients(
			baseRpcUrl,
			baseSepoliaRpcUrl,
			environment,
			"",
			false,
		)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to create Ethereum client")
		}
		defer clients[environment].Close()

		// Read YAML file
		yamlData, err := os.ReadFile(yamlFilePath)
		if err != nil {
			log.Fatal().Err(err).Str("file", yamlFilePath).Msg("Failed to read YAML file")
		}

		var data map[string]interface{}
		err = yaml.Unmarshal(yamlData, &data)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to unmarshal YAML data")
		}

		// Process deployments
		deployments, ok := data["deployments"].(map[string]interface{})
		if !ok {
			log.Fatal().Msg("Invalid YAML structure: 'deployments' field not found or not a map")
		}

		for name, deployment := range deployments {
			deploymentMap, ok := deployment.(map[string]interface{})
			if !ok {
				log.Warn().Str("name", name).Msg("Skipping invalid deployment entry")
				continue
			}

			address, ok := deploymentMap["address"].(string)
			if !ok {
				log.Warn().Str("name", name).Msg("Skipping deployment without valid address")
				continue
			}

			addressBytes := common.HexToAddress(address)
			hash, err := utils.GetContractCodeHash(clients[environment], addressBytes)
			if err != nil {
				log.Error().Err(err).Str("name", name).Str("address", address).Msg("Failed to get contract code hash")
				continue
			}

			deploymentMap["bytecodeHash"] = hash
		}

		// Write updated YAML file
		outputPath := filepath.Join(
			filepath.Dir(yamlFilePath),
			fmt.Sprintf(
				"%s_hashed.yaml",
				filepath.Base(yamlFilePath[:len(yamlFilePath)-len(filepath.Ext(yamlFilePath))]),
			),
		)

		updatedYAML, err := yaml.Marshal(data)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to marshal updated YAML data")
		}

		err = os.WriteFile(outputPath, updatedYAML, 0644)
		if err != nil {
			log.Fatal().Err(err).Str("file", outputPath).Msg("Failed to write updated YAML file")
		}

		log.Info().Str("file", outputPath).Msg("Successfully wrote updated YAML file with bytecode hashes")
	},
}

func init() {
	AddHashesCmd.Flags().StringVar(&baseRpcUrl, "base-rpc-url", os.Getenv("BASE_RPC_URL"), "Base RPC URL")
	AddHashesCmd.Flags().
		StringVar(&baseSepoliaRpcUrl, "base-sepolia-rpc-url", os.Getenv("BASE_SEPOLIA_RPC_URL"), "Base Sepolia RPC URL")
}

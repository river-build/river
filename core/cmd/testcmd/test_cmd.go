package testcmd

import (
	"context"
	"fmt"

	"github.com/ethereum/go-ethereum/common"
	"github.com/spf13/cobra"

	"github.com/river-build/river/core/cmd"
	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/rpc"
)

func runPing2(ctx context.Context, cfg *config.Config) error {
	blockchain, err := crypto.NewBlockchain(
		ctx,
		&cfg.RiverChain,
		nil,
		infra.NewMetricsFactory(nil, "river", "cmdline"),
		nil,
	)
	if err != nil {
		return err
	}

	registryContract, err := registries.NewRiverRegistryContract(ctx, blockchain, &cfg.RegistryContract)
	if err != nil {
		return err
	}

	nodeRegistry, err := nodes.LoadNodeRegistry(
		ctx, registryContract, common.Address{}, blockchain.InitialBlockNum, blockchain.ChainMonitor, nil)
	if err != nil {
		return err
	}

	result, err := rpc.GetRiverNetworkStatus(ctx, cfg, nodeRegistry, blockchain, nil)
	if err != nil {
		return err
	}

	fmt.Println(result.ToPrettyJson())
	return nil
}

func init() {
	cm := &cobra.Command{
		Use:   "ping2",
		Short: "Pings all nodes in the network based on config and print the results as JSON",
		RunE: func(cm *cobra.Command, args []string) error {
			return runPing2(cm.Context(), cmd.CmdConfig)
		},
	}

	cmd.RootCmd.AddCommand(cm)
}

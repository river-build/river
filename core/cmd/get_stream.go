package cmd

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/shared"
)

func listRegisteredStream(ctx context.Context, cfg config.Config, streamId shared.StreamId) error {
	riverChain, err := crypto.NewBlockchain(ctx, &cfg.RiverChain, nil, nil, nil)
	if err != nil {
		return fmt.Errorf("error initialzing river blockchain: %w", err)
	}

	riverRegistryContract, err := registries.NewRiverRegistryContract(ctx, riverChain, &cfg.RegistryContract)
	if err != nil {
		return fmt.Errorf("unable to instanstiate river registry contract: %w", err)
	}

	streamResult, err := riverRegistryContract.GetStream(ctx, streamId)
	if err != nil {
		return fmt.Errorf("error fetching stream with genesis: %w", err)
	}

	var d []byte
	if d, err = yaml.Marshal(streamResult); err != nil {
		return fmt.Errorf("unable to marshal stream result: %w", err)
	}
	fmt.Printf("River chain stream result for stream id (%v): \n%s\n\n", streamId, string(d))

	return nil
}

func init() {
	cmd := &cobra.Command{
		Use:   "get_registered_stream <streamId>",
		Short: "List stream contents for a stream",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			streamId, err := shared.StreamIdFromString(args[0])
			if err != nil {
				return fmt.Errorf("could not parse stream id from arguments: %w", err)
			}
			return listRegisteredStream(cmd.Context(), *cmdConfig, streamId)
		},
	}

	rootCmd.AddCommand(cmd)
}

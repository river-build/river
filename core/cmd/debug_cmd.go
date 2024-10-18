package cmd

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/ethereum/go-ethereum/common"
	"github.com/spf13/cobra"

	"github.com/river-build/river/core/client/syncer/checker"
	"github.com/river-build/river/core/config"
)

func runDebugSync(ctx context.Context, cfg *config.Config, nodeAddr string) error {
	node := common.HexToAddress(nodeAddr)

	onExit := make(chan error, 1)
	err := checker.StartStreamChecker(ctx, cfg, node, onExit)
	if err != nil {
		return err
	}

	// Wait for either Ctrl-C or onExit
	osSignal := make(chan os.Signal, 1)
	signal.Notify(osSignal, syscall.SIGINT, syscall.SIGTERM)
	select {
	case <-ctx.Done():
		return ctx.Err()
	case err := <-onExit:
		return err
	case <-osSignal:
		return nil
	}
}

func init() {
	cmd := &cobra.Command{
		Use:   "debug",
		Short: "Debug commands",
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "sync <node_addr>",
		Short: "Sync streams from a specified node",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			nodeAddr := args[0]
			return runDebugSync(cmd.Context(), cmdConfig, nodeAddr)
		},
	})

	rootCmd.AddCommand(cmd)
}

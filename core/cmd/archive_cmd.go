package cmd

import (
	"context"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/rpc"

	"github.com/spf13/cobra"
)

func runArchive(cfg *config.Config, once bool) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here
	err := setupProfiler(ctx, cfg)
	if err != nil {
		return err
	}
	return rpc.RunArchive(ctx, cfg, once)
}

func init() {
	cmdArch := &cobra.Command{
		Use:   "archive",
		Short: "Runs the node in archive mode",
		RunE: func(cmd *cobra.Command, args []string) error {
			once, err := cmd.Flags().GetBool("once")
			if err != nil {
				return err
			}
			return runArchive(CmdConfig, once)
		},
	}

	cmdArch.Flags().Bool("once", false, "Run the archiver once and exit")

	RootCmd.AddCommand(cmdArch)
}

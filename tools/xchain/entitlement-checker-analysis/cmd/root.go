package cmd

import (
	"os"

	"github.com/river-build/river/tools/xchain/entitlement-checker-analysis/entitlement"
	"github.com/spf13/cobra"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "xchain-entitlement-cli <from-block> [to-block]",
	Short: "Get an overview over entitlement check requests",
	Args:  cobra.MinimumNArgs(1),
	Run:   entitlement.Run,
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.Flags().String("rpc.endpoint", "", "RPC endpoint")
	rootCmd.Flags().String("env", "omega", "Environment [omega, gamma, alpha]")
}

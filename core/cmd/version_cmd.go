package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/towns-protocol/towns/core/river_node/version"
)

func init() {
	cmd := &cobra.Command{
		Use:   "version",
		Short: "Print version information",
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Println(version.GetFullVersion())
			return nil
		},
	}

	rootCmd.AddCommand(cmd)
}

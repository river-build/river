package cmd

import (
	"fmt"
	"os"
	"time"

	"github.com/linkdata/deadlock"
	"github.com/spf13/cobra"
	"github.com/towns-protocol/towns/core/config"
	"github.com/towns-protocol/towns/core/config/builder"
)

var configFiles []string

var (
	cmdConfig        *config.Config
	cmdConfigBuilder *builder.ConfigBuilder[config.Config]
)

var rootCmd = &cobra.Command{
	Use:          "river_node",
	Short:        "River Protocol Node",
	SilenceUsage: true, // Do not print usage when an error occurs
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		if err.Error() == "info_debug_exit" {
			fmt.Println("Exiting with code 22 to initiate a restart")
			os.Exit(22)
			return
		}
		os.Exit(1)
	}
}

func initViperConfig() (*config.Config, *builder.ConfigBuilder[config.Config], error) {
	cfg := config.GetDefaultConfig()

	bld, err := builder.NewConfigBuilder(cfg, "RIVER")
	if err != nil {
		return nil, nil, err
	}

	err = bld.BindPFlag("Log.Level", rootCmd.PersistentFlags().Lookup("log_level"))
	if err != nil {
		return nil, nil, err
	}
	err = bld.BindPFlag("Log.File", rootCmd.PersistentFlags().Lookup("log_file"))
	if err != nil {
		return nil, nil, err
	}
	err = bld.BindPFlag("Log.Console", rootCmd.PersistentFlags().Lookup("log_to_console"))
	if err != nil {
		return nil, nil, err
	}
	err = bld.BindPFlag("Log.NoColor", rootCmd.PersistentFlags().Lookup("log_no_color"))
	if err != nil {
		return nil, nil, err
	}

	for _, configFile := range configFiles {
		err = bld.LoadConfig(configFile)
		if err != nil {
			return nil, nil, err
		}
	}

	cfg, err = bld.Build()
	if err != nil {
		return nil, nil, err
	}

	err = cfg.Init()
	if err != nil {
		return nil, nil, err
	}

	return cfg, bld, nil
}

func initConfigAndLog() {
	var err error
	cmdConfig, cmdConfigBuilder, err = initViperConfig()
	if err != nil {
		fmt.Println("Failed to initialize config, error=", err)
		os.Exit(1)
	}
	InitLogFromConfig(&cmdConfig.Log)
}

func init() {
	deadlock.Opts.WriteLocked(func() {
		deadlock.Opts.DeadlockTimeout = 5 * time.Minute
		deadlock.Opts.MaxMapSize = 1024 * 256
		deadlock.Opts.PrintAllCurrentGoroutines = true
	})

	cobra.OnInitialize(initConfigAndLog)

	rootCmd.PersistentFlags().
		StringSliceVarP(&configFiles, "config", "c", []string{"./config/config.yaml"},
			"Path to the configuration file. Can be specified multiple times. Values are applied in sequence. Set to empty to disable default config.")

	rootCmd.PersistentFlags().StringP(
		"log_level",
		"l",
		"info",
		"Log level (options: trace, debug, info, warn, error, panic, fatal)",
	)
	rootCmd.PersistentFlags().String(
		"log_file",
		"",
		"Path to the log file",
	)
	rootCmd.PersistentFlags().Bool(
		"log_to_console",
		true,
		"Log to console",
	)
	rootCmd.PersistentFlags().Bool(
		"log_no_color",
		false,
		"Disable color in log output",
	)
}

package cmd

import (
	"context"
	"os"
	"os/signal"
	"runtime/debug"
	"sync"
	"syscall"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/spf13/cobra"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/logging"
	"github.com/river-build/river/core/node/rpc"
	"github.com/river-build/river/core/xchain/server"
)

func handleSignals(ctx context.Context) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, syscall.SIGSEGV, syscall.SIGABRT)

	go func() {
		for sig := range c {
			log := logging.FromCtx(ctx)
			log.Error("Caught signal", "signal", sig)
			debug.PrintStack() // Print stack trace for debugging
			os.Exit(1)         // Exit after logging
		}
	}()
}

func runServices(ctx context.Context, cfg *config.Config, stream bool, xchain bool) error {
	// Defer to recover from panics and log debug information
	defer func() {
		if r := recover(); r != nil {
			log := logging.FromCtx(ctx)
			log.Error("Panic occurred", "error", r)
			debug.PrintStack() // Print the stack trace
		}
	}()

	// Handle signals
	handleSignals(ctx)

	var err error
	err = setupProfiler("river-node", cfg)
	if err != nil {
		return err
	}

	log := logging.FromCtx(ctx)

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	var streamService *rpc.Service
	var metricsRegistry *prometheus.Registry
	var baseChain *crypto.Blockchain
	var riverChain *crypto.Blockchain
	if stream {
		streamService, err = rpc.StartServer(ctx, cancel, cfg, nil)
		if err != nil {
			log.Errorw("Failed to start server", "error", err)
			return err
		}
		defer streamService.Close()
		metricsRegistry = streamService.MetricsRegistry()
		baseChain = streamService.BaseChain()
		riverChain = streamService.RiverChain()
	}

	var xchainService server.XChain
	var wg sync.WaitGroup
	if xchain {
		xchainService, err = server.New(ctx, cfg, baseChain, riverChain, 1, metricsRegistry)
		if err != nil {
			return err
		}
		wg.Add(1)
		go func() {
			defer wg.Done()
			xchainService.Run(ctx)
		}()
	}

	osSignal := make(chan os.Signal, 1)
	signal.Notify(osSignal, syscall.SIGINT, syscall.SIGTERM)
	var signal os.Signal
	err = nil
	if streamService != nil {
		select {
		case signal = <-osSignal:
		case err = <-streamService.ExitSignal():
		}
	} else {
		signal = <-osSignal
	}

	if err == nil {
		log.Infow("Got OS signal", "signal", signal.String())
	} else {
		log.Errorw("Exiting with error", "error", err)
	}

	if xchainService != nil {
		xchainService.Stop()
	}

	wg.Wait()

	return err
}

func init() {
	cmd := &cobra.Command{
		Use:   "run",
		Short: "Runs the node with both stream or xchain services",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runServices(cmd.Context(), cmdConfig, true, true)
		},
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "stream",
		Short: "Runs the node in stream mode",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runServices(cmd.Context(), cmdConfig, true, false)
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "xchain",
		Short: "Runs the node in xchain mode",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runServices(cmd.Context(), cmdConfig, false, true)
		},
	})

	rootCmd.AddCommand(cmd)
}

package cmd

import (
	"context"
	"fmt"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/contracts/river"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/infra"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	. "github.com/river-build/river/core/node/shared"

	"github.com/spf13/cobra"
)

func srStreamDump(cfg *config.Config, countOnly, timeOnly bool) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here
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

	registryContract, err := registries.NewRiverRegistryContract(
		ctx,
		blockchain,
		&cfg.RegistryContract,
		&cfg.RiverRegistry,
	)
	if err != nil {
		return err
	}
	fmt.Printf("Using block number: %d\n", blockchain.InitialBlockNum)

	streamNum, err := registryContract.GetStreamCount(ctx, blockchain.InitialBlockNum)
	if err != nil {
		return err
	}
	fmt.Printf("Stream count reported: %d\n", streamNum)

	if countOnly {
		return nil
	}

	i := 0
	startTime := time.Now()
	err = registryContract.ForAllStreams(ctx, blockchain.InitialBlockNum, func(strm *registries.GetStreamResult) bool {
		if !timeOnly {
			s := fmt.Sprintf("%4d %s", i, strm.StreamId.String())
			fmt.Printf("%-69s %4d, %s\n", s, strm.LastMiniblockNum, strm.LastMiniblockHash.Hex())
			for _, node := range strm.Nodes {
				fmt.Printf("        %s\n", node.Hex())
			}
		}
		i++
		if timeOnly && i%50000 == 0 && i > 0 {
			elapsed := time.Since(startTime)
			fmt.Printf("Received %d streams in %s (%.1f streams/s)\n", i, elapsed, float64(i)/elapsed.Seconds())
		}
		return true
	})
	if err != nil {
		return err
	}
	elapsed := time.Since(startTime)
	fmt.Printf("TOTAL: %d ELAPSED: %s (%.1f streams/s)\n", i, elapsed, float64(i)/elapsed.Seconds())

	if streamNum != int64(i) {
		return RiverError(
			Err_INTERNAL,
			"Stream count mismatch",
			"GetStreamCount",
			streamNum,
			"ForAllStreams",
			i,
		)
	}

	return nil
}

func srStream(cfg *config.Config, streamId string) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here

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

	registryContract, err := registries.NewRiverRegistryContract(
		ctx,
		blockchain,
		&cfg.RegistryContract,
		&cfg.RiverRegistry,
	)
	if err != nil {
		return err
	}

	id, err := StreamIdFromString(streamId)
	if err != nil {
		return err
	}

	stream, err := registryContract.GetStream(ctx, id, blockchain.InitialBlockNum)
	if err != nil {
		return err
	}

	fmt.Printf("StreamId: %s\n", stream.StreamId.String())
	fmt.Printf("Miniblock: %d %s\n", stream.LastMiniblockNum, stream.LastMiniblockHash.Hex())
	fmt.Println("IsSealed: ", stream.IsSealed)
	fmt.Println("Nodes:")
	for i, node := range stream.Nodes {
		fmt.Printf("  %d %s\n", i, node)
	}

	return nil
}

func nodesDump(cfg *config.Config) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here

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

	registryContract, err := registries.NewRiverRegistryContract(
		ctx,
		blockchain,
		&cfg.RegistryContract,
		&cfg.RiverRegistry,
	)
	if err != nil {
		return err
	}

	nodes, err := registryContract.GetAllNodes(ctx, blockchain.InitialBlockNum)
	if err != nil {
		return err
	}

	for i, node := range nodes {
		fmt.Printf(
			"%4d %s %s %d (%-11s) %s\n",
			i,
			node.NodeAddress.Hex(),
			node.Operator.Hex(),
			node.Status,
			river.NodeStatusString(node.Status),
			node.Url,
		)
	}

	return nil
}

func settingsDump(cfg *config.Config) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here

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

	blockNum, err := blockchain.GetBlockNumber(ctx)
	if err != nil {
		return err
	}
	fmt.Printf("Using current block number: %d\n", blockNum)

	caller, err := river.NewRiverConfigV1Caller(cfg.RegistryContract.Address, blockchain.Client)
	if err != nil {
		return err
	}

	retrievedSettings, err := caller.GetAllConfiguration(&bind.CallOpts{
		Context:     ctx,
		BlockNumber: blockNum.AsBigInt(),
	})
	if err != nil {
		return err
	}

	if len(retrievedSettings) == 0 {
		fmt.Println("No settings found")
		return nil
	}

	for _, s := range retrievedSettings {
		fmt.Printf("%10d %s %s\n", s.BlockNumber, common.Hash(s.Key).Hex(), hexutil.Encode(s.Value))
	}

	return nil
}

func blockNumber(cfg *config.Config) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here

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

	blockNum, err := blockchain.GetBlockNumber(ctx)
	if err != nil {
		return err
	}
	fmt.Printf("%d\n", blockNum)

	return nil
}

func init() {
	srCmd := &cobra.Command{
		Use:     "registry",
		Aliases: []string{"reg"},
		Short:   "Stream registry management commands",
	}
	rootCmd.AddCommand(srCmd)

	streamsCmd := &cobra.Command{
		Use:   "streams",
		Short: "Dump stream records",
		RunE: func(cmd *cobra.Command, args []string) error {
			countOnly, err := cmd.Flags().GetBool("count")
			if err != nil {
				return err
			}
			timeOnly, err := cmd.Flags().GetBool("time")
			if err != nil {
				return err
			}
			return srStreamDump(cmdConfig, countOnly, timeOnly)
		},
	}
	streamsCmd.Flags().Bool("count", false, "Only print the stream count")
	streamsCmd.Flags().Bool("time", false, "Print only timing information")
	srCmd.AddCommand(streamsCmd)

	srCmd.AddCommand(&cobra.Command{
		Use:   "stream <stream-id>",
		Short: "Get stream info from stream registry",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return srStream(cmdConfig, args[0])
		},
	})

	srCmd.AddCommand(&cobra.Command{
		Use:   "nodes",
		Short: "Get node records from the registry contract",
		RunE: func(cmd *cobra.Command, args []string) error {
			return nodesDump(cmdConfig)
		},
	})

	srCmd.AddCommand(&cobra.Command{
		Use:   "settings",
		Short: "Dump settings from the registry contract",
		RunE: func(cmd *cobra.Command, args []string) error {
			return settingsDump(cmdConfig)
		},
	})

	srCmd.AddCommand(&cobra.Command{
		Use:     "blocknumber",
		Aliases: []string{"bn"},
		Short:   "Print current River chain block number",
		RunE: func(cmd *cobra.Command, args []string) error {
			return blockNumber(cmdConfig)
		},
	})
}

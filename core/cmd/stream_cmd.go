package cmd

import (
	"bytes"
	"context"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"github.com/spf13/cobra"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"

	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/shared"
)

func runStreamGetEventCmd(cmd *cobra.Command, args []string) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here
	streamID, err := shared.StreamIdFromString(args[0])
	if err != nil {
		return err
	}
	eventHash := common.HexToHash(args[1])
	blockchain, err := crypto.NewBlockchain(
		ctx,
		&cmdConfig.RiverChain,
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
		&cmdConfig.RegistryContract,
		&cmdConfig.RiverRegistry,
	)
	if err != nil {
		return err
	}

	stream, err := registryContract.StreamRegistry.GetStream(nil, streamID)
	if err != nil {
		return err
	}

	nodes := nodes.NewStreamNodesWithLock(stream.Nodes, common.Address{})
	remoteNodeAddress := nodes.GetStickyPeer()

	remote, err := registryContract.NodeRegistry.GetNode(nil, remoteNodeAddress)
	if err != nil {
		return err
	}

	remoteClient := protocolconnect.NewStreamServiceClient(http.DefaultClient, remote.Url)

	response, err := remoteClient.GetStream(ctx, connect.NewRequest(&protocol.GetStreamRequest{
		StreamId: streamID[:],
		Optional: false,
	}))
	if err != nil {
		return err
	}

	streamAndCookie := response.Msg.GetStream()

	to := streamAndCookie.GetNextSyncCookie().GetMinipoolGen()
	blockRange := int64(100)
	if len(args) == 3 {
		blockRange, err = strconv.ParseInt(args[2], 10, 64)
		if err != nil {
			return err
		}
	}
	from := max(to-blockRange, 0)

	miniblocks, err := remoteClient.GetMiniblocks(ctx, connect.NewRequest(&protocol.GetMiniblocksRequest{
		StreamId:      streamID[:],
		FromInclusive: from,
		ToExclusive:   to,
	}))
	if err != nil {
		return err
	}

	for n, miniblock := range miniblocks.Msg.GetMiniblocks() {
		// Parse header
		info, err := events.NewMiniblockInfoFromProto(
			miniblock,
			events.NewParsedMiniblockInfoOpts().
				WithExpectedBlockNumber(from+int64(n)),
		)
		if err != nil {
			return err
		}

		for _, event := range info.Proto.GetEvents() {
			if bytes.Equal(eventHash[:], event.GetHash()) {
				var streamEvent protocol.StreamEvent
				if err := proto.Unmarshal(event.Event, &streamEvent); err != nil {
					return err
				}

				fmt.Printf("\n%s\n", protojson.Format(&streamEvent))

				return nil
			}
		}
	}

	fmt.Printf("Event %s not found in stream %s (block range [%d...%d])\n", eventHash, streamID, from, to)

	return nil
}

func runStreamGetMiniblockCmd(cmd *cobra.Command, args []string) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here
	streamID, err := shared.StreamIdFromString(args[0])
	if err != nil {
		return err
	}
	miniblockHash := common.HexToHash(args[1])
	blockchain, err := crypto.NewBlockchain(
		ctx,
		&cmdConfig.RiverChain,
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
		&cmdConfig.RegistryContract,
		&cmdConfig.RiverRegistry,
	)
	if err != nil {
		return err
	}

	stream, err := registryContract.StreamRegistry.GetStream(nil, streamID)
	if err != nil {
		return err
	}

	nodes := nodes.NewStreamNodesWithLock(stream.Nodes, common.Address{})
	remoteNodeAddress := nodes.GetStickyPeer()

	remote, err := registryContract.NodeRegistry.GetNode(nil, remoteNodeAddress)
	if err != nil {
		return err
	}

	remoteClient := protocolconnect.NewStreamServiceClient(http.DefaultClient, remote.Url)

	response, err := remoteClient.GetStream(ctx, connect.NewRequest(&protocol.GetStreamRequest{
		StreamId: streamID[:],
		Optional: false,
	}))
	if err != nil {
		return err
	}

	streamAndCookie := response.Msg.GetStream()

	to := streamAndCookie.GetNextSyncCookie().GetMinipoolGen()
	blockRange := int64(100)
	if len(args) == 3 {
		blockRange, err = strconv.ParseInt(args[2], 10, 64)
		if err != nil {
			return err
		}
	}
	from := max(to-blockRange, 0)

	miniblocks, err := remoteClient.GetMiniblocks(ctx, connect.NewRequest(&protocol.GetMiniblocksRequest{
		StreamId:      streamID[:],
		FromInclusive: from,
		ToExclusive:   to,
	}))
	if err != nil {
		return err
	}

	for n, miniblock := range miniblocks.Msg.GetMiniblocks() {
		// Parse header
		info, err := events.NewMiniblockInfoFromProto(
			miniblock,
			events.NewParsedMiniblockInfoOpts().WithExpectedBlockNumber(from+int64(n)),
		)
		if err != nil {
			return err
		}

		if info.HeaderEvent().Hash == miniblockHash {
			mbHeader, ok := info.HeaderEvent().Event.Payload.(*protocol.StreamEvent_MiniblockHeader)
			if !ok {
				return fmt.Errorf("unable to parse header event as miniblock header")
			}

			if len(mbHeader.MiniblockHeader.EventHashes) != len(miniblock.Events) {
				return fmt.Errorf("malformatted miniblock: header event count and miniblock event count do not match")
			}

			for i, hash := range mbHeader.MiniblockHeader.EventHashes {
				if !bytes.Equal(miniblock.Events[i].Hash, hash) {
					return fmt.Errorf(
						"event %d hashes do not match: %v v %v in the header",
						i,
						hex.EncodeToString(miniblock.Events[i].Hash),
						hex.EncodeToString(hash),
					)
				}
			}

			fmt.Printf("\nMiniblock\n=========\n%s\n", protojson.Format(miniblock))

			fmt.Printf("\nHeader\n======\n%s\n", protojson.Format(mbHeader.MiniblockHeader))

			return nil
		}
	}

	fmt.Printf("Miniblock hash %s not found in stream %s (block range [%d...%d])\n", miniblockHash, streamID, from, to)

	return nil
}

func runStreamDumpCmd(cmd *cobra.Command, args []string) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here
	streamID, err := shared.StreamIdFromString(args[0])
	if err != nil {
		return err
	}

	blockchain, err := crypto.NewBlockchain(
		ctx,
		&cmdConfig.RiverChain,
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
		&cmdConfig.RegistryContract,
		&cmdConfig.RiverRegistry,
	)
	if err != nil {
		return err
	}

	stream, err := registryContract.StreamRegistry.GetStream(nil, streamID)
	if err != nil {
		return err
	}

	nodes := nodes.NewStreamNodesWithLock(stream.Nodes, common.Address{})
	remoteNodeAddress := nodes.GetStickyPeer()

	remote, err := registryContract.NodeRegistry.GetNode(nil, remoteNodeAddress)
	if err != nil {
		return err
	}

	remoteClient := protocolconnect.NewStreamServiceClient(http.DefaultClient, remote.Url)

	response, err := remoteClient.GetStream(ctx, connect.NewRequest(&protocol.GetStreamRequest{
		StreamId: streamID[:],
		Optional: false,
	}))
	if err != nil {
		return err
	}

	streamAndCookie := response.Msg.GetStream()

	to := streamAndCookie.GetNextSyncCookie().GetMinipoolGen()
	blockRange := int64(100)
	if len(args) == 2 {
		blockRange, err = strconv.ParseInt(args[1], 10, 64)
		if err != nil {
			return err
		}
	}
	from := max(to-blockRange, 0)

	miniblocks, err := remoteClient.GetMiniblocks(ctx, connect.NewRequest(&protocol.GetMiniblocksRequest{
		StreamId:      streamID[:],
		FromInclusive: from,
		ToExclusive:   to,
	}))
	if err != nil {
		return err
	}

	for n, miniblock := range miniblocks.Msg.GetMiniblocks() {
		// Parse header
		info, err := events.NewMiniblockInfoFromProto(
			miniblock,
			events.NewParsedMiniblockInfoOpts().WithExpectedBlockNumber(from+int64(n)),
		)
		if err != nil {
			return err
		}

		mbHeader, ok := info.HeaderEvent().Event.Payload.(*protocol.StreamEvent_MiniblockHeader)
		if !ok {
			return fmt.Errorf("unable to parse header event as miniblock header")
		}

		if len(mbHeader.MiniblockHeader.EventHashes) != len(miniblock.Events) {
			return fmt.Errorf("malformatted miniblock: header event count and miniblock event count do not match")
		}

		for i, hash := range mbHeader.MiniblockHeader.EventHashes {
			if !bytes.Equal(miniblock.Events[i].Hash, hash) {
				return fmt.Errorf(
					"event %d hashes do not match: %v v %v in the header",
					i,
					hex.EncodeToString(miniblock.Events[i].Hash),
					hex.EncodeToString(hash),
				)
			}
		}

		fmt.Printf(
			"\nMiniblock %d\n=========\n%s",
			mbHeader.MiniblockHeader.MiniblockNum,
			protojson.Format(miniblock),
		)
		fmt.Printf("\n(Parsed Header)\n-------------\n%s\n", protojson.Format(mbHeader.MiniblockHeader))
	}

	return nil
}

func init() {
	cmdStream := &cobra.Command{
		Use:   "stream",
		Short: "Access stream data",
	}

	cmdStreamGetEvent := &cobra.Command{
		Use:   "event",
		Short: "Get event <stream-id> <event-hash> [max-block-range]",
		Long: `Dump stream event to stdout.
max-block-range is optional and limits the number of blocks to consider (default=100)`,
		Args: cobra.RangeArgs(2, 3),
		RunE: runStreamGetEventCmd,
	}

	cmdStreamGetMiniblock := &cobra.Command{
		Use:   "miniblock",
		Short: "Get Miniblock <stream-id> <block-hash> [max-block-range]",
		Long: `Dump miniblock content to stdout.
max-block-range is optional and limits the number of blocks to consider (default=100)`,
		Args: cobra.RangeArgs(2, 3),
		RunE: runStreamGetMiniblockCmd,
	}

	cmdStreamDump := &cobra.Command{
		Use:   "dump",
		Short: "Dump stream contents <stream-id> [max-block-range]",
		Long: `Dump stream content to stdout.
max-block-range is optional and limits the number of blocks to consider (default=100)`,
		Args: cobra.RangeArgs(1, 2),
		RunE: runStreamDumpCmd,
	}

	cmdStream.AddCommand(cmdStreamGetMiniblock)
	cmdStream.AddCommand(cmdStreamGetEvent)
	cmdStream.AddCommand(cmdStreamDump)
	rootCmd.AddCommand(cmdStream)
}

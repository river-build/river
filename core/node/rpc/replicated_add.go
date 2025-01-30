package rpc

import (
	"context"
	"fmt"

	"github.com/ethereum/go-ethereum/common"

	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"

	"connectrpc.com/connect"
)

type replicatedStream struct {
	streamId    string
	localStream AddableStream
	nodes       StreamNodes
	service     *Service
}

var _ AddableStream = (*replicatedStream)(nil)

func (r *replicatedStream) AddEvent(ctx context.Context, event *ParsedEvent) error {
	remotes, _ := r.nodes.GetRemotesAndIsLocal()
	if len(remotes) == 0 {
		return r.localStream.AddEvent(ctx, event)
	}

	sender := NewQuorumPool("method", "replicatedStream.AddEvent", "streamId", r.streamId)

	sender.GoLocal(ctx, func(ctx context.Context) error {
		return r.localStream.AddEvent(ctx, event)
	})

	if len(remotes) > 0 {
		streamId, err := shared.StreamIdFromString(r.streamId)
		if err != nil {
			return err
		}
		sender.GoRemotes(ctx, remotes, func(ctx context.Context, node common.Address) error {
			stub, err := r.service.nodeRegistry.GetNodeToNodeClientForAddress(node)
			if err != nil {
				return err
			}
			_, err = stub.NewEventReceived(
				ctx,
				connect.NewRequest[NewEventReceivedRequest](
					&NewEventReceivedRequest{
						StreamId: streamId[:],
						Event:    event.Envelope,
					},
				),
			)
			return err
		})
	}

	err := sender.Wait()
	if err != nil {
		// Count Err_MINIBLOCK_TOO_NEW is base errors.
		riverErr := AsRiverError(err)
		count := 0
		for _, base := range riverErr.Bases {
			fmt.Printf("base type: %T\n", base)
			if AsRiverError(base).Code == Err_MINIBLOCK_TOO_NEW {
				count++
			}
		}
		fmt.Println("========================================= MINIBLOCK_TOO_NEW", count)
		return err
	}

	return nil
}

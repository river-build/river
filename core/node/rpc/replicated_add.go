package rpc

import (
	"context"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"

	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
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

	return sender.Wait()
}

func (r *replicatedStream) AddMediaEvent(ctx context.Context, event *ParsedEvent) error {
	// TODO: Store event in the DB
	// TODO: Create next miniblock and store in ephemeral state
	// TODO: Remotes are always empty because the stream is not registered in the registry smart contract
	// TODO: that's why we need a creation cookie here.
	remotes, _ := r.nodes.GetRemotesAndIsLocal()
	if len(remotes) == 0 {
		return r.localStream.AddEvent(ctx, event)
	}

	sender := NewQuorumPool("method", "replicatedStream.AddMediaEvent", "streamId", r.streamId)

	sender.GoLocal(ctx, func(ctx context.Context) error {
		// TODO: Store ephemeral miniblock
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

	return sender.Wait()
}

package rpc

import (
	"context"
	"time"

	"github.com/ethereum/go-ethereum/common"

	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"

	"connectrpc.com/connect"
)

func (s *Service) replicatedAddEvent(ctx context.Context, stream *Stream, event *ParsedEvent) error {
	for {
		err := s.replicatedAddEventImpl(ctx, stream, event)
		if err == nil {
			return nil
		} else {
			// Look for Err_MINIBLOCK_TOO_NEW is base errors.
			riverErr := AsRiverError(err)
			retry := false
			for _, base := range riverErr.Bases {
				if AsRiverError(base).Code == Err_MINIBLOCK_TOO_NEW {
					retry = true
					break
				}
			}
			if !retry {
				return err
			}
		}

		err = SleepWithContext(ctx, 100*time.Millisecond)
		if err != nil {
			return err
		}
	}
}

func (s *Service) replicatedAddEventImpl(ctx context.Context, stream *Stream, event *ParsedEvent) error {
	remotes, isLocal := stream.GetRemotesAndIsLocal()
	if !isLocal {
		return RiverError(Err_INTERNAL, "replicatedAddEvent: stream must be local")
	}

	if len(remotes) == 0 {
		return stream.AddEvent(ctx, event)
	}

	streamId := stream.StreamId()
	sender := NewQuorumPool("method", "replicatedStream.AddEvent", "streamId", streamId)

	sender.GoLocal(ctx, func(ctx context.Context) error {
		return stream.AddEvent(ctx, event)
	})

	if len(remotes) > 0 {
		sender.GoRemotes(ctx, remotes, func(ctx context.Context, node common.Address) error {
			stub, err := s.nodeRegistry.GetNodeToNodeClientForAddress(node)
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

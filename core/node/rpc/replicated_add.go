package rpc

import (
	"context"
	"fmt"

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

func (r *replicatedStream) ApplyMiniblock(ctx context.Context, miniblock *MiniblockInfo) error {
	fmt.Println("ApplyMiniblock")
	return nil
}

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

func (r *replicatedStream) AddMediaEvent(ctx context.Context, event *ParsedEvent, view StreamView) (*Miniblock, error) {
	// TODO: Store event in the DB
	// TODO: Create next miniblock and store in ephemeral state
	remotes, _ := r.nodes.GetRemotesAndIsLocal()

	// TODO: Implement the following in the block producer:
	// 1. Build a miniblock from the current minipool events for the given stream
	// 2. Save the given miniblock in ephemenral state

	header, err := MakeEnvelopeWithPayload(r.service.wallet, Make_MiniblockHeader(&MiniblockHeader{
		MiniblockNum:             event.Event.PrevMiniblockNum + 1,
		PrevMiniblockHash:        event.Event.PrevMiniblockHash,
		Timestamp:                NextMiniblockTimestamp(nil),
		EventHashes:              nil,
		Snapshot:                 nil,
		EventNumOffset:           0,
		PrevSnapshotMiniblockNum: 0,
		Content:                  nil,
	}), event.MiniblockRef)
	if err != nil {
		return nil, err
	}

	ephemeralMb := &Miniblock{
		Events: []*Envelope{event.Envelope},
		Header: header,
	}

	sender := NewQuorumPool("method", "replicatedStream.AddMediaEvent", "streamId", r.streamId)

	sender.GoLocal(ctx, func(ctx context.Context) error {
		mbInfo, err := NewMiniblockInfoFromProto(
			ephemeralMb,
			NewMiniblockInfoFromProtoOpts{
				ExpectedBlockNumber: -1,
			},
		)
		if err != nil {
			return err
		}

		return r.localStream.ApplyMiniblock(ctx, mbInfo)
	})

	if len(remotes) > 0 {
		streamId, err := shared.StreamIdFromString(r.streamId)
		if err != nil {
			return nil, err
		}

		sender.GoRemotes(ctx, remotes, func(ctx context.Context, node common.Address) error {
			stub, err := r.service.nodeRegistry.GetNodeToNodeClientForAddress(node)
			if err != nil {
				return err
			}

			_, err = stub.SaveEphemeralMiniblock(
				ctx,
				connect.NewRequest[SaveEphemeralMiniblockRequest](
					&SaveEphemeralMiniblockRequest{
						StreamId:  streamId[:],
						Miniblock: ephemeralMb,
					},
				),
			)
			return err
		})
	}

	if err = sender.Wait(); err != nil {
		return nil, err
	}

	return ephemeralMb, nil
}

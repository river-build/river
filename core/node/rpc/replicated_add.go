package rpc

import (
	"context"

	"github.com/river-build/river/core/node/storage"

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

func (r *replicatedStream) AddMediaEvent(ctx context.Context, event *ParsedEvent, cc *CreationCookie) (*Miniblock, error) {
	streamId, err := shared.StreamIdFromString(r.streamId)
	if err != nil {
		return nil, err
	}

	header, err := MakeEnvelopeWithPayload(r.service.wallet, Make_MiniblockHeader(&MiniblockHeader{
		MiniblockNum:             event.MiniblockRef.Num,
		PrevMiniblockHash:        event.Event.PrevMiniblockHash,
		Timestamp:                NextMiniblockTimestamp(nil),
		EventHashes:              [][]byte{event.Hash[:]},
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

	// Save the ephemeral miniblock locally
	sender.GoLocal(ctx, func(ctx context.Context) error {
		mbInfo, err := NewMiniblockInfoFromProto(ephemeralMb, NewParsedMiniblockInfoOpts())
		if err != nil {
			return err
		}

		mbBytes, err := mbInfo.ToBytes()
		if err != nil {
			return err
		}

		return r.service.storage.WriteEphemeralMiniblock(ctx, streamId, &storage.WriteMiniblockData{
			Number:   mbInfo.Ref.Num,
			Hash:     mbInfo.Ref.Hash,
			Snapshot: mbInfo.IsSnapshot(),
			Data:     mbBytes,
		})
	})

	// Save the ephemeral miniblock on remotes
	sender.GoRemotes(ctx, cc.NodeAddresses(), func(ctx context.Context, node common.Address) error {
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

	if err = sender.Wait(); err != nil {
		return nil, err
	}

	return ephemeralMb, nil
}

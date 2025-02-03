package rpc

import (
	"context"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"google.golang.org/protobuf/proto"

	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
)

type replicatedStream struct {
	streamId    shared.StreamId
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

	sender.GoRemotes(ctx, remotes, func(ctx context.Context, node common.Address) error {
		stub, err := r.service.nodeRegistry.GetNodeToNodeClientForAddress(node)
		if err != nil {
			return err
		}
		_, err = stub.NewEventReceived(
			ctx,
			connect.NewRequest[NewEventReceivedRequest](
				&NewEventReceivedRequest{
					StreamId: r.streamId[:],
					Event:    event.Envelope,
				},
			),
		)
		return err
	})

	return sender.Wait()
}

func (r *replicatedStream) AddMediaEvent(ctx context.Context, event *ParsedEvent, cc *CreationCookie, last bool) (*Miniblock, error) {
	header, err := MakeEnvelopeWithPayload(r.service.wallet, Make_MiniblockHeader(&MiniblockHeader{
		MiniblockNum:      cc.MiniblockNum,
		PrevMiniblockHash: cc.PrevMiniblockHash,
		Timestamp:         NextMiniblockTimestamp(nil),
		EventHashes:       [][]byte{event.Hash[:]},
	}), event.MiniblockRef)
	if err != nil {
		return nil, err
	}

	ephemeralMb := &Miniblock{
		Events: []*Envelope{event.Envelope},
		Header: header,
	}

	nodes := NewStreamNodesWithLock(cc.NodeAddresses(), r.service.wallet.Address)
	remotes, _ := nodes.GetRemotesAndIsLocal()
	sender := NewQuorumPool("method", "replicatedStream.AddMediaEvent", "streamId", r.streamId)

	// These are needed to register the stream onchain if everything goes well.
	var genesisMiniblockHash common.Hash

	// Save the ephemeral miniblock locally
	sender.GoLocal(ctx, func(ctx context.Context) error {
		mbBytes, err := proto.Marshal(ephemeralMb)
		if err != nil {
			return err
		}

		if err = r.service.storage.WriteEphemeralMiniblock(ctx, r.streamId, &storage.WriteMiniblockData{
			Number:   cc.MiniblockNum,
			Hash:     common.BytesToHash(ephemeralMb.Header.Hash),
			Snapshot: false,
			Data:     mbBytes,
		}); err != nil {
			return err
		}

		// Return here if there are more chunks to upload.
		if !last {
			// TODO: this might be moved to the storage layer?
			r.service.ephStreams.onUpdated(r.streamId)

			return nil
		}

		// Normalize stream locally
		genesisMiniblockHash, err = r.service.storage.NormalizeEphemeralStream(ctx, r.streamId)
		if err != nil {
			return err
		}

		return nil
	})

	// Save the ephemeral miniblock on remotes
	sender.GoRemotes(ctx, remotes, func(ctx context.Context, node common.Address) error {
		stub, err := r.service.nodeRegistry.GetNodeToNodeClientForAddress(node)
		if err != nil {
			return err
		}

		if _, err = stub.SaveEphemeralMiniblock(
			ctx,
			connect.NewRequest[SaveEphemeralMiniblockRequest](
				&SaveEphemeralMiniblockRequest{
					StreamId:  r.streamId[:],
					Miniblock: ephemeralMb,
				},
			),
		); err != nil {
			return err
		}

		// Return here if there are more chunks to upload.
		if !last {
			return nil
		}

		// Seal ephemeral stream in remotes
		if _, err = stub.SealEphemeralStream(
			ctx,
			connect.NewRequest[SealEphemeralStreamRequest](
				&SealEphemeralStreamRequest{
					StreamId: r.streamId[:],
				},
			),
		); err != nil {
			return err
		}

		return nil
	})

	if err = sender.Wait(); err != nil {
		return nil, err
	}

	if last {
		// Register the given stream onchain with sealed flag
		if err = r.service.streamRegistry.AddStream(
			ctx,
			r.streamId,
			cc.NodeAddresses(),
			genesisMiniblockHash,
			common.BytesToHash(ephemeralMb.Header.Hash),
			0,
			true,
		); err != nil {
			return nil, err
		}

		// TODO: this might be moved to the storage layer?
		r.service.ephStreams.onSealed(r.streamId)
	}

	return ephemeralMb, nil
}

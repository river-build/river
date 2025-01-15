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

	if len(remotes) > 0 {
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
	}

	return sender.Wait()
}

func (r *replicatedStream) AddMediaEvent(ctx context.Context, event *ParsedEvent, cc *CreationCookie) (*Miniblock, error) {
	header, err := MakeEnvelopeWithPayload(r.service.wallet, Make_MiniblockHeader(&MiniblockHeader{
		MiniblockNum:             cc.MiniblockNum,
		PrevMiniblockHash:        cc.PrevMiniblockHash,
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
		mbBytes, err := proto.Marshal(ephemeralMb)
		if err != nil {
			return err
		}

		envelopeBytes, err := proto.Marshal(event.Envelope)
		if err != nil {
			return err
		}

		return r.service.storage.WriteEphemeralMiniblock(ctx, r.streamId, envelopeBytes, &storage.WriteMiniblockData{
			Number:   cc.MiniblockNum,
			Hash:     common.BytesToHash(ephemeralMb.Header.Hash),
			Snapshot: false,
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
					StreamId:  r.streamId[:],
					Miniblock: ephemeralMb,
				},
			),
		)
		return err
	})

	if err = sender.Wait(); err != nil {
		return nil, err
	}

	// Load all miniblocks from storage to check if all chunks were uploaded.
	// TODO: Introduce cache here
	miniblocks := make([]*MiniblockInfo, 0)
	if err = r.service.storage.ReadMiniblocksByStream(ctx, r.streamId, func(blockdata []byte, seqNum int) error {
		miniblock, err := NewMiniblockInfoFromBytes(blockdata, int64(seqNum))
		if err != nil {
			return err
		}
		miniblocks = append(miniblocks, miniblock)
		return nil
	}); err != nil {
		return nil, err
	}

	// Must be more than 0.
	// If the last media chunk was successfully uploaded, the stream must be registered onchain with a sealed state.
	if len(miniblocks) > 0 {
		// TODO: Check correctness of the chain

		// The miniblock with 0 number must be the genesis miniblock.
		// The genesis miniblock must have the media inception event.
		mediaInception := miniblocks[0].Events()[0].Event.GetMediaPayload().GetInception()

		// The number of expected blocks should be <num chunks> + 1 (genesis block).
		if mediaInception.GetChunkCount() <= int32(len(miniblocks)-1) {
			if err = r.service.streamRegistry.AddStream(
				ctx,
				r.streamId,
				cc.NodeAddresses(),
				miniblocks[0].Ref.Hash,
				miniblocks[len(miniblocks)-1].Ref.Hash,
				// miniblocks[len(miniblocks)-1].Ref.Num,
				0,
				true,
			); err != nil {
				return nil, err
			}

			if err = r.service.storage.NormalizeEphemeralStream(ctx, r.streamId); err != nil {
				return nil, err
			}
		}
	}

	return ephemeralMb, nil
}

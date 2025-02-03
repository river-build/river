package rpc

import (
	"context"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"google.golang.org/protobuf/proto"

	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/logging"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
)

func contextDeadlineLeft(ctx context.Context) time.Duration {
	deadline, ok := ctx.Deadline()
	if !ok {
		return -1
	}
	return time.Until(deadline)
}

func (s *Service) replicatedAddEvent(ctx context.Context, stream *Stream, event *ParsedEvent) error {
	originalDeadline := contextDeadlineLeft(ctx)

	backoff := BackoffTracker{
		NextDelay:   100 * time.Millisecond,
		MaxAttempts: 10,
		Multiplier:  2,
		Divisor:     1,
	}

	for {
		err := s.replicatedAddEventImpl(ctx, stream, event)
		if err == nil {
			if backoff.NumAttempts > 0 {
				logging.FromCtx(ctx).Warnw("replicatedAddEvent: success after backoff", "attempts", backoff.NumAttempts, "originalDeadline", originalDeadline.String(), "deadline", contextDeadlineLeft(ctx).String())
			}
			return nil
		}

		// Check if Err_MINIBLOCK_TOO_NEW code is present.
		if AsRiverError(err).IsCodeWithBases(Err_MINIBLOCK_TOO_NEW) {
			err = backoff.Wait(ctx, err)
			if err != nil {
				logging.FromCtx(ctx).Warnw("replicatedAddEvent: no backoff left", "error", err, "attempts", backoff.NumAttempts, "originalDeadline", originalDeadline.String(), "deadline", contextDeadlineLeft(ctx).String())
				return err
			}
			logging.FromCtx(ctx).Warnw("replicatedAddEvent: retrying after backoff", "attempt", backoff.NumAttempts, "deadline", contextDeadlineLeft(ctx).String(), "originalDeadline", originalDeadline.String())
			continue
		}
		return err
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
	sender.Timeout = 2500 * time.Millisecond // TODO: REPLICATION: TEST: setting so test can have more aggressive timeout

	sender.GoLocal(ctx, func(ctx context.Context) error {
		return stream.AddEvent(ctx, event)
	})

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
	}

	return ephemeralMb, nil
}

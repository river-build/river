package events

import (
	"context"
	"slices"
	"time"

	"connectrpc.com/connect"

	"github.com/river-build/river/core/contracts/river"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/logging"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/storage"
)

func (s *streamCacheImpl) onStreamCreated(
	ctx context.Context,
	event *river.StreamCreated,
	blockNum crypto.BlockNumber,
) {
	if !slices.Contains(event.Stream.Nodes, s.params.Wallet.Address) {
		return
	}

	if event.Stream.Flags&uint64(registries.StreamFlagSealed) == 0 {
		// Stream is not sealed, no need to process it yet.
		return
	}

	stream := &streamImpl{
		params:              s.params,
		streamId:            event.GetStreamId(),
		lastAppliedBlockNum: blockNum,
		lastAccessedTime:    time.Now(),
		local:               &localStreamState{},
	}
	stream.nodesLocked.Reset(event.Stream.Nodes, s.params.Wallet.Address)

	go func() {
		if err := s.normalizeEphemeralStream(ctx, stream, event); err != nil {
			logging.FromCtx(ctx).Errorw("Failed to normalize ephemeral stream", "err", err, "streamId", event.GetStreamId())
		}
	}()
}

func (s *streamCacheImpl) normalizeEphemeralStream(
	ctx context.Context,
	stream *streamImpl,
	event *river.StreamCreated,
) error {
	missingMbs := make([]int64, 0, event.Stream.LastMiniblockNum+1)

	// Check if the given stream is already sealed, if so, ignore the event.
	ephemeral, err := s.params.Storage.IsStreamEphemeral(ctx, event.GetStreamId())
	if err != nil {
		if !IsRiverErrorCode(err, Err_NOT_FOUND) {
			return err
		}

		// Stream does not exist in the storage - the entire stream is missing.
		for i := uint64(0); i <= event.Stream.LastMiniblockNum; i++ {
			missingMbs = append(missingMbs, int64(i))
		}
	} else if !ephemeral {
		// Stream exists in the storage and sealed already.
		return nil
	} else {
		// Stream exists in the storage, but not sealed yet, i.e. ephemeral.

		// Get existing miniblock numbers.
		existingMbs, err := s.params.Storage.ReadEphemeralMiniblockNums(ctx, event.GetStreamId())
		if err != nil {
			return err
		}

		existingMbsMap := make(map[int64]struct{}, len(existingMbs))
		for _, num := range existingMbs {
			existingMbsMap[int64(num)] = struct{}{}
		}

		for num := int64(0); num <= int64(event.Stream.LastMiniblockNum)+1; num++ {
			if _, exists := existingMbsMap[num]; !exists {
				missingMbs = append(missingMbs, num)
			}
		}
	}

	// Fill missing miniblocks
	if len(missingMbs) > 0 {
		remotes, _ := stream.GetRemotesAndIsLocal()
		currentStickyPeer := stream.GetStickyPeer()
		for range len(remotes) {
			stub, err := s.params.NodeRegistry.GetNodeToNodeClientForAddress(currentStickyPeer)
			if err != nil {
				logging.FromCtx(ctx).Errorw("Failed to get node to node client", "err", err, "streamId", event.GetStreamId())
				currentStickyPeer = stream.AdvanceStickyPeer(currentStickyPeer)
				continue
			}

			resp, err := stub.GetMiniblocksByIds(ctx, connect.NewRequest[GetMiniblocksByIdsRequest](
				&GetMiniblocksByIdsRequest{
					StreamId:     event.StreamId[:],
					MiniblockIds: missingMbs,
				},
			))
			if err != nil {
				logging.FromCtx(ctx).Errorw("Failed to get miniblocks from sticky peer", "err", err, "streamId", event.GetStreamId())
				currentStickyPeer = stream.AdvanceStickyPeer(currentStickyPeer)
				continue
			}

			// Start processing miniblocks from the stream.
			// If the processing breaks in the middle, the rest of missing miniblocks will be fetched from the next sticky peer.
			for resp.Receive() {
				mbInfo, err := NewMiniblockInfoFromProto(resp.Msg().GetMiniblock(), NewParsedMiniblockInfoOpts())
				if err != nil {
					return err
				}

				mbBytes, err := mbInfo.ToBytes()
				if err != nil {
					return err
				}

				if err = s.params.Storage.WriteEphemeralMiniblock(ctx, event.GetStreamId(), &storage.WriteMiniblockData{
					Number:   mbInfo.Ref.Num,
					Hash:     mbInfo.Ref.Hash,
					Snapshot: mbInfo.IsSnapshot(),
					Data:     mbBytes,
				}); err != nil {
					return err
				}

				// Delete the processed miniblock from the missingMbs slice
				i := 0
				mbNum := resp.Msg().GetNum()
				for _, v := range missingMbs {
					if v != mbNum {
						missingMbs[i] = v
						i++
					}
				}
				missingMbs = missingMbs[:i]

				// No missing miniblocks left, just return.
				if len(missingMbs) == 0 {
					return resp.Close()
				}
			}

			// There are still missing miniblocks and something went wrong with the receiving miniblocks from the
			// current sticky peer. Try the next sticky peer for the rest of missing miniblocks.
			if err = resp.Err(); err != nil {
				logging.FromCtx(ctx).Errorw("Failed to get miniblocks from sticky peer", "err", err, "streamId", event.GetStreamId())
				currentStickyPeer = stream.AdvanceStickyPeer(currentStickyPeer)
				continue
			}
		}
	}

	if len(missingMbs) > 0 {
		return RiverError(Err_INTERNAL, "Failed to reconcile ephemeral stream", "missingMbs", missingMbs).
			Func("reconcileEphemeralStream")
	}

	// Stream is ready to be normalized
	_, err = s.params.Storage.NormalizeEphemeralStream(ctx, event.GetStreamId())
	return err
}

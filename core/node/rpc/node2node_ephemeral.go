package rpc

import (
	"context"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"google.golang.org/protobuf/proto"

	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
	"github.com/river-build/river/core/node/utils"
)

func (s *Service) AllocateEphemeralStream(
	ctx context.Context,
	req *connect.Request[AllocateEphemeralStreamRequest],
) (*connect.Response[AllocateEphemeralStreamResponse], error) {
	ctx, log := utils.CtxAndLogForRequest(ctx, req)
	ctx, cancel := utils.UncancelContext(ctx, 10*time.Second, 20*time.Second)
	defer cancel()
	log.Debug("AllocateEphemeralStream ENTER")
	r, e := s.allocateEphemeralStream(ctx, req.Msg)
	if e != nil {
		return nil, AsRiverError(
			e,
		).Func("AllocateEphemeralStream").
			Tag("streamId", req.Msg.StreamId).
			LogWarn(log).
			AsConnectError()
	}
	log.Debug("AllocateEphemeralStream LEAVE", "response", r)
	return connect.NewResponse(r), nil
}

func (s *Service) allocateEphemeralStream(ctx context.Context, req *AllocateEphemeralStreamRequest) (*AllocateEphemeralStreamResponse, error) {
	streamId, err := StreamIdFromBytes(req.StreamId)
	if err != nil {
		return nil, err
	}

	mbBytes, err := proto.Marshal(req.Miniblock)
	if err != nil {
		return nil, err
	}

	err = s.storage.CreateEphemeralStreamStorage(ctx, streamId, mbBytes)
	if err != nil {
		return nil, err
	}

	return &AllocateEphemeralStreamResponse{}, nil
}

func (s *Service) SaveEphemeralMiniblock(
	ctx context.Context,
	req *connect.Request[SaveEphemeralMiniblockRequest],
) (*connect.Response[SaveEphemeralMiniblockResponse], error) {
	ctx, log := utils.CtxAndLogForRequest(ctx, req)
	ctx, cancel := utils.UncancelContext(ctx, 5*time.Second, 10*time.Second)
	defer cancel()
	log.Debug("SaveEphemeralMiniblock ENTER")
	streamId, err := StreamIdFromBytes(req.Msg.GetStreamId())
	if err != nil {
		return nil, err
	}
	if err = s.saveEphemeralMiniblock(ctx, streamId, req.Msg.GetMiniblock()); err != nil {
		return nil, AsRiverError(err).Func("SaveEphemeralMiniblock").
			Tag("streamId", req.Msg.StreamId).
			LogWarn(log).
			AsConnectError()
	}
	log.Debug("SaveEphemeralMiniblock LEAVE")
	return connect.NewResponse(&SaveEphemeralMiniblockResponse{}), nil
}

func (s *Service) saveEphemeralMiniblock(ctx context.Context, streamId StreamId, mb *Miniblock) error {
	mbInfo, err := NewMiniblockInfoFromProto(mb, NewParsedMiniblockInfoOpts())
	if err != nil {
		return err
	}

	mbBytes, err := mbInfo.ToBytes()
	if err != nil {
		return err
	}

	// Save the ephemeral miniblock.
	// Here we are sure that the record of the stream exists in the storage.
	err = s.storage.WriteEphemeralMiniblock(ctx, streamId, &storage.WriteMiniblockData{
		Number:   mbInfo.Ref.Num,
		Hash:     mbInfo.Ref.Hash,
		Snapshot: mbInfo.IsSnapshot(),
		Data:     mbBytes,
	})
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) SealEphemeralStream(
	ctx context.Context,
	req *connect.Request[SealEphemeralStreamRequest],
) (*connect.Response[SealEphemeralStreamResponse], error) {
	ctx, log := utils.CtxAndLogForRequest(ctx, req)
	ctx, cancel := utils.UncancelContext(ctx, 10*time.Second, 20*time.Second)
	defer cancel()
	log.Debug("SealEphemeralStream ENTER")

	if err := s.sealEphemeralStream(ctx, req.Msg); err != nil {
		return nil, AsRiverError(err).Func("SealEphemeralStream").
			Tag("streamId", req.Msg.StreamId).
			LogWarn(log).
			AsConnectError()
	}
	log.Debug("SealEphemeralStream LEAVE")
	return connect.NewResponse(&SealEphemeralStreamResponse{}), nil
}

func (s *Service) sealEphemeralStream(
	ctx context.Context,
	req *SealEphemeralStreamRequest,
) error {
	streamId, err := StreamIdFromBytes(req.GetStreamId())
	if err != nil {
		return AsRiverError(err).Func("sealEphemeralStream")
	}

	if _, err = s.storage.NormalizeEphemeralStream(ctx, streamId); err == nil {
		return nil
	}

	if !IsRiverErrorCode(err, Err_NOT_FOUND) {
		return err
	}

	// Something is missing in the stream, so it can't be normalized.
	// Run the process to fetch missing data from replicas.

	if err = s.reconcileMissingMiniblocks(ctx, streamId, req.NodeAddresses()); err != nil {
		return err
	}

	_, err = s.storage.NormalizeEphemeralStream(ctx, streamId)
	return err
}

// reconcileMissingMiniblocks reconciles missing miniblocks of the given ephemeral stream.
func (s *Service) reconcileMissingMiniblocks(ctx context.Context, streamId StreamId, replicas []common.Address) error {
	existingMbs, err := s.storage.ReadEphemeralMiniblockNums(ctx, streamId)
	if err != nil {
		return err
	}

	nodes := NewStreamNodesWithLock(replicas, s.wallet.Address)
	remotes, _ := nodes.GetRemotesAndIsLocal()

	// Get the last miniblock number.
	// If there is no genesis miniblock stored locally, get one from replicas and store.
	var genesisMb Miniblock
	if len(existingMbs) > 0 && existingMbs[0] == 0 {
		// Genesis miniblock is stored locally.
		if err = s.storage.ReadMiniblocksByIds(ctx, streamId, []int64{0}, func(blockdata []byte, seqNum int64) error {
			if err = proto.Unmarshal(blockdata, &genesisMb); err != nil {
				return WrapRiverError(Err_BAD_BLOCK, err).Message("Unable to unmarshal miniblock")
			}
			return nil
		}); err != nil {
			return err
		}
	} else {
		// Genesis miniblock is missing.
		// Fetch the genesis miniblock from the first sticky peer.
		currentStickyPeer := nodes.GetStickyPeer()
		for range len(remotes) {
			stub, err := s.nodeRegistry.GetNodeToNodeClientForAddress(currentStickyPeer)
			if err != nil {
				// TODO: Log error
				currentStickyPeer = nodes.AdvanceStickyPeer(currentStickyPeer)
				continue
			}

			resp, err := stub.GetMiniblockById(ctx, connect.NewRequest[GetMiniblockByIdRequest](
				&GetMiniblockByIdRequest{
					StreamId:    streamId[:],
					MiniblockId: 0,
				},
			))
			if err != nil {
				// TODO: Log error
				currentStickyPeer = nodes.AdvanceStickyPeer(currentStickyPeer)
				continue
			}

			// Store genesis miniblock locally
			if err = s.saveEphemeralMiniblock(ctx, streamId, resp.Msg.GetMiniblock()); err != nil {
				return err
			}

			break
		}
	}

	// Just to make sure the genesis miniblock exists at least in one replica.
	if genesisMb.GetHeader() == nil || len(genesisMb.GetEvents()) == 0 {
		return RiverError(Err_UNAVAILABLE, "Genesis miniblock is missing").
			Func("Service.detectMissingMiniblocks")
	}

	var mediaEvent StreamEvent
	if err = proto.Unmarshal(genesisMb.GetEvents()[0].Event, &mediaEvent); err != nil {
		return RiverError(Err_INTERNAL, "Failed to decode stream event from genesis miniblock").
			Func("Service.detectMissingMiniblocks")
	}

	existingMbsMap := make(map[int64]struct{}, len(existingMbs))
	existingMbsMap[0] = struct{}{}
	for _, num := range existingMbs {
		existingMbsMap[int64(num)] = struct{}{}
	}

	// The miniblock with 0 number must be the genesis miniblock.
	// The genesis miniblock must have the media inception event.
	inception := mediaEvent.GetMediaPayload().GetInception()

	var missingMbs []int64
	for num := int64(1); num <= int64(inception.GetChunkCount()); num++ {
		if _, exists := existingMbsMap[num]; !exists {
			missingMbs = append(missingMbs, num)
		}
	}

	// If there are no missing miniblocks, return.
	if len(missingMbs) == 0 {
		return nil
	}

	// Fetch missing miniblock from the sticky peer.
	currentStickyPeer := nodes.GetStickyPeer()
	for range len(remotes) {
		stub, err := s.nodeRegistry.GetNodeToNodeClientForAddress(currentStickyPeer)
		if err != nil {
			// TODO: Log error
			currentStickyPeer = nodes.AdvanceStickyPeer(currentStickyPeer)
			continue
		}

		resp, err := stub.GetMiniblocksByIds(ctx, connect.NewRequest[GetMiniblocksByIdsRequest](
			&GetMiniblocksByIdsRequest{
				StreamId:     streamId[:],
				MiniblockIds: missingMbs,
			},
		))
		if err != nil {
			// TODO: Log error
			currentStickyPeer = nodes.AdvanceStickyPeer(currentStickyPeer)
			continue
		}

		// Start processing miniblocks from the stream.
		// If the processing breaks in the middle, the rest of missing miniblocks will be fetched from the next sticky peer.
		for resp.Receive() {
			if err = s.saveEphemeralMiniblock(ctx, streamId, resp.Msg().GetMiniblock()); err != nil {
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
				_ = resp.Close()
				return nil
			}
		}

		// There are still missing miniblocks and something went wrong with the receiving miniblocks from the
		// current sticky peer. Try the next sticky peer for the rest of missing miniblocks.
		if err = resp.Err(); err != nil {
			// TODO: Log error
			currentStickyPeer = nodes.AdvanceStickyPeer(currentStickyPeer)
			continue
		}
	}

	return nil
}

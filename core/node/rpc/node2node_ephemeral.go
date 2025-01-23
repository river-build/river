package rpc

import (
	"context"
	"time"

	"connectrpc.com/connect"
	"google.golang.org/protobuf/proto"

	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/events"
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
	r, e := s.saveEphemeralMiniblock(ctx, req.Msg)
	if e != nil {
		return nil, AsRiverError(
			e,
		).Func("SaveEphemeralMiniblock").
			Tag("streamId", req.Msg.StreamId).
			LogWarn(log).
			AsConnectError()
	}
	log.Debug("SaveEphemeralMiniblock LEAVE", "response", r)
	return connect.NewResponse(r), nil
}

func (s *Service) saveEphemeralMiniblock(
	ctx context.Context,
	req *SaveEphemeralMiniblockRequest,
) (*SaveEphemeralMiniblockResponse, error) {
	streamId, err := StreamIdFromBytes(req.StreamId)
	if err != nil {
		return nil, err
	}

	mbInfo, err := NewMiniblockInfoFromProto(req.Miniblock, NewParsedMiniblockInfoOpts())
	if err != nil {
		return nil, err
	}

	mbBytes, err := mbInfo.ToBytes()
	if err != nil {
		return nil, err
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
		return nil, err
	}

	// Normalize stream if this is the last miniblock of the ephemeral stream
	if req.GetLast() {
		if _, err = s.storage.NormalizeEphemeralStream(ctx, streamId); err != nil {
			if IsRiverErrorCode(err, Err_NOT_FOUND) {
				// Something is missing in the stream, so we can't normalize it.
				// Run the process to fetch missing data from replicas.

				// Get existing miniblock numbers of the given ephemeral stream
				existingMbs, err := s.storage.ReadEphemeralMiniblockNums(ctx, streamId)
				if err != nil {
					return nil, err
				}

				existingMbsMap := make(map[int64]struct{}, len(existingMbs))
				for _, num := range existingMbs {
					existingMbsMap[int64(num)] = struct{}{}
				}

				// Detect missing miniblocks of the given stream.
				// Do not fetch the last miniblock, as it is already saved.
				missingMbs := make([]int64, 0, mbInfo.Ref.Num)
				for num := int64(0); num < mbInfo.Ref.Num; num++ {
					if _, ok := existingMbsMap[num]; ok {
						continue
					}
					missingMbs = append(missingMbs, num)
				}

				// TODO: Fetch missing miniblocks from replicas.
			}

			return nil, err
		}
	}

	return &SaveEphemeralMiniblockResponse{}, nil
}

func (s *Service) SealEphemeralStream(
	ctx context.Context,
	req *connect.Request[SealEphemeralStreamRequest],
) (*connect.Response[SealEphemeralStreamResponse], error) {
	ctx, log := utils.CtxAndLogForRequest(ctx, req)
	ctx, cancel := utils.UncancelContext(ctx, 10*time.Second, 20*time.Second)
	defer cancel()
	log.Debug("SealEphemeralStream ENTER")
	r, e := s.sealEphemeralStream(ctx, req.Msg)
	if e != nil {
		return nil, AsRiverError(
			e,
		).Func("SealEphemeralStream").
			Tag("streamId", req.Msg.StreamId).
			LogWarn(log).
			AsConnectError()
	}
	log.Debug("SealEphemeralStream LEAVE", "response", r)
	return connect.NewResponse(r), nil
}

func (s *Service) sealEphemeralStream(
	ctx context.Context,
	req *SealEphemeralStreamRequest,
) (*SealEphemeralStreamResponse, error) {
	streamId, err := StreamIdFromBytes(req.GetStreamId())
	if err != nil {
		return nil, AsRiverError(err).Func("sealEphemeralStream")
	}

	// Normalize stream locally
	if _, err = s.storage.NormalizeEphemeralStream(ctx, streamId); err != nil {
		if IsRiverErrorCode(err, Err_NOT_FOUND) {
			// Something is missing in the stream, so we can't normalize it.
			// Run the process to fetch missing data from replicas.
			// TODO: Implement
		}

		return nil, err
	}

	return &SealEphemeralStreamResponse{}, nil
}

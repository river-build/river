package rpc

import (
	"context"
	"crypto/sha256"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/common"

	"connectrpc.com/connect"
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
			if !IsRiverErrorCode(err, Err_NOT_FOUND) {
				return nil, err
			}

			// Miniblocks are missing in the stream, so we can't normalize it.
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

			nodes := NewStreamNodesWithLock(req.NodeAddresses(), s.wallet.Address)
			remotes, _ := nodes.GetRemotesAndIsLocal()
			sender := NewQuorumPool("method", "Service.saveEphemeralMiniblock", "streamId", streamId)
			remoteQuorumNum := RemoteQuorumNum(len(remotes), true)

			// Create channel for each missing miniblock
			filledMbs := make(map[int64]int, len(missingMbs))
			filledMbsLock := &sync.Mutex{}
			mbChans := make(map[int64]chan []byte, len(missingMbs))
			mbDoneChans := make(map[int64]chan struct{}, len(missingMbs))
			for _, num := range missingMbs {
				mbChan := make(chan []byte, len(remotes))
				mbChans[num] = mbChan
				mbDoneChan := make(chan struct{}, 1)
				mbDoneChans[num] = mbDoneChan
				go func(num int64) {
					// remoteQuorumNum of the same mbs must be collected to store the current mbs into DB.
					// In theory, a replica node could return "bad" mb so we need to collect remoteQuorumNum of the same mbs.
					collectedMiniblocks := make(map[[32]byte][]byte)
					collectedMiniblocksCounter := make(map[[32]byte]int)
					for i := 0; i < len(remotes); i++ {
						select {
						case <-ctx.Done():
							return
						case mb := <-mbChan:
							mbHash := sha256.Sum256(mb)
							collectedMiniblocks[mbHash] = mb
							collectedMiniblocksCounter[mbHash]++

							// Store miniblock if the quorum is reached.
							if collectedMiniblocksCounter[mbHash] == remoteQuorumNum {
								if err = s.storage.WriteEphemeralMiniblock(ctx, streamId, &storage.WriteMiniblockData{
									Number: num,
									Hash:   mbHash,
									Data:   mb,
								}); err != nil {
									// TODO: Handle error
									return
								}
								filledMbsLock.Lock()
								filledMbs[num]++
								filledMbsLock.Unlock()
								mbDoneChan <- struct{}{}
								close(mbChan)
								return
							}
						}
					}
				}(num)
			}

			// Fetch missing miniblocks from replicas.
			sender.GoRemotes(ctx, remotes, func(ctx context.Context, node common.Address) error {
				stub, err := s.nodeRegistry.GetNodeToNodeClientForAddress(node)
				if err != nil {
					return err
				}

				resp, err := stub.GetMiniblocksByIds(ctx, connect.NewRequest[GetMiniblocksByIdsRequest](
					&GetMiniblocksByIdsRequest{
						StreamId:     streamId[:],
						MiniblockIds: missingMbs,
					},
				))
				if err != nil {
					return err
				}

				for resp.Receive() {
					missingMb := resp.Msg().GetMiniblockRaw()
					missingMbNum := resp.Msg().GetMiniblockNum()
					if _, ok := mbChans[missingMbNum]; ok {
						select {
						case <-mbDoneChans[missingMbNum]:
							return resp.Close()
						default:
							mbChans[missingMbNum] <- missingMb
						}
					}
				}

				return resp.Err()
			})

			if err := sender.Wait(); err != nil {
				return nil, err
			}

			// Normalize stream if all missing miniblocks are filled
			for _, count := range filledMbs {
				if count < remoteQuorumNum {
					return nil, RiverError(Err_UNAVAILABLE, "Cannot normalize stream due to missing miniblocks").
						Func("Service.saveEphemeralMiniblock")
				}
			}

			// Try to normalize the stream again assuming all missing miniblocks are filled.
			if _, err = s.storage.NormalizeEphemeralStream(ctx, streamId); err != nil {
				return nil, err
			}
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
		// TODO: Implement
		// if IsRiverErrorCode(err, Err_NOT_FOUND) {
		// Something is missing in the stream, so we can't normalize it.
		// Run the process to fetch missing data from replicas.
		// }

		return nil, err
	}

	return &SealEphemeralStreamResponse{}, nil
}

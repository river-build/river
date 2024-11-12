package rpc

import (
	"context"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"google.golang.org/protobuf/proto"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/rules"
	. "github.com/river-build/river/core/node/shared"

	"connectrpc.com/connect"
)

func (s *Service) createStreamImpl(
	ctx context.Context,
	req *connect.Request[CreateStreamRequest],
) (*connect.Response[CreateStreamResponse], error) {
	stream, err := s.createStream(ctx, req.Msg)
	if err != nil {
		return nil, AsRiverError(err).Func("createStreamImpl")
	}
	resMsg := &CreateStreamResponse{
		Stream: stream,
	}
	return connect.NewResponse(resMsg), nil
}

func (s *Service) createStream(ctx context.Context, req *CreateStreamRequest) (*StreamAndCookie, error) {
	log := dlog.FromCtx(ctx)

	streamId, err := StreamIdFromBytes(req.StreamId)
	if err != nil {
		return nil, RiverError(Err_BAD_STREAM_CREATION_PARAMS, "invalid stream id", "err", err)
	}

	if len(req.Events) == 0 {
		return nil, RiverError(Err_BAD_STREAM_CREATION_PARAMS, "no events")
	}

	parsedEvents, err := ParseEvents(req.Events)
	if err != nil {
		return nil, err
	}

	log.Debug("createStream", "parsedEvents", parsedEvents)

	csRules, err := rules.CanCreateStream(
		ctx,
		s.config,
		s.chainConfig,
		time.Now(),
		streamId,
		parsedEvents,
		req.Metadata,
	)
	if err != nil {
		return nil, err
	}

	// check that the creator satisfies the required memberships reqirements
	if csRules.RequiredMemberships != nil {
		// load the creator's user stream
		stream, err := s.loadStream(ctx, csRules.CreatorStreamId)
		var creatorStreamView StreamView
		if err == nil {
			creatorStreamView, err = stream.GetView(ctx)
		}
		if err != nil {
			return nil, RiverError(Err_PERMISSION_DENIED, "failed to load creator stream", "err", err)
		}
		for _, streamIdBytes := range csRules.RequiredMemberships {
			streamId, err := StreamIdFromBytes(streamIdBytes)
			if err != nil {
				return nil, RiverError(Err_BAD_STREAM_CREATION_PARAMS, "invalid stream id", "err", err)
			}
			if !creatorStreamView.(UserStreamView).IsMemberOf(streamId) {
				return nil, RiverError(Err_PERMISSION_DENIED, "not a member of", "requiredStreamId", streamId)
			}
		}
	}

	// check that all required users exist in the system
	for _, userAddress := range csRules.RequiredUserAddrs {
		addr, err := BytesToAddress(userAddress)
		if err != nil {
			return nil, RiverError(Err_PERMISSION_DENIED, "invalid user id", "requiredUser", userAddress)
		}
		userStreamId := UserStreamIdFromAddr(addr)
		_, err = s.streamRegistry.GetStreamInfo(ctx, userStreamId)
		if err != nil {
			return nil, RiverError(Err_PERMISSION_DENIED, "user does not exist", "requiredUser", userAddress)
		}
	}

	// check entitlements
	if csRules.ChainAuth != nil {
		isEntitled, err := s.chainAuth.IsEntitled(ctx, s.config, csRules.ChainAuth)
		if err != nil {
			return nil, err
		}
		if !isEntitled {
			return nil, RiverError(
				Err_PERMISSION_DENIED,
				"IsEntitled failed",
				"chainAuthArgs",
				csRules.ChainAuth.String(),
			).Func("createStream")
		}

	}

	// create the stream
	resp, err := s.createReplicatedStream(ctx, streamId, parsedEvents)
	if err != nil && AsRiverError(err).Code != Err_ALREADY_EXISTS {
		return nil, err
	}

	// add derived events
	if csRules.DerivedEvents != nil {
		for _, de := range csRules.DerivedEvents {
			err := s.AddEventPayload(ctx, de.StreamId, de.Payload)
			if err != nil {
				return nil, RiverError(Err_INTERNAL, "failed to add derived event", "err", err)
			}
		}
	}

	return resp, nil
}

func (s *Service) waitForLocalStream(
	ctx context.Context,
	streamId StreamId,
) (SyncStream, StreamView, *SyncCookie, error) {
	// TODO: better way to wait for stream to be initialized then polling
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	var st SyncStream
	var err error
	timeout := 10 * time.Millisecond
	for {
		err = ctx.Err()
		if err != nil {
			return nil, nil, nil, err
		}

		st, err = s.cache.GetStream(ctx, streamId)
		if err == nil {
			break
		}
		if !IsRiverErrorCode(err, Err_NOT_FOUND) {
			return nil, nil, nil, err
		}
		time.Sleep(timeout)
		timeout = min(timeout*2, 160*time.Millisecond)
	}

	sv, err := st.GetView(ctx)
	if err != nil {
		return nil, nil, nil, err
	}
	cookie := sv.SyncCookie(s.wallet.Address)
	return st, sv, cookie, nil
}

func (s *Service) createReplicatedStream(
	ctx context.Context,
	streamId StreamId,
	parsedEvents []*ParsedEvent,
) (*StreamAndCookie, error) {
	mb, err := MakeGenesisMiniblock(s.wallet, parsedEvents)
	if err != nil {
		return nil, err
	}

	mbBytes, err := proto.Marshal(mb)
	if err != nil {
		return nil, err
	}

	nodesList, err := s.streamRegistry.AllocateStream(ctx, streamId, common.BytesToHash(mb.Header.Hash), mbBytes)
	if err != nil {
		return nil, err
	}

	nodes := NewStreamNodes(nodesList, s.wallet.Address)
	sender := NewQuorumPool(nodes.NumRemotes())

	var localSyncCookie *SyncCookie
	if nodes.IsLocal() {
		sender.GoLocal(func() error {
			var err error
			_, _, localSyncCookie, err = s.waitForLocalStream(ctx, streamId)
			return err
		})
	}

	var remoteSyncCookie *SyncCookie
	var remoteSyncCookieOnce sync.Once
	if nodes.NumRemotes() > 0 {
		for _, n := range nodes.GetRemotes() {
			sender.GoRemote(
				n,
				func(node common.Address) error {
					stub, err := s.nodeRegistry.GetNodeToNodeClientForAddress(node)
					if err != nil {
						return err
					}
					r, err := stub.AllocateStream(
						ctx,
						connect.NewRequest[AllocateStreamRequest](
							&AllocateStreamRequest{
								StreamId:  streamId[:],
								Miniblock: mb,
							},
						),
					)
					if err != nil {
						return err
					}
					remoteSyncCookieOnce.Do(func() {
						remoteSyncCookie = r.Msg.SyncCookie
					})
					return nil
				},
			)
		}
	}

	err = sender.Wait()
	if err != nil {
		return nil, err
	}

	cookie := localSyncCookie
	if cookie == nil {
		cookie = remoteSyncCookie
	}

	return &StreamAndCookie{
		NextSyncCookie: cookie,
		Miniblocks:     []*Miniblock{mb},
	}, nil
}

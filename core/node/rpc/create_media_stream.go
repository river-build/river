package rpc

import (
	"context"
	"time"

	"google.golang.org/protobuf/proto"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/rules"
	. "github.com/river-build/river/core/node/shared"
)

func (s *Service) createMediaStreamImpl(
	ctx context.Context,
	req *connect.Request[CreateMediaStreamRequest],
) (*connect.Response[CreateMediaStreamResponse], error) {
	stream, err := s.createMediaStream(ctx, req.Msg)
	if err != nil {
		return nil, AsRiverError(err).Func("createMediaStreamImpl")
	}

	return connect.NewResponse(&CreateMediaStreamResponse{
		Stream: stream,
	}), nil
}

func (s *Service) createMediaStream(ctx context.Context, req *CreateMediaStreamRequest) (*StreamAndCreationCookie, error) {
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

	log.Debug("createMediaStream", "parsedEvents", parsedEvents)

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

	// check that streams exist for derived events that will be added later
	if csRules.DerivedEvents != nil {
		for _, event := range csRules.DerivedEvents {
			streamIdBytes := event.StreamId
			stream, err := s.cache.GetStreamNoWait(ctx, streamIdBytes)
			if err != nil || stream == nil {
				return nil, RiverError(Err_PERMISSION_DENIED, "stream does not exist", "streamId", streamIdBytes)
			}
		}
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
		_, err = s.cache.GetStreamNoWait(ctx, userStreamId)
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

	// create the media stream
	resp, err := s.createReplicatedMediaStream(ctx, streamId, parsedEvents)
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

func (s *Service) createReplicatedMediaStream(
	ctx context.Context,
	streamId StreamId,
	parsedEvents []*ParsedEvent,
) (*StreamAndCreationCookie, error) {
	mb, err := MakeGenesisMiniblock(s.wallet, parsedEvents)
	if err != nil {
		return nil, err
	}

	mbBytes, err := proto.Marshal(mb)
	if err != nil {
		return nil, err
	}

	nodesList, err := s.streamRegistry.ChooseStreamNodes(streamId)
	if err != nil {
		return nil, err
	}

	nodes := NewStreamNodesWithLock(nodesList, s.wallet.Address)
	remotes, isLocal := nodes.GetRemotesAndIsLocal()
	sender := NewQuorumPool("method", "createReplicatedMediaStream", "streamId", streamId)

	// If the current node was not allocated, removing the last remote node
	// TODO: Implement it in more elegant way
	if !isLocal && len(remotes) > 0 {
		remotes = remotes[:len(remotes)-1]
	}

	sender.GoLocal(ctx, func(ctx context.Context) error {
		// Save stream and genesis miniblock locally first
		// TODO: Mark miniblock as ephemeral
		return s.storage.CreateStreamStorage(ctx, streamId, mbBytes)
	})

	sender.GoRemotes(ctx, remotes, func(ctx context.Context, node common.Address) error {
		stub, err := s.nodeRegistry.GetNodeToNodeClientForAddress(node)
		if err != nil {
			return err
		}

		_, err = stub.SaveEphemeralMiniblock(
			ctx,
			connect.NewRequest[SaveEphemeralMiniblockRequest](
				&SaveEphemeralMiniblockRequest{
					StreamId:  streamId[:],
					Miniblock: mb,
				},
			),
		)

		return err
	})

	err = sender.Wait()
	if err != nil {
		return nil, err
	}

	nodesRaw := make([][]byte, len(remotes)+1)
	for i, node := range remotes {
		nodesRaw[i] = node.Bytes()
	}
	nodesRaw[len(remotes)] = s.wallet.Address.Bytes()

	return &StreamAndCreationCookie{
		NextCreationCookie: &CreationCookie{
			StreamId:          streamId[:],
			Nodes:             nodesRaw,
			MiniblockNum:      0, // genesis miniblock
			PrevMiniblockHash: nil,
		},
		Miniblocks: []*Miniblock{mb},
	}, nil
}

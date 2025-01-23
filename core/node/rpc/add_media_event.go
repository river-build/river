package rpc

import (
	"bytes"
	"context"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"google.golang.org/protobuf/proto"

	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/logging"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
)

func (s *Service) localAddMediaEvent(
	ctx context.Context,
	req *connect.Request[AddMediaEventRequest],
) (*connect.Response[AddMediaEventResponse], error) {
	log := logging.FromCtx(ctx)
	creationCookie := req.Msg.GetCreationCookie()

	streamId, err := StreamIdFromBytes(creationCookie.StreamId)
	if err != nil {
		return nil, AsRiverError(err).Func("localAddMediaEvent")
	}

	parsedEvent, err := ParseEvent(req.Msg.Event)
	if err != nil {
		return nil, AsRiverError(err).Func("localAddMediaEvent")
	}

	genesisEvent, err := s.getGenesisMediaEvent(ctx, streamId)
	if err != nil {
		return nil, AsRiverError(err).Func("localAddMediaEvent")
	}

	genesisInception := genesisEvent.GetMediaPayload().GetInception()
	chunk := parsedEvent.Event.GetMediaPayload().GetChunk()

	// Make sure only stream creator can add a media chunk
	if !bytes.Equal(parsedEvent.Event.CreatorAddress, genesisEvent.CreatorAddress) {
		return nil, RiverError(
			Err_PERMISSION_DENIED,
			"media event creator is not a creator of the media stream",
			"creatorAddress",
			common.BytesToAddress(genesisEvent.CreatorAddress),
			"streamId",
			streamId,
		)
	}

	// Make sure the given chunk index is within the bounds of the genesis inception
	if chunk.GetChunkIndex() < 0 || chunk.GetChunkIndex() > genesisInception.GetChunkCount() {
		return nil, RiverError(Err_INVALID_ARGUMENT, "chunk index out of bounds")
	}

	// Make sure the given chunk size does not exceed the maximum chunk size
	if uint64(len(chunk.GetData())) > s.chainConfig.Get().MediaMaxChunkSize {
		return nil, RiverError(
			Err_INVALID_ARGUMENT,
			"chunk size must be less than or equal to",
			"s.chainConfig.Get().MediaMaxChunkSize",
			s.chainConfig.Get().MediaMaxChunkSize)
	}

	log.Debug("localAddMediaEvent", "parsedEvent", parsedEvent, "creationCookie", creationCookie)

	stream := &replicatedStream{
		streamId: streamId,
		service:  s,
	}

	mb, err := stream.AddMediaEvent(ctx, parsedEvent, creationCookie, req.Msg.GetLast())
	if err != nil {
		return nil, AsRiverError(err).Func("localAddMediaEvent")
	}

	return connect.NewResponse(&AddMediaEventResponse{
		CreationCookie: &CreationCookie{
			StreamId:          streamId[:],
			Nodes:             creationCookie.Nodes,
			MiniblockNum:      creationCookie.MiniblockNum + 1,
			PrevMiniblockHash: mb.Header.Hash,
		},
	}), nil
}

func (s *Service) getGenesisMediaEvent(ctx context.Context, streamId StreamId) (*StreamEvent, error) {
	mbs, err := s.storage.ReadMiniblocks(ctx, streamId, 0, 1)
	if err != nil {
		return nil, err
	}

	if len(mbs) == 0 {
		return nil, RiverError(Err_NOT_FOUND, "Genesis miniblock not found")
	}

	var mb Miniblock
	if err = proto.Unmarshal(mbs[0], &mb); err != nil {
		return nil, err
	}

	var mediaEvent StreamEvent
	if err = proto.Unmarshal(mb.GetEvents()[0].Event, &mediaEvent); err != nil {
		return nil, RiverError(Err_INTERNAL, "Failed to decode stream event from genesis miniblock")
	}

	if mediaEvent.GetMediaPayload().GetInception() == nil {
		return nil, RiverError(Err_INTERNAL, "Genesis stream event does not have a media inception")
	}

	return &mediaEvent, nil
}

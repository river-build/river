package rpc

import (
	"context"

	"connectrpc.com/connect"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
)

func (s *Service) localAddMediaEvent(
	ctx context.Context,
	req *connect.Request[AddMediaEventRequest],
) (*connect.Response[AddMediaEventResponse], error) {
	log := dlog.FromCtx(ctx)
	creationCookie := req.Msg.GetCreationCookie()

	streamId, err := StreamIdFromBytes(creationCookie.StreamId)
	if err != nil {
		return nil, AsRiverError(err).Func("localAddMediaEvent")
	}

	parsedEvent, err := ParseEvent(req.Msg.Event)
	if err != nil {
		return nil, AsRiverError(err).Func("localAddMediaEvent")
	}

	log.Debug("localAddMediaEvent", "parsedEvent", parsedEvent, "creationCookie", creationCookie)

	mb, err := s.addParsedMediaEvent(ctx, streamId, parsedEvent, creationCookie)
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

func (s *Service) addParsedMediaEvent(
	ctx context.Context,
	streamId StreamId,
	parsedEvent *ParsedEvent,
	creationCookie *CreationCookie,
) (*Miniblock, error) {
	stream := &replicatedStream{
		streamId: streamId.String(),
		service:  s,
	}

	return stream.AddMediaEvent(ctx, parsedEvent, creationCookie)
}

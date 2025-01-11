package rpc

import (
	"context"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"

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

	streamId, err := StreamIdFromBytes(req.Msg.StreamId)
	if err != nil {
		return nil, AsRiverError(err).Func("localAddMediaEvent")
	}

	parsedEvent, err := ParseEvent(req.Msg.Event)
	if err != nil {
		return nil, AsRiverError(err).Func("localAddMediaEvent")
	}

	creationCookie := req.Msg.GetCreationCookie()

	log.Debug("localAddMediaEvent", "parsedEvent", parsedEvent, "creationCookie", creationCookie)

	mb, err := s.addParsedMediaEvent(ctx, streamId, parsedEvent, creationCookie)
	if err != nil {
		if req.Msg.Optional {
			// aellis 5/2024 - we only want to wrap errors from canAddEvent,
			// currently this is catching all errors, which is not ideal
			riverError := AsRiverError(err).Func("localAddMediaEvent")
			return connect.NewResponse(&AddMediaEventResponse{
				Error: &AddMediaEventResponse_Error{
					Code:  riverError.Code,
					Msg:   riverError.Error(),
					Funcs: riverError.Funcs,
				},
			}), nil
		}

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

func (s *Service) AddMediaEventPayload(ctx context.Context, streamId StreamId, payload IsStreamEvent_Payload) error {
	hashRequest := &GetLastMiniblockHashRequest{
		StreamId: streamId[:],
	}
	hashResponse, err := s.GetLastMiniblockHash(ctx, connect.NewRequest(hashRequest))
	if err != nil {
		return err
	}
	envelope, err := MakeEnvelopeWithPayload(s.wallet, payload, &MiniblockRef{
		Hash: common.BytesToHash(hashResponse.Msg.Hash),
		Num:  hashResponse.Msg.MiniblockNum,
	})
	if err != nil {
		return err
	}

	req := &AddMediaEventRequest{
		StreamId: streamId[:],
		Event:    envelope,
	}

	_, err = s.AddMediaEvent(ctx, connect.NewRequest(req))
	if err != nil {
		return err
	}
	return nil
}

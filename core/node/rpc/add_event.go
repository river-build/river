package rpc

import (
	"context"
	"time"

	"connectrpc.com/connect"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	. "github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/infra"
	. "github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/rules"
	. "github.com/river-build/river/core/node/shared"
)

var addEventRequests = infra.NewSuccessMetrics("add_event_requests", serviceRequests)

func (s *Service) localAddEvent(
	ctx context.Context,
	req *connect.Request[AddEventRequest],
	nodes StreamNodes,
) (*connect.Response[AddEventResponse], error) {
	log := dlog.FromCtx(ctx)

	streamId, err := StreamIdFromBytes(req.Msg.StreamId)
	if err != nil {
		addEventRequests.FailInc()
		return nil, AsRiverError(err).Func("localAddEvent")
	}

	parsedEvent, err := ParseEvent(req.Msg.Event)
	if err != nil {
		addEventRequests.FailInc()
		return nil, AsRiverError(err).Func("localAddEvent")
	}

	log.Debug("localAddEvent", "parsedEvent", parsedEvent)

	err = s.addParsedEvent(ctx, streamId, parsedEvent, nodes)
	if err != nil && req.Msg.Optional {
		// aellis 5/2024 - we only want to wrap errors from canAddEvent,
		// currently this is catching all errors, which is not ideal
		addEventRequests.PassInc()
		riverError := AsRiverError(err).Func("localAddEvent")
		return connect.NewResponse(&AddEventResponse{
			Error: &AddEventResponse_Error{
				Code:  riverError.Code,
				Msg:   riverError.Msg,
				Funcs: riverError.Funcs,
			},
		}), nil
	} else if err != nil {
		addEventRequests.FailInc()
		return nil, AsRiverError(err).Func("localAddEvent")
	} else {
		addEventRequests.PassInc()
		return connect.NewResponse(&AddEventResponse{}), nil
	}
}

func (s *Service) addParsedEvent(
	ctx context.Context,
	streamId StreamId,
	parsedEvent *ParsedEvent,
	nodes StreamNodes,
) error {
	localStream, streamView, err := s.cache.GetStream(ctx, streamId)
	if err != nil {
		return err
	}

	canAddEvent, chainAuthArgs, requiredParentEvent, err := rules.CanAddEvent(
		ctx,
		&s.config.Stream,
		s.nodeRegistry.GetValidNodeAddresses(),
		time.Now(),
		parsedEvent,
		streamView,
	)

	if !canAddEvent || err != nil {
		return err
	}

	if chainAuthArgs != nil {
		err := s.chainAuth.IsEntitled(ctx, s.config, chainAuthArgs)
		if err != nil {
			return err
		}
	}

	if requiredParentEvent != nil {
		err := s.addEventPayload(ctx, requiredParentEvent.StreamId, requiredParentEvent.Payload)
		if err != nil {
			return err
		}
	}

	stream := &replicatedStream{
		streamId:    streamId.String(),
		localStream: localStream,
		nodes:       nodes,
		service:     s,
	}

	err = stream.AddEvent(ctx, parsedEvent)
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) addEventPayload(ctx context.Context, streamId StreamId, payload IsStreamEvent_Payload) error {
	hashRequest := &GetLastMiniblockHashRequest{
		StreamId: streamId[:],
	}
	hashResponse, err := s.GetLastMiniblockHash(ctx, connect.NewRequest(hashRequest))
	if err != nil {
		return err
	}
	envelope, err := MakeEnvelopeWithPayload(s.wallet, payload, hashResponse.Msg.Hash)
	if err != nil {
		return err
	}

	req := &AddEventRequest{
		StreamId: streamId[:],
		Event:    envelope,
	}

	_, err = s.AddEvent(ctx, connect.NewRequest(req))
	if err != nil {
		return err
	}
	return nil
}

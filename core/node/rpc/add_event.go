package rpc

import (
	"context"
	"time"

	"connectrpc.com/connect"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/rules"
	. "github.com/river-build/river/core/node/shared"
)

func (s *Service) localAddEvent(
	ctx context.Context,
	req *connect.Request[AddEventRequest],
	nodes StreamNodes,
) (*connect.Response[AddEventResponse], error) {
	log := dlog.FromCtx(ctx)

	streamId, err := StreamIdFromBytes(req.Msg.StreamId)
	if err != nil {
		return nil, AsRiverError(err).Func("localAddEvent")
	}

	parsedEvent, err := ParseEvent(req.Msg.Event)
	if err != nil {
		return nil, AsRiverError(err).Func("localAddEvent")
	}

	log.Debug("localAddEvent", "parsedEvent", parsedEvent)

	err = s.addParsedEvent(ctx, streamId, parsedEvent, nodes)
	if err != nil && req.Msg.Optional {
		// aellis 5/2024 - we only want to wrap errors from canAddEvent,
		// currently this is catching all errors, which is not ideal
		riverError := AsRiverError(err).Func("localAddEvent")
		return connect.NewResponse(&AddEventResponse{
			Error: &AddEventResponse_Error{
				Code:  riverError.Code,
				Msg:   riverError.Error(),
				Funcs: riverError.Funcs,
			},
		}), nil
	} else if err != nil {
		return nil, AsRiverError(err).Func("localAddEvent")
	} else {
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
		s.chainConfig,
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
			log := dlog.FromCtx(ctx).With("function", "addParsedEvent")
			log.Info(
				"entitlement check failed, potential entitlement loss?",
				"error",
				err,
				"chainAuthArgs",
				chainAuthArgs,
			)
			// If the user entitlement failed, we may need to proactively propogate an event as a result
			// of detecting an entitlement loss.
			propogatedEntitlementLossEvent, err := rules.ProcessEntitlementLoss(ctx, parsedEvent, streamView)
			log.Info(
				"processed potential entitlement loss",
				"propogatedEntitlementLossEvent",
				propogatedEntitlementLossEvent,
				"error",
				err,
				"chainAuthArgs",
				chainAuthArgs,
			)
			if err != nil {
				log.Error("error processing potential entitlement loss", "error", err)
				return err
			}
			if propogatedEntitlementLossEvent != nil {
				log.Info(
					"propogating entitlement loss event",
					"event",
					propogatedEntitlementLossEvent,
					"chainAuthArgs",
					chainAuthArgs,
				)
				err := s.addEventPayload(
					ctx,
					propogatedEntitlementLossEvent.StreamId,
					propogatedEntitlementLossEvent.Payload,
				)
				if err != nil {
					log.Error("error propogating entitlement loss event", "error", err)
					return err
				} else {
					log.Info("entitlement loss event propogated", "event", propogatedEntitlementLossEvent, "chainAuthArgs", chainAuthArgs)
				}
			}
			log.Info("finished propogating any potential entitlement loss", "chainAuthArgs", chainAuthArgs)
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

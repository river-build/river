package rpc

import (
	"context"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/rules"
	. "github.com/river-build/river/core/node/shared"
)

func (s *Service) localAddMediaEvent(
	ctx context.Context,
	req *connect.Request[AddMediaEventRequest],
	localStream SyncStream,
	streamView StreamView,
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

	err = s.addParsedMediaEvent(ctx, streamId, parsedEvent, localStream, streamView, creationCookie)
	if err != nil && req.Msg.Optional {
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
	} else if err != nil {
		return nil, AsRiverError(err).Func("localAddMediaEvent")
	} else {
		return connect.NewResponse(&AddMediaEventResponse{}), nil
	}
}

func (s *Service) addParsedMediaEvent(
	ctx context.Context,
	streamId StreamId,
	parsedEvent *ParsedEvent,
	localStream SyncStream,
	streamView StreamView,
	creationCookie *CreationCookie,
) error {
	// TODO: here it should loop and re-check the rules if view was updated in the meantime.

	canAddEvent, verifications, sideEffects, err := rules.CanAddEvent(
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

	if len(verifications.OneOfChainAuths) > 0 {
		isEntitled := false
		var err error
		// Determine if any chainAuthArgs grant entitlement
		for _, chainAuthArgs := range verifications.OneOfChainAuths {
			isEntitled, err = s.chainAuth.IsEntitled(ctx, s.config, chainAuthArgs)
			if err != nil {
				return err
			}
			if isEntitled {
				break
			}
		}
		// If no chainAuthArgs grant entitlement, execute the OnChainAuthFailure side effect.
		if !isEntitled {
			if sideEffects.OnChainAuthFailure != nil {
				err := s.AddEventPayload(
					ctx,
					sideEffects.OnChainAuthFailure.StreamId,
					sideEffects.OnChainAuthFailure.Payload,
				)
				if err != nil {
					return err
				}
			}
			return RiverError(
				Err_PERMISSION_DENIED,
				"IsEntitled failed",
				"chainAuthArgsList",
				verifications.OneOfChainAuths,
			).Func("addParsedEvent")
		}
	}

	if verifications.Receipt != nil {
		isVerified, err := s.chainAuth.VerifyReceipt(ctx, s.config, verifications.Receipt)
		if err != nil {
			return err
		}
		if !isVerified {
			return RiverError(
				Err_PERMISSION_DENIED,
				"VerifyReceipt failed",
				"receipt",
				verifications.Receipt,
			).Func("addParsedEvent")
		}
	}

	if sideEffects.RequiredParentEvent != nil {
		// TODO: Should we use AddMediaEvent here?
		err := s.AddMediaEventPayload(ctx, sideEffects.RequiredParentEvent.StreamId, sideEffects.RequiredParentEvent.Payload)
		if err != nil {
			return err
		}
	}

	stream := &replicatedStream{
		streamId:    streamId.String(),
		localStream: localStream,
		nodes:       localStream,
		service:     s,
	}

	err = stream.AddMediaEvent(ctx, parsedEvent, creationCookie)
	if err != nil {
		return err
	}

	return nil
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

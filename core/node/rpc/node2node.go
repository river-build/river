package rpc

import (
	"context"
	"time"

	"connectrpc.com/connect"

	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/utils"
)

func (s *Service) AllocateStream(
	ctx context.Context,
	req *connect.Request[AllocateStreamRequest],
) (*connect.Response[AllocateStreamResponse], error) {
	ctx, log := utils.CtxAndLogForRequest(ctx, req)
	ctx, cancel := utils.UncancelContext(ctx, 10*time.Second, 20*time.Second)
	defer cancel()
	log.Debug("AllocateStream ENTER")
	r, e := s.allocateStream(ctx, req.Msg)
	if e != nil {
		return nil, AsRiverError(
			e,
		).Func("AllocateStream").
			Tag("streamId", req.Msg.StreamId).
			LogWarn(log).
			AsConnectError()
	}
	log.Debug("AllocateStream LEAVE", "response", r)
	return connect.NewResponse(r), nil
}

func (s *Service) allocateStream(ctx context.Context, req *AllocateStreamRequest) (*AllocateStreamResponse, error) {
	streamId, err := StreamIdFromBytes(req.StreamId)
	if err != nil {
		return nil, err
	}

	// TODO: check request is signed by correct node
	// TODO: all checks that should be done on create?
	stream, err := s.cache.GetStreamWaitForLocal(ctx, streamId)
	if err != nil {
		return nil, err
	}

	view, err := stream.GetView(ctx)
	if err != nil {
		return nil, err
	}

	return &AllocateStreamResponse{
		SyncCookie: view.SyncCookie(s.wallet.Address),
	}, nil
}

func (s *Service) NewEventReceived(
	ctx context.Context,
	req *connect.Request[NewEventReceivedRequest],
) (*connect.Response[NewEventReceivedResponse], error) {
	ctx, log := utils.CtxAndLogForRequest(ctx, req)
	ctx, cancel := utils.UncancelContext(ctx, 5*time.Second, 10*time.Second)
	defer cancel()
	log.Debug("NewEventReceived ENTER")
	r, e := s.newEventReceived(ctx, req.Msg)
	if e != nil {
		return nil, AsRiverError(
			e,
		).Func("NewEventReceived").
			Tag("streamId", req.Msg.StreamId).
			LogWarn(log).
			AsConnectError()
	}
	log.Debug("NewEventReceived LEAVE", "response", r)
	return connect.NewResponse(r), nil
}

func (s *Service) newEventReceived(
	ctx context.Context,
	req *NewEventReceivedRequest,
) (*NewEventReceivedResponse, error) {
	streamId, err := StreamIdFromBytes(req.StreamId)
	if err != nil {
		return nil, err
	}

	// TODO: check request is signed by correct node
	parsedEvent, err := ParseEvent(req.Event)
	if err != nil {
		return nil, err
	}

	stream, err := s.cache.GetStreamWaitForLocal(ctx, streamId)
	if err != nil {
		return nil, err
	}

	err = stream.AddEvent(ctx, parsedEvent)
	if err != nil {
		return nil, err
	}

	return &NewEventReceivedResponse{}, nil
}

func (s *Service) NewEventInPool(
	context.Context,
	*connect.Request[NewEventInPoolRequest],
) (*connect.Response[NewEventInPoolResponse], error) {
	return nil, nil
}

func (s *Service) ProposeMiniblock(
	ctx context.Context,
	req *connect.Request[ProposeMiniblockRequest],
) (*connect.Response[ProposeMiniblockResponse], error) {
	ctx, log := utils.CtxAndLogForRequest(ctx, req)
	log.Debug("ProposeMiniblock ENTER")
	r, e := s.proposeMiniblock(ctx, req.Msg)
	if e != nil {
		return nil, AsRiverError(
			e,
		).Func("ProposeMiniblock").
			Tag("streamId", req.Msg.StreamId).
			LogWarn(log).
			AsConnectError()
	}
	log.Debug("ProposeMiniblock LEAVE", "response", r)
	return connect.NewResponse(r), nil
}

func (s *Service) proposeMiniblock(
	ctx context.Context,
	req *ProposeMiniblockRequest,
) (*ProposeMiniblockResponse, error) {
	streamId, err := StreamIdFromBytes(req.StreamId)
	if err != nil {
		return nil, err
	}

	stream, err := s.cache.GetStreamWaitForLocal(ctx, streamId)
	if err != nil {
		return nil, err
	}

	view, err := stream.GetView(ctx)
	if err != nil {
		return nil, err
	}

	proposal, err := view.ProposeNextMiniblock(ctx, s.chainConfig.Get(), req.DebugForceSnapshot)
	if err != nil {
		return nil, err
	}

	if proposal == nil {
		return nil, RiverError(Err_MINIPOOL_MISSING_EVENTS, "Empty stream minipool")
	}

	return &ProposeMiniblockResponse{
		Proposal: proposal,
	}, nil
}

func (s *Service) SaveMiniblockCandidate(
	ctx context.Context,
	req *connect.Request[SaveMiniblockCandidateRequest],
) (*connect.Response[SaveMiniblockCandidateResponse], error) {
	ctx, log := utils.CtxAndLogForRequest(ctx, req)
	ctx, cancel := utils.UncancelContext(ctx, 5*time.Second, 10*time.Second)
	defer cancel()
	log.Debug("SaveMiniblockCandidate ENTER")
	r, e := s.saveMiniblockCandidate(ctx, req.Msg)
	if e != nil {
		return nil, AsRiverError(
			e,
		).Func("SaveMiniblockCandidate").
			Tag("streamId", req.Msg.StreamId).
			LogWarn(log).
			AsConnectError()
	}
	log.Debug("SaveMiniblockCandidate LEAVE", "response", r)
	return connect.NewResponse(r), nil
}

func (s *Service) saveMiniblockCandidate(
	ctx context.Context,
	req *SaveMiniblockCandidateRequest,
) (*SaveMiniblockCandidateResponse, error) {
	streamId, err := StreamIdFromBytes(req.StreamId)
	if err != nil {
		return nil, err
	}

	stream, err := s.cache.GetStreamWaitForLocal(ctx, streamId)
	if err != nil {
		return nil, err
	}

	err = stream.SaveMiniblockCandidate(ctx, req.Miniblock)
	if err != nil {
		return nil, err
	}

	return &SaveMiniblockCandidateResponse{}, nil
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

	stream, err := s.cache.GetStreamWaitForLocal(ctx, streamId)
	if err != nil {
		return nil, err
	}

	err = stream.SaveEphemeralMiniblock(ctx, req.Miniblock)
	if err != nil {
		return nil, err
	}

	return &SaveEphemeralMiniblockResponse{}, nil
}

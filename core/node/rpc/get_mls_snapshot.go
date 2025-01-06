package rpc

import (
	"context"

	"connectrpc.com/connect"
	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/protocol/protocolconnect"
	"github.com/river-build/river/core/node/shared"
)

func (s *Service) GetMlsSnapshot(
	ctx context.Context,
	req *connect.Request[GetMlsSnapshotRequest],
) (*connect.Response[GetMlsSnapshotResponse], error) {
	return executeConnectHandler(ctx, req, s, s.getMlsSnapshotImpl, "GetMlsSnapshot")
}

func (s *Service) getMlsSnapshotImpl(
	ctx context.Context,
	req *connect.Request[GetMlsSnapshotRequest],
) (*connect.Response[GetMlsSnapshotResponse], error) {
	streamId, err := shared.StreamIdFromBytes(req.Msg.StreamId)
	if err != nil {
		return nil, err
	}

	stream, err := s.cache.GetStreamNoWait(ctx, streamId)
	if err != nil {
		return nil, err
	}

	if stream.IsLocal() {
		return s.localGetMlsSnapshot(ctx, req, stream)
	}

	return peerNodeRequestWithRetries(
		ctx,
		stream,
		s,
		func(ctx context.Context, stub StreamServiceClient) (*connect.Response[GetMlsSnapshotResponse], error) {
			ret, err := stub.GetMlsSnapshot(ctx, req)
			if err != nil {
				return nil, err
			}
			return connect.NewResponse(ret.Msg), nil
		},
		-1,
	)
}

func (s *Service) localGetMlsSnapshot(
	ctx context.Context,
	req *connect.Request[GetMlsSnapshotRequest],
	stream SyncStream,
) (*connect.Response[GetMlsSnapshotResponse], error) {
	miniblocks, terminus, err := stream.GetMiniblocks(ctx, req.Msg.MiniblockNum, req.Msg.MiniblockNum + 1)
	if err != nil {
		return nil, err
	}

	header, err := ParseEvent(miniblocks[0].GetHeader())
	if err != nil {
		return nil, err
	}

	miniblockHeader := header.Event.GetMiniblockHeader()
	if miniblockHeader == nil {
		return nil, RiverError(Err_INVALID_ARGUMENT, "invalid miniblock header")
	}

	snapshot := miniblockHeader.GetSnapshot()
	resp := &GetMlsSnapshotResponse{
		Mls: snapshot.Members.Mls,
		Terminus: terminus,
		PrevSnapshotMiniblockNum: miniblockHeader.PrevSnapshotMiniblockNum,
	}

	return connect.NewResponse(resp), nil
}

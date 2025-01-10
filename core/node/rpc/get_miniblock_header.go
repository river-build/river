package rpc

import (
	"context"

	"connectrpc.com/connect"
	"github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
)

func (s *Service) GetMiniblockHeader(
	ctx context.Context,
	req *connect.Request[GetMiniblockHeaderRequest],
) (*connect.Response[GetMiniblockHeaderResponse], error) {
	miniblocksRequest := &GetMiniblocksRequest{
		StreamId: req.Msg.StreamId,
		FromInclusive: req.Msg.MiniblockNum,
		ToExclusive: req.Msg.MiniblockNum + 1,
	}
	miniblocksResponse, err := s.GetMiniblocks(ctx, connect.NewRequest(miniblocksRequest))
	if err != nil {
		return nil, err
	}
	miniblock := miniblocksResponse.Msg.Miniblocks[0]
	info, err := events.NewMiniblockInfoFromProto(miniblock, &events.ParsedMiniblockInfoOpts{})
	if err != nil {
		return nil, err
	}
	return connect.NewResponse(&GetMiniblockHeaderResponse{
		Header: info.Header(),
	}), nil
}

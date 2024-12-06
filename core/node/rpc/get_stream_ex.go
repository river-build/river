package rpc

import (
	"context"

	"connectrpc.com/connect"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
)

func (s *Service) localGetStreamEx(
	ctx context.Context,
	req *connect.Request[GetStreamExRequest],
	resp *connect.ServerStream[GetStreamExResponse],
) (err error) {
	streamId, err := shared.StreamIdFromBytes(req.Msg.StreamId)
	if err != nil {
		return err
	}

	if err = s.storage.ReadMiniblocksByStream(ctx, streamId, func(mb *Miniblock) error {
		return resp.Send(&GetStreamExResponse{
			Data: &GetStreamExResponse_Miniblock{
				Miniblock: mb,
			},
		})
	}); err != nil {
		return err
	}

	// Send back an empty response to signal the end of the stream.
	if err = resp.Send(&GetStreamExResponse{}); err != nil {
		return err
	}

	return nil
}

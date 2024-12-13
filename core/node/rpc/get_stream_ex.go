package rpc

import (
	"context"
	"time"

	"connectrpc.com/connect"
	"google.golang.org/protobuf/proto"

	. "github.com/river-build/river/core/node/base"
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

	perSendTimeout := ctx.Value(perSendTimeoutVal{}).(time.Duration)

	if err = s.storage.ReadMiniblocksByStream(ctx, streamId, func(blockdata []byte, seqNum int) error {
		var mb Miniblock
		if err := proto.Unmarshal(blockdata, &mb); err != nil {
			return WrapRiverError(Err_BAD_BLOCK, err).Message("Unable to unmarshal miniblock")
		}

		errCh := make(chan error, 1)

		// Send operation in a goroutine to allow for timeout handling
		go func() {
			errCh <- resp.Send(&GetStreamExResponse{
				Data: &GetStreamExResponse_Miniblock{
					Miniblock: &mb,
				},
			})
		}()

		// Setting up the interruption logic if per-send timeout is provided
		if perSendTimeout > 0 {
			timeout := time.After(perSendTimeout)

			select {
			case err := <-errCh:
				if err != nil {
					return WrapRiverError(Err_INTERNAL, err).Message("Unable to send miniblock")
				}

				return nil
			case <-timeout:
				return RiverError(Err_DEADLINE_EXCEEDED, "Send operation timed out").Tag("seqNum", seqNum)
			}
		}

		// Otherwise just wait for the send operation to be completed
		return <-errCh
	}); err != nil {
		return err
	}

	// Send back an empty response to signal the end of the stream.
	if err = resp.Send(&GetStreamExResponse{}); err != nil {
		return err
	}

	return nil
}

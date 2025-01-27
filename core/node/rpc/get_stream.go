package rpc

import (
	"connectrpc.com/connect"

	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
)

func (s *Service) localGetStream(
	streamView *StreamViewImpl,
) (*connect.Response[GetStreamResponse], error) {
	return connect.NewResponse(&GetStreamResponse{
		Stream: &StreamAndCookie{
			Events:         streamView.MinipoolEnvelopes(),
			NextSyncCookie: streamView.SyncCookie(s.wallet.Address),
			Miniblocks:     streamView.MiniblocksFromLastSnapshot(),
		},
	}), nil
}

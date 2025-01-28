package rpc

import (
	"testing"

	"connectrpc.com/connect"

	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
)

// Test_Node2Node_GetMiniblocksByIds tests fetching miniblocks by their IDs using internode RPC endpoints.
func Test_Node2Node_GetMiniblocksByIds(t *testing.T) {
	tt := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})

	alice := tt.newTestClient(0)
	_ = alice.createUserStream()
	spaceId, _ := alice.createSpace()
	channelId, mb := alice.createChannel(spaceId)

	// Seal the stream
	resp, err := alice.node2nodeClient.GetMiniblocksByIds(alice.ctx, connect.NewRequest(&GetMiniblocksByIdsRequest{
		StreamId:     channelId[:],
		MiniblockIds: []int64{mb.Num},
	}))
	tt.require.NoError(err)

	tt.require.True(resp.Receive())
	msg := resp.Msg()
	tt.require.Equal(mb.Hash.Bytes(), msg.GetMiniblock().GetHeader().GetHash())
	tt.require.Equal(mb.Num, msg.GetNum())
	tt.require.False(resp.Receive())
	tt.require.NoError(resp.Err())
}

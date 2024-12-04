package rpc

import (
	"testing"
)

func TestReplMulticlientSimple(t *testing.T) {
	tt := newServiceTester(t, serviceTesterOpts{numNodes: 5, replicationFactor: 5, start: true})
	// ctx := tt.ctx
	// require := tt.require

	tc0 := tt.newTestClient(0)

	_ = tc0.createUserStream()
	spaceId, _ := tc0.createSpace()
	channelId, _ := tc0.createChannel(spaceId)

	tc1 := tt.newTestClient(1)
	user1LastMb := tc1.createUserStream()
	tc1.joinChannel(spaceId, channelId, user1LastMb)
}

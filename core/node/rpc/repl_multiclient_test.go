package rpc

import (
	"fmt"
	"testing"
	//. "github.com/river-build/river/core/node/shared"
)

func TestReplMulticlientSimple(t *testing.T) {
	tt := newServiceTester(t, serviceTesterOpts{numNodes: 5, replicationFactor: 5, start: true})
	// ctx := tt.ctx
	// require := tt.require

	alice := tt.newTestClient(0)

	_ = alice.createUserStream()
	spaceId, _ := alice.createSpace()
	channelId, _ := alice.createChannel(spaceId)

	bob := tt.newTestClient(1)
	user1LastMb := bob.createUserStream()
	bob.joinChannel(spaceId, channelId, user1LastMb)

	allClients := testClients{alice, bob}
	allClients.requireMembership(channelId)

	carol := tt.newTestClient(2)
	user2LastMb := carol.createUserStream()
	carol.joinChannel(spaceId, channelId, user2LastMb)

	allClients = append(allClients, carol)
	allClients.requireMembership(channelId)

	allClients.say(channelId, "hello from Alice", "hello from Bob", "hello from Carol")

	allClients.listen(channelId, [][]string{
		{"hello from Alice", "hello from Bob", "hello from Carol"},
	})
}

func TestReplSpeakUntilMbTrim(t *testing.T) {
	tt := newServiceTester(t, serviceTesterOpts{numNodes: 5, replicationFactor: 5, start: true})
	require := tt.require

	alice := tt.newTestClient(0)
	_ = alice.createUserStream()
	spaceId, _ := alice.createSpace()
	channelId, _ := alice.createChannel(spaceId)

	for count := range 1000 {
		alice.say(channelId, fmt.Sprintf("hello from Alice %d", count))
		_, view := alice.getStreamAndView(channelId, false)
		if view.Miniblocks()[0].Ref.Num > 0 {
			view = alice.addHistoryToView(view)
			require.Zero(view.Miniblocks()[0].Ref.Num)
			return
		}
	}
	require.Fail("failed to trim miniblocks")
}

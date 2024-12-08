package rpc

import (
	"fmt"
	"testing"
	"time"

	"github.com/river-build/river/core/node/crypto"
	//. "github.com/river-build/river/core/node/shared"
)

func newServiceTesterForReplication(t *testing.T) *serviceTester {
	return newServiceTester(
		t,
		serviceTesterOpts{
			numNodes:          5,
			replicationFactor: 5,
			start:             true,
			btcParams: &crypto.TestParams{
				AutoMine:         true,
				AutoMineInterval: 200 * time.Millisecond,
				MineOnTx:         false,
			},
		},
	)
}

func TestReplMcSimple(t *testing.T) {
	tt := newServiceTesterForReplication(t)

	clients := tt.newTestClients(3)
	spaceId, _ := clients[0].createSpace()
	channelId := clients.createChannelAndJoin(spaceId)
	phrases1 := []string{"hello from Alice", "hello from Bob", "hello from Carol"}
	clients.say(channelId, phrases1...)

	clients.listen(channelId, [][]string{phrases1})

	phrases2 := []string{"hello from Alice 2", "hello from Bob 2", "hello from Carol 2"}
	clients.say(channelId, phrases2...)
	clients.listen(channelId, [][]string{phrases1, phrases2})

	phrases3 := []string{"", "hello from Bob 3", ""}
	clients.say(channelId, phrases3...)
	clients.listen(channelId, [][]string{phrases1, phrases2, phrases3})
}

func TestReplMcSpeakUntilMbTrim(t *testing.T) {
	tt := newServiceTesterForReplication(t)
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

func testReplMcConversation(t *testing.T, numClients int, numSteps int, listenInterval int) {
	tt := newServiceTesterForReplication(t)
	clients := tt.newTestClients(numClients)
	spaceId, _ := clients[0].createSpace()
	channelId := clients.createChannelAndJoin(spaceId)

	messages := make([][]string, numSteps)
	for i := range messages {
		messages[i] = make([]string, numClients)
		for j := range messages[i] {
			messages[i][j] = fmt.Sprintf("message %d from client %d %s", i, j, clients[j].name)
		}
	}

	for i, m := range messages {
		fmt.Printf("step %d\n", i)
		clients.say(channelId, m...)
		if listenInterval > 0 && (i+1)%listenInterval == 0 {
			fmt.Printf("listen step %d\n", i)
			clients.listen(channelId, messages[:i+1])
			fmt.Printf("done listen step %d\n", i)
		}
	}

	if listenInterval <= 0 || numSteps%listenInterval != 0 {
		clients.listen(channelId, messages)
	}
}

func TestReplMcConversation(t *testing.T) {
	t.Parallel()
	t.Run("5x5", func(t *testing.T) {
		testReplMcConversation(t, 5, 5, 1)
	})
	t.Run("debug", func(t *testing.T) {
		testReplMcConversation(t, 5, 12, 1)
	})
}

package rpc

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/protocol"
)

func TestGetStreamEx(t *testing.T) {
	tt := newServiceTester(
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

	clients := tt.newTestClients(3)
	spaceId, _ := clients[0].createSpace()
	channelId := clients.createChannelAndJoin(spaceId)

	phrases1 := []string{"hello from Alice", "hello from Bob", "hello from Carol"}
	clients.say(channelId, phrases1...)
	clients.listen(channelId, [][]string{phrases1})

	phrases2 := []string{"hello from Alice 2", "hello from Bob 2", "hello from Carol 2"}
	clients.say(channelId, phrases2...)
	clients.listen(channelId, [][]string{phrases1, phrases2})

	mbs := make([]*protocol.Miniblock, 0, 6)
	clients[0].getStreamEx(spaceId, func(mb *protocol.Miniblock) {
		mbs = append(mbs, mb)
	})
	tt.require.Len(mbs, 6)

	for _, mb := range mbs {
		tt.require.NotNil(mb)

		events, _ := json.MarshalIndent(mb.GetEvents(), "", "  ")
		fmt.Println(string(events))
	}
}

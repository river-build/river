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
			numNodes: 1,
			start:    true,
			btcParams: &crypto.TestParams{
				AutoMine:         true,
				AutoMineInterval: 200 * time.Millisecond,
				MineOnTx:         true,
			},
		},
	)
	require := tt.require

	alice := tt.newTestClient(0)
	_ = alice.createUserStream()
	spaceId, _ := alice.createSpace()
	channelId, _ := alice.createChannel(spaceId)

	for count := range 100 {
		alice.say(channelId, fmt.Sprintf("hello from Alice %d", count))
	}

	time.Sleep(1 * time.Second)

	stream := alice.getStream(channelId)
	fmt.Println(len(stream.GetEvents())) // Prints 0

	mbs := make([]*protocol.Miniblock, 0, 100)
	alice.getStreamEx(channelId, func(mb *protocol.Miniblock) {
		mbs = append(mbs, mb)
	})
	require.Len(mbs, 100) // 0 miniblocks

	for _, mb := range mbs {
		require.NotNil(mb)

		events, _ := json.MarshalIndent(mb.GetEvents(), "", "  ")
		fmt.Println(string(events))
	}
}

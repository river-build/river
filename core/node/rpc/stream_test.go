package rpc

import (
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
				AutoMineInterval: 10 * time.Millisecond,
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

	require.Eventually(func() bool {
		mbs := make([]*protocol.Miniblock, 0, 102)
		alice.getStreamEx(channelId, func(mb *protocol.Miniblock) {
			mbs = append(mbs, mb)
		})

		events := make([]*protocol.Envelope, 0, 102)
		for _, mb := range mbs {
			for _, event := range mb.GetEvents() {
				events = append(events, event)
			}
		}

		return len(events) == 102
	}, time.Second*5, time.Millisecond*200)
}

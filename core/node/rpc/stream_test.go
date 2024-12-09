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

	require.Eventually(func() bool {
		mbs := make([]*protocol.Miniblock, 0, 100)
		alice.getStreamEx(channelId, func(mb *protocol.Miniblock) {
			mbs = append(mbs, mb)
		})
		t.Logf("mbs %d", len(mbs))
		//if len(mbs) != 100 {
		//	return false
		//}

		for _, mb := range mbs {
			require.NotNil(mb)

			for _, event := range mb.GetEvents() {
				eventRaw, _ := json.MarshalIndent(event.GetEvent(), "", "  ")
				fmt.Println(string(eventRaw))
			}

		}

		return true
	}, time.Second*5, time.Millisecond*200)

}

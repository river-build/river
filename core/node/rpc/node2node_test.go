package rpc

import (
	"fmt"
	"testing"
	"time"

	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
)

// Test_Node2Node_GetMiniblocksByIds tests fetching miniblocks by their IDs using internode RPC endpoints.
func Test_Node2Node_GetMiniblocksByIds(t *testing.T) {
	tt := newServiceTester(t, serviceTesterOpts{
		numNodes: 1,
		start:    true,
		btcParams: &crypto.TestParams{
			AutoMine:         true,
			AutoMineInterval: 10 * time.Millisecond,
			MineOnTx:         true,
		},
	})

	alice := tt.newTestClient(0)
	_ = alice.createUserStream()
	spaceId, _ := alice.createSpace()
	channelId, creationMb := alice.createChannel(spaceId)

	mbNums := []int64{creationMb.Num}
	const messagesNumber = 100
	for count := range messagesNumber {
		alice.say(channelId, fmt.Sprintf("hello from Alice %d", count))
		mbNums = append(mbNums, mbNums[len(mbNums)-1]+1)
	}

	tt.require.Eventually(func() bool {
		mbs := make([]*Miniblock, 0, len(mbNums))
		alice.getMiniblocksByIds(channelId, mbNums, func(mb *protocol.Miniblock) {
			mbs = append(mbs, mb)
		})

		events := make([]*Envelope, 0, len(mbNums))
		for _, mb := range mbs {
			events = append(events, mb.GetEvents()...)
		}

		return len(events) == len(mbNums)
	}, time.Second*5, time.Millisecond*200)
}

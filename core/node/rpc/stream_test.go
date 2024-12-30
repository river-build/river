package rpc

import (
	"fmt"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/river-build/river/core/contracts/river"
	"github.com/river-build/river/core/node/base"
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

	// Expected number of events is 102 because the first event is the channel creation event (inception),
	// the second event is the joining the channel event (membership), and the rest are the messages.
	const expectedEventsNumber = 102

	require.Eventually(func() bool {
		mbs := make([]*protocol.Miniblock, 0, expectedEventsNumber)
		alice.getStreamEx(channelId, func(mb *protocol.Miniblock) {
			mbs = append(mbs, mb)
		})

		events := make([]*protocol.Envelope, 0, expectedEventsNumber)
		for _, mb := range mbs {
			events = append(events, mb.GetEvents()...)
		}

		return len(events) == expectedEventsNumber
	}, time.Second*5, time.Millisecond*200)
}

// TestMiniBlockProductionFrequency ensures only every 1 out of StreamMiniblockRegistrationFrequencyKey miniblock
// is registered for a stream.
func TestMiniBlockProductionFrequency(t *testing.T) {
	tt := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true, btcParams: &crypto.TestParams{
		MineOnTx: true,
	}})
	miniblockRegistrationFrequency := uint64(3)
	tt.btc.SetConfigValue(
		t,
		tt.ctx,
		crypto.StreamMiniblockRegistrationFrequencyKey,
		crypto.ABIEncodeUint64(miniblockRegistrationFrequency),
	)

	alice := tt.newTestClient(0)
	_ = alice.createUserStream()
	spaceId, _ := alice.createSpace()
	channelId, _ := alice.createChannel(spaceId)

	// retrieve set last miniblock events and make sure that only 1 out of miniblockRegistrationFrequency
	// miniblocks is registered
	filterer, err := river.NewStreamRegistryV1Filterer(tt.btc.RiverRegistryAddress, tt.btc.Client())
	tt.require.NoError(err)

	var logsFound []*river.StreamRegistryV1StreamLastMiniblockUpdated

	tt.require.Eventually(func() bool {
		logsFound = nil

		alice.say(channelId, "hi!")
		tt.require.NoError(base.SleepWithContext(tt.ctx, 100*time.Millisecond))

		// get all logs and make sure that at least 3 miniblocks are registered
		logs, err := filterer.FilterStreamLastMiniblockUpdated(&bind.FilterOpts{
			Start:   0,
			End:     nil,
			Context: tt.ctx,
		})
		tt.require.NoError(err)

		for logs.Next() {
			log := logs.Event
			logsFound = append(logsFound, log)
		}

		if len(logsFound) < 3 {
			return false
		}

		// make sure that the first 3 logs have last miniblock num frequency apart
		return logsFound[0].LastMiniblockNum+miniblockRegistrationFrequency == logsFound[1].LastMiniblockNum &&
			logsFound[0].LastMiniblockNum+miniblockRegistrationFrequency+miniblockRegistrationFrequency == logsFound[2].LastMiniblockNum
	}, 20*time.Second, 25*time.Millisecond)
}

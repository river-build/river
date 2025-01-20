package events

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/contracts/river"
	"github.com/river-build/river/core/node/crypto"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/testutils"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/emptypb"
)

func TestStreamCacheViewEviction(t *testing.T) {
	require := require.New(t)
	ctx, tc := makeCacheTestContext(t, testParams{})

	// disable auto stream cache cleanup, do cleanup manually
	tc.btc.SetConfigValue(t, ctx, crypto.StreamCacheExpirationPollIntervalMsConfigKey, crypto.ABIEncodeUint64(0))

	streamCache := tc.initCache(0, nil)

	require.Zero(streamCache.cache.Size(), "stream cache must be empty")

	node := tc.getBC()
	streamID := testutils.FakeStreamId(STREAM_SPACE_BIN)
	_, genesisMiniblock := makeTestSpaceStream(t, node.Wallet, streamID, nil)

	tc.createStreamNoCache(streamID, genesisMiniblock)

	streamSync, err := streamCache.GetStreamWaitForLocal(ctx, streamID)
	require.NoError(err, "loading stream record")
	streamView, err := streamSync.GetView(ctx)
	require.NoError(err)

	// stream just loaded and should be with view in cache
	streamWithoutLoadedView := 0
	streamWithLoadedViewCount := 0
	streamCache.cache.Range(func(key StreamId, value *streamImpl) bool {
		if value.view() == nil {
			streamWithoutLoadedView++
		} else {
			streamWithLoadedViewCount++
		}
		return true
	})
	require.Equal(0, streamWithoutLoadedView, "stream cache must have no unloaded streams")
	require.Equal(1, streamWithLoadedViewCount, "stream cache must have one loaded stream")

	// views of inactive stream must be dropped, even if there are subscribers
	receiver := &testStreamCacheViewEvictionSub{}
	syncCookie := streamView.SyncCookie(node.Wallet.Address)

	err = streamSync.Sub(ctx, syncCookie, receiver)
	require.NoError(err, "subscribe to stream")

	time.Sleep(10 * time.Millisecond) // make sure we hit the cache expiration of 1 ms
	ctxShort, cancelShort := context.WithTimeout(ctx, 25*time.Millisecond)
	streamCache.CacheCleanup(ctxShort, true, time.Millisecond)
	cancelShort()

	// cache must have view dropped even there is a subscriber
	streamWithoutLoadedView = 0
	streamWithLoadedViewCount = 0
	streamCache.cache.Range(func(key StreamId, value *streamImpl) bool {
		if value.view() == nil {
			streamWithoutLoadedView++
		} else {
			streamWithLoadedViewCount++
		}
		return true
	})
	require.Equal(1, streamWithoutLoadedView, "stream cache must have 1 unloaded streams")
	require.Equal(0, streamWithLoadedViewCount, "stream cache must have no loaded stream")

	// unsubscribe from stream should not change which stream views are loaded/unloaded
	streamSync.Unsub(receiver)

	// no subscribers anymore so its view must be dropped from cache
	time.Sleep(10 * time.Millisecond) // make sure we hit the cache expiration of 1 ms
	ctxShort, cancelShort = context.WithTimeout(ctx, 25*time.Millisecond)
	streamCache.CacheCleanup(ctxShort, true, time.Millisecond)
	cancelShort()

	streamWithoutLoadedView = 0
	streamWithLoadedViewCount = 0
	streamCache.cache.Range(func(key StreamId, value *streamImpl) bool {
		if value.view() == nil {
			streamWithoutLoadedView++
		} else {
			streamWithLoadedViewCount++
		}
		return true
	})
	require.Equal(1, streamWithoutLoadedView, "stream cache must have 1 unloaded streams")
	require.Equal(0, streamWithLoadedViewCount, "stream cache must have ne loaded stream")

	// stream view must be loaded again in cache
	stream, err := streamCache.GetStreamWaitForLocal(ctx, streamID)
	require.NoError(err, "loading stream record")
	_, err = stream.GetView(ctx)
	require.NoError(err, "get view")
	streamWithoutLoadedView = 0
	streamWithLoadedViewCount = 0
	streamCache.cache.Range(func(key StreamId, value *streamImpl) bool {
		if value.view() == nil {
			streamWithoutLoadedView++
		} else {
			streamWithLoadedViewCount++
		}
		return true
	})
	require.Equal(0, streamWithoutLoadedView, "stream cache must have no unloaded streams")
	require.Equal(1, streamWithLoadedViewCount, "stream cache must have 1 loaded stream")
}

func TestCacheEvictionWithFilledMiniBlockPool(t *testing.T) {
	require := require.New(t)
	ctx, tc := makeCacheTestContext(t, testParams{})

	// disable auto stream cache cleanup, do cleanup manually
	tc.btc.SetConfigValue(t, ctx, crypto.StreamCacheExpirationPollIntervalMsConfigKey, crypto.ABIEncodeUint64(0))

	streamCache := tc.initCache(0, nil)

	require.Zero(streamCache.cache.Size(), "stream cache must be empty")

	node := tc.getBC()
	streamID := testutils.FakeStreamId(STREAM_SPACE_BIN)
	_, genesisMiniblock := makeTestSpaceStream(t, node.Wallet, streamID, nil)

	tc.createStreamNoCache(streamID, genesisMiniblock)

	streamSync, err := streamCache.GetStreamWaitForLocal(ctx, streamID)
	require.NoError(err, "loading stream record")
	_, err = streamSync.GetView(ctx)
	require.NoError(err, "get view")

	// stream just loaded and should have view loaded
	streamWithoutLoadedView := 0
	streamWithLoadedViewCount := 0
	streamCache.cache.Range(func(key StreamId, value *streamImpl) bool {
		if value.view() == nil {
			streamWithoutLoadedView++
		} else {
			streamWithLoadedViewCount++
		}
		return true
	})
	require.Equal(0, streamWithoutLoadedView, "stream cache must have no unloaded streams")
	require.Equal(1, streamWithLoadedViewCount, "stream cache must have one loaded stream")

	// ensure that view is dropped from cache
	time.Sleep(10 * time.Millisecond) // make sure we hit the cache expiration of 1 ms
	ctxShort, cancelShort := context.WithTimeout(ctx, 25*time.Millisecond)
	streamCache.CacheCleanup(ctxShort, true, time.Millisecond)
	cancelShort()
	loadedStream, _ := streamCache.cache.Load(streamID)
	require.Nil(loadedStream.view(), "view not unloaded")

	// try to create a miniblock, pool is empty so it should not fail but also should not create a miniblock
	_ = tc.makeMiniblock(0, streamID, false)

	// add event to stream with unloaded view, view should be loaded in cache and minipool must contain event
	addEventToStream(
		t,
		ctx,
		tc.instances[0].params,
		streamSync,
		"payload",
		&MiniblockRef{Hash: common.BytesToHash(genesisMiniblock.Header.Hash), Num: 0},
	)

	// with event in minipool ensure that view isn't evicted from cache
	time.Sleep(10 * time.Millisecond) // make sure we hit the cache expiration of 1 ms
	ctxShort, cancelShort = context.WithTimeout(ctx, 25*time.Millisecond)
	streamCache.CacheCleanup(ctxShort, true, time.Millisecond)
	cancelShort()
	loadedStream, _ = streamCache.cache.Load(streamID)
	require.NotNil(loadedStream.view(), "view unloaded")

	// now it should be possible to create a miniblock
	mbRef := tc.makeMiniblock(0, streamID, false)
	require.NotEqual(common.Hash{}, mbRef.Hash)
	require.Greater(mbRef.Num, int64(0))

	// minipool should be empty now and view should be evicted from cache
	time.Sleep(10 * time.Millisecond) // make sure we hit the cache expiration of 1 ms
	ctxShort, cancelShort = context.WithTimeout(ctx, 25*time.Millisecond)
	streamCache.CacheCleanup(ctxShort, true, time.Millisecond)
	cancelShort()
	loadedStream, _ = streamCache.cache.Load(streamID)
	require.Nil(loadedStream.view(), "view loaded in cache")
}

type testStreamCacheViewEvictionSub struct {
	receivedStreamAndCookies []*StreamAndCookie
	receivedErrors           []error
	streamErrors             []StreamId
}

func (sub *testStreamCacheViewEvictionSub) OnUpdate(sac *StreamAndCookie) {
	sub.receivedStreamAndCookies = append(sub.receivedStreamAndCookies, sac)
}

func (sub *testStreamCacheViewEvictionSub) OnSyncError(err error) {
	sub.receivedErrors = append(sub.receivedErrors, err)
}

func (sub *testStreamCacheViewEvictionSub) OnStreamSyncDown(streamID StreamId) {
	sub.streamErrors = append(sub.streamErrors, streamID)
}

func (sub *testStreamCacheViewEvictionSub) eventsReceived() int {
	count := 0
	for _, sac := range sub.receivedStreamAndCookies {
		count += len(sac.Events)
	}
	return count
}

// TODO: it seems this test takes at least 60 seconds, why?
func TestStreamMiniblockBatchProduction(t *testing.T) {
	require := require.New(t)
	ctx, tc := makeCacheTestContext(t, testParams{disableMineOnTx: true})
	btc := tc.btc

	// disable auto stream cache cleanup, do cleanup manually
	tc.btc.SetConfigValue(t, ctx, crypto.StreamCacheExpirationPollIntervalMsConfigKey, crypto.ABIEncodeUint64(0))

	streamCache := tc.initCache(0, nil)

	streamCache.cache.Range(func(key StreamId, value *streamImpl) bool {
		require.Fail("stream cache must be empty")
		return true
	})

	// the stream cache uses the chain block production as a ticker to create new mini-blocks.
	// after initialization take back control when to create new chain blocks.
	streamsCount := 4*MiniblockCandidateBatchSize - 5
	genesisBlocks := tc.allocateStreams(streamsCount)

	// add events to ~50% of the streams
	streamsWithEvents := make(map[StreamId]int)
	var mu sync.Mutex
	var wg sync.WaitGroup
	for streamID, genesis := range genesisBlocks {
		wg.Add(1)
		go func(streamID StreamId, genesis *Miniblock) {
			defer wg.Done()

			streamSync, err := streamCache.getStreamImpl(ctx, streamID, true)
			require.NoError(err, "get stream")

			// unload view for half of the streams
			if streamID[1]%2 == 1 {
				ss := streamSync
				ss.tryCleanup(time.Duration(0))
			}

			// only add events to half of the streams
			if streamID[2]%2 == 1 {
				return
			}

			// add several events to the stream
			numToAdd := 1 + int(streamID[3]%50)
			for i := range numToAdd {
				addEventToStream(t, ctx, streamCache.params, streamSync,
					fmt.Sprintf("msg# %d", i), &MiniblockRef{Hash: common.BytesToHash(genesis.Header.Hash), Num: 0})
			}

			mu.Lock()
			defer mu.Unlock()
			streamsWithEvents[streamID] = numToAdd
		}(streamID, genesis)
	}
	wg.Wait()

	if t.Failed() {
		t.FailNow()
	}

	require.Eventually(
		func() bool {
			// on block makes the stream cache to walk over streams and create miniblocks for those that are eligible
			btc.Commit(ctx)

			// quit loop when all added events are included in mini-blocks
			miniblocksProduced := 0
			for streamID := range genesisBlocks {
				stream, err := streamCache.GetStreamWaitForLocal(ctx, streamID)
				require.NoError(err, "get stream")
				view, err := stream.GetView(ctx)
				require.NoError(err, "get view")

				var (
					expStreamEventsCount = len(genesisBlocks[streamID].Events) + streamsWithEvents[streamID]
					gotStreamEventsCount = 0
				)

				syncCookie := view.SyncCookie(tc.getBC().Wallet.Address)
				require.NotNil(syncCookie, "sync cookie")

				miniblocks, _, err := stream.GetMiniblocks(ctx, 0, syncCookie.MinipoolGen)
				require.NoError(err, "get miniblocks")

				for _, mb := range miniblocks {
					gotStreamEventsCount += len(mb.Events)
				}

				if expStreamEventsCount == gotStreamEventsCount {
					miniblocksProduced++
				}
			}

			// all streams with events added have a new block after genesis
			return miniblocksProduced == len(genesisBlocks)
		},
		240*time.Second,
		100*time.Millisecond,
	)
}

func isCacheEmpty(streamCache *streamCacheImpl) bool {
	return streamCache.cache.Size() == 0
}

func cleanUpCache(streamCache *streamCacheImpl) bool {
	cleanedUp := true
	streamCache.cache.Range(func(key StreamId, streamVal *streamImpl) bool {
		cleanedUp = cleanedUp && streamVal.tryCleanup(0)
		return true
	})
	return cleanedUp
}

func areAllViewsDropped(streamCache *streamCacheImpl) bool {
	allDropped := true
	streamCache.cache.Range(func(key StreamId, streamVal *streamImpl) bool {
		st := streamVal.getStatus()
		allDropped = allDropped && !st.loaded
		return true
	})
	return allDropped
}

// TODO: temp disable flaky test. Passes locally, often fails on CI.
func Disabled_TestStreamUnloadWithSubscribers(t *testing.T) {
	require := require.New(t)
	ctx, tc := makeCacheTestContext(t, testParams{})

	// disable auto stream cache cleanup, do cleanup manually
	tc.btc.SetConfigValue(t, ctx, crypto.StreamCacheExpirationPollIntervalMsConfigKey, crypto.ABIEncodeUint64(0))

	// replace the default chain monitor to disable automatic mini-block production on new blocks in the stream cache
	// TODO: use options on MiniblockProducer instead
	tc.instances[0].params.ChainMonitor = crypto.NoopChainMonitor{}

	streamCache := tc.initCache(0, nil)

	require.True(isCacheEmpty(streamCache), "stream cache must be empty")

	const streamsCount = 5

	var (
		node                  = tc.getBC()
		genesisBlocks         = tc.allocateStreams(streamsCount)
		syncCookies           = make(map[StreamId]*SyncCookie)
		subscriptionReceivers = make(map[StreamId]*testStreamCacheViewEvictionSub)
	)

	// obtain sync cookies for allocated streams
	for streamID := range genesisBlocks {
		// get sync cookies so we can start from somewhere
		stream, err := streamCache.GetStreamWaitForLocal(ctx, streamID)
		require.NoError(err, "get stream")
		streamView, err := stream.GetView(ctx)
		require.NoError(err, "get view")
		syncCookies[streamID] = streamView.SyncCookie(node.Wallet.Address)
	}

	blockNum, err := node.GetBlockNumber(ctx)
	require.NoError(err, "get block number")
	tc.instances[0].params.AppliedBlockNum = blockNum

	// create fresh stream cache and subscribe
	streamCache = NewStreamCache(ctx, tc.instances[0].params)
	err = streamCache.Start(ctx)
	require.NoError(err, "instantiating stream cache")
	mpProducer := NewMiniblockProducer(ctx, streamCache, tc.btc.OnChainConfig, &MiniblockProducerOpts{TestDisableMbProdcutionOnBlock: true})

	for streamID, syncCookie := range syncCookies {
		streamSync, err := streamCache.GetStreamWaitForLocal(ctx, streamID)
		require.NoError(err, "get sync stream")
		subscriptionReceivers[streamID] = new(testStreamCacheViewEvictionSub)
		err = streamSync.Sub(ctx, syncCookie, subscriptionReceivers[streamID])
		require.NoError(err, "sub stream")
	}

	// when subscribing to a stream the view is loaded to validate the request. It can be dropped afterward.
	require.True(cleanUpCache(streamCache))
	require.True(areAllViewsDropped(streamCache))

	// add events to the first 2 streams and ensure that the receiver is notified even when the stream view is dropped.
	var (
		count                = 0
		streamsWithEvents    = make(map[StreamId]int)
		streamsWithoutEvents = make(map[StreamId]int)
	)

	for streamID, genesis := range genesisBlocks {
		count++
		if count < 2 {
			streamSync, err := streamCache.GetStreamWaitForLocal(ctx, streamID)
			require.NoError(err, "get sync stream")
			for i := 0; i < 1+int(streamID[3]%50); i++ {
				addEventToStream(t, ctx, streamCache.params, streamSync,
					fmt.Sprintf("msg# %d", i), &MiniblockRef{Hash: common.BytesToHash(genesis.Header.Hash), Num: 0})
			}
			streamsWithEvents[streamID] = 1 + int(streamID[3]%50)
		} else {
			streamsWithoutEvents[streamID] = 0
		}
	}

	// ensure that subscribers received events even when their view is dropped
	for streamID, expectedEventCount := range streamsWithEvents {
		subscriber := subscriptionReceivers[streamID]
		gotEventCount := subscriber.eventsReceived()
		require.Nilf(subscriber.receivedErrors, "subscriber received error: %s", subscriber.receivedErrors)
		require.Equal(expectedEventCount, gotEventCount, "subscriber unexpected event count")
	}

	// make all mini-blocks to process all events in minipool
	jobs := mpProducer.scheduleCandidates(ctx, blockNum)
	require.Eventually(
		func() bool { return mpProducer.testCheckAllDone(jobs) },
		240*time.Second,
		10*time.Millisecond,
	)

	// ensure that streams can be dropped again
	require.True(cleanUpCache(streamCache))

	// make sure that all views are dropped
	require.True(areAllViewsDropped(streamCache))
}

// TestMiniblockRegistrationWithPendingLocalCandidate tests that the node can recover from a situation where it tries to
// register a miniblock candidate but fails because the candidate was already registered but the confirmation receipt was
// missed before and therefore the candidate was never promoted.
func TestMiniblockRegistrationWithPendingLocalCandidate(t *testing.T) {
	ctx, tt := makeCacheTestContext(t, testParams{replFactor: 1})
	_ = tt.initCache(0, nil)
	require := require.New(t)
	instance := tt.instances[0]
	mbProducer := instance.mbProducer

	spaceStreamId := testutils.FakeStreamId(STREAM_SPACE_BIN)
	genesisMb := MakeGenesisMiniblockForSpaceStream(t, instance.params.Wallet, instance.params.Wallet, spaceStreamId)

	stream, view := tt.createStream(spaceStreamId, genesisMb.Proto)

	// advance the stream with some miniblocks
	for i := range 2 {
		addEventToStream(t, ctx, instance.params, stream, fmt.Sprintf("%d", i*2), view.LastBlock().Ref)
		addEventToStream(t, ctx, instance.params, stream, fmt.Sprintf("%d", 1+(i*2)), view.LastBlock().Ref)

		mb, err := mbProducer.TestMakeMiniblock(ctx, spaceStreamId, false)
		require.NoError(err)
		require.Equal(int64(i+1), mb.Num)
	}

	view, err := stream.GetView(ctx)
	require.NoError(err)
	lastBlock := view.LastBlock()

	// Pause cache event processing. The cache/mbProduces won't witness any events giving the test the
	// required control to simulate the scenario where the node misses stream update events.
	instance.cache.PauseEventProcessing()
	instance.mbProducer.PauseEventProcessing()

	// create a new candidate1 with 2 events in it.
	event1 := MakeEvent(
		t, instance.params.Wallet, Make_MemberPayload_Username(&EncryptedData{Ciphertext: "A"}), lastBlock.Ref)

	event2 := MakeEvent(
		t, instance.params.Wallet, Make_MemberPayload_Username(&EncryptedData{Ciphertext: "B"}), lastBlock.Ref)

	candidate1Header := &MiniblockHeader{
		MiniblockNum:             lastBlock.Ref.Num + 1,
		Timestamp:                NextMiniblockTimestamp(lastBlock.Header().Timestamp),
		EventHashes:              [][]byte{event1.Hash.Bytes(), event2.Hash.Bytes()},
		PrevMiniblockHash:        lastBlock.headerEvent.Hash[:],
		Snapshot:                 nil,
		EventNumOffset:           0,
		PrevSnapshotMiniblockNum: view.LastBlock().Header().GetPrevSnapshotMiniblockNum(),
		Content: &MiniblockHeader_None{
			None: &emptypb.Empty{},
		},
	}

	candidate1, err := NewMiniblockInfoFromHeaderAndParsed(
		instance.params.Wallet, candidate1Header, []*ParsedEvent{event1, event2})
	require.NoError(err)

	err = mbProduceCandidate_Save(ctx, instance.params, spaceStreamId, candidate1, []common.Address{})
	require.NoError(err)
	
	// register candidate1 in the stream facet and bypass the mini-block producer
	req := []river.SetMiniblock{{
		StreamId:          spaceStreamId,
		PrevMiniBlockHash: common.BytesToHash(candidate1Header.GetPrevMiniblockHash()),
		LastMiniblockHash: candidate1.Ref.Hash,
		LastMiniblockNum:  uint64(candidate1.Ref.Num),
		IsSealed:          false,
	}}

	success, invalidMiniBlocks, failed, err := instance.params.Registry.SetStreamLastMiniblockBatch(ctx, req)
	require.NoError(err)
	require.Equal([]StreamId{spaceStreamId}, success)
	require.Empty(invalidMiniBlocks)
	require.Empty(failed)

	// makes sure that stream advanced in stream facet to candidate but local stream is still on the prev mini-block
	riverChainBlockNum, err := instance.params.RiverChain.Client.BlockNumber(ctx)
	require.NoError(err)
	getStream, err := instance.params.Registry.GetStream(ctx, spaceStreamId, crypto.BlockNumber(riverChainBlockNum))
	require.NoError(err)

	require.Equal(int64(getStream.LastMiniblockNum), candidate1.Ref.Num)
	require.Equal(getStream.LastMiniblockHash, candidate1.Ref.Hash)

	view, err = stream.GetView(ctx)
	require.NoError(err)
	lastBlock = view.LastBlock()
	require.Equal(lastBlock.Ref.Num+1, int64(getStream.LastMiniblockNum))

	// Add some events to the stream and try produce a mini-block. This must fail because the
	// stream facet already progressed by the just registered candidate. The node must detect this
	// scenario and load the candidate from its storage and apply/promote it. After that the node
	// must be able to produce the next mini-block that contains the 3 events
	addEventToStream(t, ctx, instance.params, stream, "A", view.LastBlock().Ref)
	addEventToStream(t, ctx, instance.params, stream, "B", view.LastBlock().Ref)
	addEventToStream(t, ctx, instance.params, stream, "C", view.LastBlock().Ref)

	mb, err := mbProducer.TestMakeMiniblock(ctx, spaceStreamId, false)
	require.NoError(err)
	require.Equal(candidate1Header.MiniblockNum, mb.Num) // candidate was promoted

	view, err = stream.GetView(ctx)
	require.NoError(err)
	require.Equal(3, view.GetStats().EventsInMinipool)

	mb, err = mbProducer.TestMakeMiniblock(ctx, spaceStreamId, false)
	require.NoError(err)
	require.Equal(candidate1Header.MiniblockNum+1, mb.Num)

	view, err = stream.GetView(ctx)
	require.NoError(err)
	lastBlock = view.LastBlock()
	require.Equal(3, len(lastBlock.Events()))
}

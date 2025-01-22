package rpc

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/gammazero/workerpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/contracts/river"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	"github.com/river-build/river/core/node/registries"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
	"github.com/river-build/river/core/node/testutils"
	"github.com/river-build/river/core/node/testutils/dbtestutils"
	"github.com/river-build/river/core/node/testutils/testcert"
)

func fillUserSettingsStreamWithData(
	ctx context.Context,
	streamId StreamId,
	wallet *crypto.Wallet,
	client protocolconnect.StreamServiceClient,
	numMBs int,
	numEventsPerMB int,
	prevMB *MiniblockRef,
) (*MiniblockRef, error) {
	var err error
	for i := 0; i < numMBs; i++ {
		for j := 0; j < numEventsPerMB; j++ {
			err = addUserBlockedFillerEvent(ctx, wallet, client, streamId, prevMB)
			if err != nil {
				return nil, AsRiverError(
					err,
					Err_INTERNAL,
				).Message("Failed to add event to stream").
					Func("fillUserSettingsStreamWithData").
					Tag("streamId", streamId).
					Tag("miniblockNum", i).
					Tag("mbEventNum", j).
					Tag("numMbs", numMBs)
			}
		}
		prevMB, err = makeMiniblock(ctx, client, streamId, false, prevMB.Num)
		if err != nil {
			return nil, AsRiverError(
				err,
				Err_INTERNAL,
			).Message("Failed to create miniblock").
				Func("fillUserSettingsStreamWithData").
				Tag("streamId", streamId).
				Tag("miniblockNum", i).
				Tag("numMbs", numMBs)
		}
	}
	return prevMB, nil
}

func createUserSettingsStreamsWithData(
	ctx context.Context,
	client protocolconnect.StreamServiceClient,
	numStreams int,
	numMBs int,
	numEventsPerMB int,
) ([]*crypto.Wallet, []StreamId, error) {
	wallets := make([]*crypto.Wallet, numStreams)
	streamIds := make([]StreamId, numStreams)
	errChan := make(chan error, numStreams)

	wp := workerpool.New(10)

	for i := 0; i < numStreams; i++ {
		wp.Submit(func() {
			wallet, err := crypto.NewWallet(ctx)
			if err != nil {
				errChan <- err
				return
			}
			wallets[i] = wallet

			streamId, _, mbRef, err := createUserSettingsStream(
				ctx,
				wallet,
				client,
				&StreamSettings{DisableMiniblockCreation: true},
			)
			if err != nil {
				errChan <- AsRiverError(err, Err_INTERNAL).
					Message("Failed to create stream").
					Func("createUserSettingsStreamsWithData").
					Tag("streamNum", i).
					Tag("streamId", streamId)
				return
			}
			streamIds[i] = streamId

			_, err = fillUserSettingsStreamWithData(ctx, streamId, wallet, client, numMBs, numEventsPerMB, mbRef)
			if err != nil {
				errChan <- AsRiverError(err, Err_INTERNAL).
					Message("Failed to fill stream with data").
					Func("createUserSettingsStreamsWithData").
					Tag("streamNum", i).
					Tag("streamId", streamId)
				return
			}
		})
	}

	wp.StopWait()

	if len(errChan) > 0 {
		return nil, nil, <-errChan
	}
	return wallets, streamIds, nil
}

func compareStreamMiniblocks(
	t *testing.T,
	ctx context.Context,
	streamId StreamId,
	storage storage.StreamStorage,
	client protocolconnect.StreamServiceClient,
) error {
	maxMB, err := storage.GetMaxArchivedMiniblockNumber(ctx, streamId)
	if err != nil {
		return err
	}

	numResp, err := client.GetLastMiniblockHash(ctx, connect.NewRequest(&GetLastMiniblockHashRequest{
		StreamId: streamId[:],
	}))
	if err != nil {
		return err
	}

	if numResp.Msg.MiniblockNum != maxMB {
		return RiverError(
			Err_INTERNAL,
			"Remote mb num is not the same as local",
			"streamId", streamId,
			"localMB", maxMB,
			"remoteMB", numResp.Msg.MiniblockNum,
		)
	}

	miniblocks, err := storage.ReadMiniblocks(ctx, streamId, 0, maxMB+1)
	if err != nil {
		return err
	}

	mbResp, err := client.GetMiniblocks(ctx, connect.NewRequest(&GetMiniblocksRequest{
		StreamId:      streamId[:],
		FromInclusive: 0,
		ToExclusive:   numResp.Msg.MiniblockNum + 1,
	}))
	if err != nil {
		return err
	}

	if len(mbResp.Msg.Miniblocks) != len(miniblocks) {
		return RiverError(
			Err_INTERNAL,
			"Read different num of mbs remotly and locally",
			"streamId", streamId,
			"localMB len", len(miniblocks),
			"remoteMB len", len(mbResp.Msg.Miniblocks),
		)
	}

	for i, mb := range miniblocks {
		info, err := events.NewMiniblockInfoFromBytesWithOpts(
			mb,
			events.NewParsedMiniblockInfoOpts().
				WithExpectedBlockNumber(int64(i)).
				WithDoNotParseEvents(true),
		)
		if err != nil {
			return err
		}
		if !assert.EqualExportedValues(t, info.Proto, mbResp.Msg.Miniblocks[i]) {
			return RiverError(
				Err_INTERNAL,
				"Miniblocks are not the same",
				"streamId", streamId,
				"mbNum", i,
			)
		}
	}
	return nil
}

func compareStreamsMiniblocks(
	t *testing.T,
	ctx context.Context,
	streamId []StreamId,
	storage storage.StreamStorage,
	client protocolconnect.StreamServiceClient,
) error {
	errs := make(chan error, len(streamId))
	var wg sync.WaitGroup
	for _, id := range streamId {
		wg.Add(1)
		go func(streamId StreamId) {
			defer wg.Done()
			err := compareStreamMiniblocks(t, ctx, streamId, storage, client)
			if err != nil {
				errs <- err
			}
		}(id)
	}
	wg.Wait()
	if len(errs) > 0 {
		return <-errs
	}
	return nil
}

// requireNoCorruptStreams confirms that the scrubber detected no corrupt streams.
// Call after the archiver has downloaded all of the latest miniblocks.
func requireNoCorruptStreams(
	name string,
	t *testing.T,
	ctx context.Context,
	require *require.Assertions,
	archiver *Archiver,
) {
	// Validate no corrupt streams were found
	require.Eventually(
		func() bool {
			unscrubbed := archiver.debugGetUnscrubbedMiniblocksCount()
			return unscrubbed == 0
		},
		20*time.Second,
		time.Second,
		"Scrubber failed to catch up: %d unscrubbed miniblocks",
		archiver.debugGetUnscrubbedMiniblocksCount(),
	)
	require.Len(archiver.GetCorruptStreams(ctx), 0)
}

func TestArchive100StreamsWithReplication(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 5, replicationFactor: 3, start: true})
	ctx := tester.ctx
	require := tester.require

	// Create stream
	// Create 100 streams
	streamIds := testCreate100Streams(
		ctx,
		require,
		tester.testClient(0),
		&StreamSettings{DisableMiniblockCreation: true},
	)

	// Kill 2/5 nodes. With a replication factor of 3, all streams are available on at least 1 node.
	tester.nodes[1].Close(ctx, tester.dbUrl)
	tester.nodes[3].Close(ctx, tester.dbUrl)

	archiveCfg := tester.getConfig()
	archiveCfg.Archive.ArchiveId = "arch" + GenShortNanoid()

	serverCtx, serverCancel := context.WithCancel(ctx)
	defer serverCancel()

	arch, err := StartServerInArchiveMode(
		serverCtx,
		archiveCfg,
		makeTestServerOpts(tester),
		false,
	)
	require.NoError(err)
	tester.cleanup(arch.Close)

	arch.Archiver.WaitForStart()
	require.Len(arch.ExitSignal(), 0)

	require.EventuallyWithT(
		func(c *assert.CollectT) {
			for _, streamId := range streamIds {
				num, err := arch.Storage().GetMaxArchivedMiniblockNumber(ctx, streamId)
				assert.NoError(c, err)
				expectedMaxBlockNum := int64(0)
				// The first stream id is a user stream with 2 miniblocks. The rest are
				// space streams with a single block.
				if streamId == streamIds[0] {
					expectedMaxBlockNum = int64(1)
				}
				assert.Equal(
					c,
					expectedMaxBlockNum,
					num,
					fmt.Sprintf("Expected %d but saw %d miniblocks for stream %s", 0, num, streamId),
				)
			}
		},
		30*time.Second,
		100*time.Millisecond,
	)

	require.NoError(compareStreamsMiniblocks(t, ctx, streamIds, arch.Storage(), tester.testClient(0)))
	requireNoCorruptStreams("TestArchive100StreamsWithReplication", t, ctx, require, arch.Archiver)
}

func TestArchiveOneStream(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	ctx := tester.ctx
	require := tester.require

	// Create stream
	client := tester.testClient(0)
	wallet, err := crypto.NewWallet(ctx)
	require.NoError(err)
	streamId, _, _, err := createUserSettingsStream(
		ctx,
		wallet,
		client,
		&StreamSettings{DisableMiniblockCreation: true},
	)
	require.NoError(err)

	archiveCfg := tester.getConfig()
	archiveCfg.Archive.ArchiveId = "arch" + GenShortNanoid()
	archiveCfg.Archive.ReadMiniblocksSize = 3

	bc := tester.btc.NewWalletAndBlockchain(ctx)

	registryContract, err := registries.NewRiverRegistryContract(
		ctx,
		bc,
		&archiveCfg.RegistryContract,
		&archiveCfg.RiverRegistry,
	)
	require.NoError(err)

	httpClient, _ := testcert.GetHttp2LocalhostTLSClient(ctx, nil)
	var nodeRegistry nodes.NodeRegistry
	nodeRegistry, err = nodes.LoadNodeRegistry(
		ctx,
		registryContract,
		common.Address{},
		bc.InitialBlockNum,
		bc.ChainMonitor,
		httpClient,
		nil,
	)
	require.NoError(err)

	dbCfg, schema, schemaDeleter, err := dbtestutils.ConfigureDB(ctx)
	require.NoError(err)
	defer schemaDeleter()

	pool, err := storage.CreateAndValidatePgxPool(ctx, dbCfg, schema, nil)
	require.NoError(err)
	tester.cleanup(pool.Pool.Close)
	tester.cleanup(pool.StreamingPool.Close)

	streamStorage, err := storage.NewPostgresStreamStore(
		ctx,
		pool,
		GenShortNanoid(),
		make(chan error, 1),
		infra.NewMetricsFactory(nil, "", ""),
	)
	require.NoError(err)

	arch := NewArchiver(&archiveCfg.Archive, registryContract, nodeRegistry, streamStorage)

	callOpts := &bind.CallOpts{
		Context: ctx,
	}

	streamRecord, err := registryContract.StreamRegistry.GetStream(callOpts, streamId)
	require.NoError(err)
	require.Zero(streamRecord.LastMiniblockNum) // Only genesis miniblock is created

	err = arch.ArchiveStream(
		ctx,
		NewArchiveStream(
			streamId,
			&streamRecord.Nodes,
			streamRecord.LastMiniblockNum,
			arch.config.GetMaxConsecutiveFailedUpdates(),
		),
	)
	require.NoError(err)

	num, err := streamStorage.GetMaxArchivedMiniblockNumber(ctx, streamId)
	require.NoError(err)
	require.Zero(num) // Only genesis miniblock is created

	// Add event to the stream, create miniblock, and archive it
	err = addUserBlockedFillerEvent(ctx, wallet, client, streamId, river.MiniblockRefFromContractRecord(&streamRecord))
	require.NoError(err)

	mbRef, err := makeMiniblock(ctx, client, streamId, false, 0)
	require.NoError(err)

	streamRecord, err = registryContract.StreamRegistry.GetStream(callOpts, streamId)
	require.NoError(err)
	require.Equal(uint64(1), streamRecord.LastMiniblockNum)

	err = arch.ArchiveStream(
		ctx,
		NewArchiveStream(
			streamId,
			&streamRecord.Nodes,
			streamRecord.LastMiniblockNum,
			arch.config.GetMaxConsecutiveFailedUpdates(),
		),
	)
	require.NoError(err)

	num, err = streamStorage.GetMaxArchivedMiniblockNumber(ctx, streamId)
	require.NoError(err)
	require.Equal(int64(1), num)

	// Test pagination: create at least 10 miniblocks.
	_, err = fillUserSettingsStreamWithData(ctx, streamId, wallet, client, 10, 5, mbRef)
	require.NoError(err)

	streamRecord, err = registryContract.StreamRegistry.GetStream(callOpts, streamId)
	require.NoError(err)
	require.GreaterOrEqual(streamRecord.LastMiniblockNum, uint64(10))

	err = arch.ArchiveStream(
		ctx,
		NewArchiveStream(
			streamId,
			&streamRecord.Nodes,
			streamRecord.LastMiniblockNum,
			arch.config.GetMaxConsecutiveFailedUpdates(),
		),
	)
	require.NoError(err)

	num, err = streamStorage.GetMaxArchivedMiniblockNumber(ctx, streamId)
	require.NoError(err)
	require.Equal(int64(streamRecord.LastMiniblockNum), num)

	require.NoError(compareStreamMiniblocks(t, ctx, streamId, streamStorage, client))
}

func makeTestServerOpts(tester *serviceTester) *ServerStartOpts {
	listener, _ := tester.makeTestListener()
	return &ServerStartOpts{
		RiverChain:      tester.btc.NewWalletAndBlockchain(tester.ctx),
		Listener:        listener,
		HttpClientMaker: testcert.GetHttp2LocalhostTLSClient,
	}
}

func TestArchive100Streams(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 10, start: true})
	ctx := tester.ctx
	require := tester.require

	// Create 100 streams
	streamIds := testCreate100Streams(
		ctx,
		require,
		tester.testClient(0),
		&StreamSettings{DisableMiniblockCreation: true},
	)

	archiveCfg := tester.getConfig()
	archiveCfg.Archive.ArchiveId = "arch" + GenShortNanoid()

	serverCtx, serverCancel := context.WithCancel(ctx)
	arch, err := StartServerInArchiveMode(
		serverCtx,
		archiveCfg,
		makeTestServerOpts(tester),
		true,
	)
	require.NoError(err)
	tester.cleanup(arch.Close)

	arch.Archiver.WaitForStart()
	require.Len(arch.ExitSignal(), 0)

	arch.Archiver.WaitForTasks()

	require.NoError(compareStreamsMiniblocks(t, ctx, streamIds, arch.Storage(), tester.testClient(3)))
	requireNoCorruptStreams("TestArchive100Streams", t, ctx, require, arch.Archiver)

	serverCancel()
	arch.Archiver.WaitForWorkers()

	stats := arch.Archiver.GetStats()
	require.Equal(uint64(100), stats.StreamsExamined)
	require.GreaterOrEqual(stats.SuccessOpsCount, uint64(100))
	require.Zero(stats.FailedOpsCount)
}

func TestArchive100StreamsWithData(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 10, start: true})
	ctx := tester.ctx
	require := tester.require

	_, streamIds, err := createUserSettingsStreamsWithData(ctx, tester.testClient(0), 100, 10, 5)
	require.NoError(err)

	archiveCfg := tester.getConfig()
	archiveCfg.Archive.ArchiveId = "arch" + GenShortNanoid()
	archiveCfg.Archive.ReadMiniblocksSize = 3

	serverCtx, serverCancel := context.WithCancel(ctx)
	arch, err := StartServerInArchiveMode(serverCtx, archiveCfg, makeTestServerOpts(tester), true)
	require.NoError(err)
	tester.cleanup(arch.Close)

	arch.Archiver.WaitForStart()
	require.Len(arch.ExitSignal(), 0)

	arch.Archiver.WaitForTasks()

	require.NoError(compareStreamsMiniblocks(t, ctx, streamIds, arch.Storage(), tester.testClient(5)))
	requireNoCorruptStreams("TestArchive100StreamsWithData", t, ctx, require, arch.Archiver)

	serverCancel()
	arch.Archiver.WaitForWorkers()

	stats := arch.Archiver.GetStats()
	require.Equal(uint64(100), stats.StreamsExamined)
	require.GreaterOrEqual(stats.SuccessOpsCount, uint64(100))
	require.Zero(stats.FailedOpsCount)
}

func createCorruptStreams(
	ctx context.Context,
	require *require.Assertions,
	wallet *crypto.Wallet,
	client protocolconnect.StreamServiceClient,
	store storage.StreamStorage,
) []StreamId {
	corruptionFuncs := []corruptMiniblockBytesFunc{
		invalidatePrevMiniblockHash,
		invalidateEventNumOffset,
		invalidateBlockTimestamp,
		invalidatePrevSnapshotBlockNum,
		invalidateBlockHeaderEventLength,
		invalidateEventHash,
		invalidateBlockHeaderType,
		invalidateMiniblockUnparsable,
		invalidateBlockNumber,
		mismatchEventHash,
	}

	streamIds := make([]StreamId, len(corruptionFuncs))
	for i, corruptMb := range corruptionFuncs {
		streamId, mb1, blocks := createMultiblockChannelStream(ctx, require, client, store)
		blocks[1] = corruptMb(require, wallet, blocks[1])
		writeStreamBackToStore(ctx, require, store, streamId, mb1, blocks)
		streamIds[i] = streamId
	}

	return streamIds
}

func TestArchive20StreamsWithCorruption(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	ctx := tester.ctx
	require := tester.require

	_, userStreamIds, err := createUserSettingsStreamsWithData(ctx, tester.testClient(0), 10, 10, 5)
	require.NoError(err)

	corruptStreamIds := createCorruptStreams(
		ctx,
		require,
		tester.nodes[0].service.wallet,
		tester.testClient(0),
		tester.nodes[0].service.storage,
	)

	archiveCfg := tester.getConfig()
	archiveCfg.Archive.ArchiveId = "arch" + GenShortNanoid()
	archiveCfg.Archive.ReadMiniblocksSize = 10
	archiveCfg.Archive.MaxFailedConsecutiveUpdates = 1

	serverCtx, serverCancel := context.WithCancel(ctx)
	defer serverCancel()

	arch, err := StartServerInArchiveMode(serverCtx, archiveCfg, makeTestServerOpts(tester), false)
	require.NoError(err)
	tester.cleanup(arch.Close)

	arch.Archiver.WaitForStart()
	require.Len(arch.ExitSignal(), 0)

	require.EventuallyWithT(
		func(c *assert.CollectT) {
			for _, streamId := range userStreamIds {
				num, err := arch.Storage().GetMaxArchivedMiniblockNumber(ctx, streamId)
				assert.NoError(c, err, "stream %v getMaxArchivedMiniblockNumber", streamId)
				assert.Equal(c, int64(10), num, "stream %v behind", streamId)
			}
		},
		10*time.Second,
		10*time.Millisecond,
	)
	// Validate storage contents
	require.NoError(compareStreamsMiniblocks(t, ctx, userStreamIds, arch.Storage(), tester.testClient(0)))

	require.EventuallyWithT(
		func(c *assert.CollectT) {
			corruptStreams := arch.Archiver.GetCorruptStreams(ctx)
			assert.Len(c, corruptStreams, 10)
			corruptStreamsSet := map[StreamId]struct{}{}
			for _, record := range corruptStreams {
				corruptStreamsSet[record.StreamId] = struct{}{}
			}
			for _, streamId := range corruptStreamIds {
				_, ok := corruptStreamsSet[streamId]
				assert.True(c, ok, "Stream not in corrupt stream set: %v", streamId)
			}
		},
		10*time.Second,
		10*time.Millisecond,
	)
}

func TestArchiveContinuous(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	ctx := tester.ctx
	require := tester.require

	client := tester.testClient(0)
	wallet, err := crypto.NewWallet(ctx)
	require.NoError(err)
	streamId, _, mbRef, err := createUserSettingsStream(
		ctx,
		wallet,
		client,
		&StreamSettings{DisableMiniblockCreation: true},
	)
	require.NoError(err)

	archiveCfg := tester.getConfig()
	archiveCfg.Archive.ArchiveId = "arch" + GenShortNanoid()
	archiveCfg.Archive.ReadMiniblocksSize = 3

	serverCtx, serverCancel := context.WithCancel(ctx)
	arch, err := StartServerInArchiveMode(serverCtx, archiveCfg, makeTestServerOpts(tester), false)
	require.NoError(err)
	tester.cleanup(arch.Close)
	arch.Archiver.WaitForStart()
	require.Len(arch.ExitSignal(), 0)

	status := tester.httpGet("https://" + arch.listener.Addr().String() + "/status")
	require.Contains(status, "OK")

	require.EventuallyWithT(
		func(c *assert.CollectT) {
			num, err := arch.Storage().GetMaxArchivedMiniblockNumber(ctx, streamId)
			assert.NoError(c, err)
			assert.Zero(c, num)
		},
		10*time.Second,
		10*time.Millisecond,
	)

	lastMB, err := fillUserSettingsStreamWithData(ctx, streamId, wallet, client, 10, 5, mbRef)
	require.NoError(err)

	require.EventuallyWithT(
		func(c *assert.CollectT) {
			num, err := arch.Storage().GetMaxArchivedMiniblockNumber(ctx, streamId)
			assert.NoError(c, err)
			assert.Equal(c, lastMB.Num, num)
		},
		10*time.Second,
		10*time.Millisecond,
	)

	client2 := tester.testClient(0)
	wallet2, err := crypto.NewWallet(ctx)
	require.NoError(err)
	streamId2, _, mbRef2, err := createUserSettingsStream(
		ctx,
		wallet2,
		client2,
		&StreamSettings{DisableMiniblockCreation: true},
	)
	require.NoError(err)
	lastMB2, err := fillUserSettingsStreamWithData(ctx, streamId2, wallet2, client2, 10, 5, mbRef2)
	require.NoError(err)

	require.EventuallyWithT(
		func(c *assert.CollectT) {
			num, err := arch.Storage().GetMaxArchivedMiniblockNumber(ctx, streamId2)
			assert.NoError(c, err)
			assert.Equal(c, lastMB2.Num, num)
		},
		15*time.Second,
		10*time.Millisecond,
	)

	require.NoError(compareStreamsMiniblocks(t, ctx, []StreamId{streamId, streamId2}, arch.Storage(), client))
	requireNoCorruptStreams("TestArchiveContinuous", t, ctx, require, arch.Archiver)

	serverCancel()
	arch.Archiver.WaitForWorkers()

	stats := arch.Archiver.GetStats()
	require.Equal(uint64(2), stats.StreamsExamined)
	require.Zero(stats.FailedOpsCount)
}

func requireStreamNotCorrupt(require *require.Assertions, ct *StreamCorruptionTracker) {
	require.False(ct.IsCorrupt())
	require.Equal(NotCorrupt, ct.GetCorruptionReason())
	require.Nil(ct.GetScrubError())
	require.Equal(int64(-1), ct.GetFirstCorruptBlock())
}

func requireStreamFetchCorruption(require *require.Assertions, ct *StreamCorruptionTracker, firstCorruptBlock int64) {
	require.True(ct.IsCorrupt())
	require.Equal(FetchFailed, ct.GetCorruptionReason())
	require.Nil(ct.GetScrubError())
	require.Equal(firstCorruptBlock, ct.GetFirstCorruptBlock())
	require.Equal(firstCorruptBlock-1, ct.lastUpdatedBlock)
}

func requireStreamScrubCorruption(
	require *require.Assertions,
	ct *StreamCorruptionTracker,
	firstCorruptBlock int64,
	errorMsg string,
) {
	require.True(ct.IsCorrupt())
	require.Equal(ScrubFailed, ct.GetCorruptionReason())
	require.ErrorContains(ct.GetScrubError(), errorMsg)
	require.Equal(firstCorruptBlock, ct.GetFirstCorruptBlock())
	require.Equal(firstCorruptBlock-1, ct.GetLatestScrubbedBlock())
}

func TestCorruptionTracker(t *testing.T) {
	maxFailedConsecutiveUpdates := uint32(50)
	ctx := context.Background()
	stream := NewArchiveStream(
		testutils.FakeStreamId(STREAM_SPACE_BIN),
		&[]common.Address{},
		0,
		maxFailedConsecutiveUpdates,
	)
	ct := NewStreamCorruptionTracker(maxFailedConsecutiveUpdates)
	ct.SetParent(stream)

	require := require.New(t)

	// Default state
	requireStreamNotCorrupt(require, &ct)

	// Must fail to update >= maxFailedConsecutiveUpdates in order for a block to be considered
	// corrupt
	for range maxFailedConsecutiveUpdates - 1 {
		ct.RecordBlockUpdateFailure(ctx, nil)
		requireStreamNotCorrupt(require, &ct)
	}

	// Calling this method will reset the internal failure counter
	ct.ReportBlockUpdateSuccess(ctx)

	// After maxFailedConsecutiveUpdates failures to update past the current block number,
	// we should consider this block corrupt
	for range maxFailedConsecutiveUpdates {
		requireStreamNotCorrupt(require, &ct)
		ct.RecordBlockUpdateFailure(ctx, nil)
	}

	requireStreamFetchCorruption(require, &ct, 0)

	// Resetting a tracker that was marked corrupted due to being
	// unavailable will reset the trcker to a non-corrupt state.
	ct.ReportBlockUpdateSuccess(ctx)

	requireStreamNotCorrupt(require, &ct)

	// As long as the underlying number of local blocks of the stream is changing, a block
	// update failure should not increment the internal counter that causes the stream to
	// be considered corrupt.
	for range 5 * maxFailedConsecutiveUpdates {
		stream.numBlocksInDb.Add(1)
		ct.RecordBlockUpdateFailure(ctx, nil)

		requireStreamNotCorrupt(require, &ct)
	}

	// Report scrub successes. Latest scrubbed block is monotonically non-decreasing.
	// (there may be multiple scrubs in progress for a single stream, so we always
	// keep the latest block marked clean.)
	require.NoError(ct.ReportScrubSuccess(ctx, 0))
	require.Equal(int64(0), ct.GetLatestScrubbedBlock())

	require.NoError(ct.ReportScrubSuccess(ctx, 2))
	require.Equal(int64(2), ct.GetLatestScrubbedBlock())

	// Reporting a block as successful that we've already passed is a no-op
	require.NoError(ct.ReportScrubSuccess(ctx, 1))
	require.Equal(int64(2), ct.GetLatestScrubbedBlock())

	require.NoError(ct.ReportScrubSuccess(ctx, 3))
	require.Equal(int64(3), ct.GetLatestScrubbedBlock())

	// Sanity check
	requireStreamNotCorrupt(require, &ct)

	// Marking a block as corrupt that we've already reported as well-formed will return
	// an error
	err := ct.MarkBlockCorrupt(1, fmt.Errorf("scrub error block 1"))
	require.ErrorContains(err, "corrupt block was already marked well-formed")

	// In this case, the stream corruption tracker state doesn't change
	require.Equal(int64(3), ct.GetLatestScrubbedBlock())
	requireStreamNotCorrupt(require, &ct)

	// Mark the stream as corrupt with a block that is more recent than the last scrubbed block.
	// Note: if we mark the stream as corrupt due to a scrub failure, it should not be affected
	// by resets.
	require.Nil(ct.MarkBlockCorrupt(5, fmt.Errorf("scrub error block 5")))
	requireStreamScrubCorruption(require, &ct, 5, "scrub error block 5")

	// We cannot go back in time to mark a block as corrupt. The tracker requires that the user
	// run the scrubber from the lowest block number that has not yet been scrubbed, and it disallows
	// reporting a corrupt block that has already been marked as well-formed.
	err = ct.MarkBlockCorrupt(4, fmt.Errorf("scrub error block 4"))
	require.ErrorContains(err, "corrupt block was already marked well-formed")

	// No state change to the corruption tracker
	requireStreamScrubCorruption(require, &ct, 5, "scrub error block 5")

	// Once a scrub error has been reported, reporting block unavailability makes no difference.
	for range maxFailedConsecutiveUpdates {
		ct.RecordBlockUpdateFailure(ctx, nil)
	}
	requireStreamScrubCorruption(require, &ct, 5, "scrub error block 5")

	// Likewise clearing the update failure counter does not affect the scrub error.
	ct.ReportBlockUpdateSuccess(ctx)
	requireStreamScrubCorruption(require, &ct, 5, "scrub error block 5")

	// If a stream mark corrupt due to persistent unavailability, and then is marked corrupt due
	// to a scrub failure, it cannot be reset.
	stream = NewArchiveStream(
		testutils.FakeStreamId(STREAM_SPACE_BIN),
		&[]common.Address{},
		0,
		maxFailedConsecutiveUpdates,
	)
	stream.numBlocksInDb.Store(50)
	ct = NewStreamCorruptionTracker(maxFailedConsecutiveUpdates)
	ct.SetParent(stream)

	for range maxFailedConsecutiveUpdates {
		ct.RecordBlockUpdateFailure(ctx, nil)
	}

	requireStreamFetchCorruption(require, &ct, 50)

	require.NoError(ct.MarkBlockCorrupt(25, fmt.Errorf("scrub error block 25")))
	requireStreamScrubCorruption(require, &ct, 25, "scrub error block 25")

	ct.ReportBlockUpdateSuccess(ctx)
	requireStreamScrubCorruption(require, &ct, 25, "scrub error block 25")
}

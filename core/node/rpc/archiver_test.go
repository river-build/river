package rpc

import (
	"context"
	"sync"
	"testing"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"

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
					Func("fillUserSettingsStreamWithData")
			}
		}
		prevMB, err = makeMiniblock(ctx, client, streamId, false, prevMB.Num)
		if err != nil {
			return nil, AsRiverError(
				err,
				Err_INTERNAL,
			).Message("Failed to create miniblock").
				Func("fillUserSettingsStreamWithData")
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

	var wg sync.WaitGroup
	wg.Add(numStreams)

	for i := 0; i < numStreams; i++ {
		go func(i int) {
			defer wg.Done()
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
				errChan <- AsRiverError(err, Err_INTERNAL).Message("Failed to create stream").Func("createUserSettingsStreamsWithData")
				return
			}
			streamIds[i] = streamId

			_, err = fillUserSettingsStreamWithData(ctx, streamId, wallet, client, numMBs, numEventsPerMB, mbRef)
			if err != nil {
				errChan <- AsRiverError(err, Err_INTERNAL).Message("Failed to fill stream with data").Func("createUserSettingsStreamsWithData")
				return
			}
		}(i)
	}

	wg.Wait()
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
			events.NewMiniblockInfoFromProtoOpts{
				ExpectedBlockNumber: int64(i),
				DontParseEvents:     true,
			},
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
		NewArchiveStream(streamId, &streamRecord.Nodes, streamRecord.LastMiniblockNum),
	)
	require.NoError(err)

	num, err := streamStorage.GetMaxArchivedMiniblockNumber(ctx, streamId)
	require.NoError(err)
	require.Zero(num) // Only genesis miniblock is created

	// Add event to the stream, create miniblock, and archive it
	err = addUserBlockedFillerEvent(ctx, wallet, client, streamId, MiniblockRefFromContractRecord(&streamRecord))
	require.NoError(err)

	mbRef, err := makeMiniblock(ctx, client, streamId, false, 0)
	require.NoError(err)

	streamRecord, err = registryContract.StreamRegistry.GetStream(callOpts, streamId)
	require.NoError(err)
	require.Equal(uint64(1), streamRecord.LastMiniblockNum)

	err = arch.ArchiveStream(
		ctx,
		NewArchiveStream(streamId, &streamRecord.Nodes, streamRecord.LastMiniblockNum),
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
		NewArchiveStream(streamId, &streamRecord.Nodes, streamRecord.LastMiniblockNum),
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

	serverCancel()
	arch.Archiver.WaitForWorkers()

	stats := arch.Archiver.GetStats()
	require.Equal(uint64(100), stats.StreamsExamined)
	require.GreaterOrEqual(stats.SuccessOpsCount, uint64(100))
	require.Zero(stats.FailedOpsCount)
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
		10*time.Second,
		10*time.Millisecond,
	)

	require.NoError(compareStreamsMiniblocks(t, ctx, []StreamId{streamId, streamId2}, arch.Storage(), client))

	serverCancel()
	arch.Archiver.WaitForWorkers()

	stats := arch.Archiver.GetStats()
	require.Equal(uint64(2), stats.StreamsExamined)
	require.Zero(stats.FailedOpsCount)
}

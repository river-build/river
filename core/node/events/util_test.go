package events

import (
	"context"
	"sync"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/proto"

	"github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/base/test"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/infra"
	. "github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
	"github.com/river-build/river/core/node/testutils"
)

type cacheTestContext struct {
	testParams   testParams
	t            *testing.T
	ctx          context.Context
	require      *require.Assertions
	btc          *crypto.BlockchainTestContext
	clientWallet *crypto.Wallet

	instances       []*cacheTestInstance
	instancesByAddr map[common.Address]*cacheTestInstance
}

var _ RemoteMiniblockProvider = (*cacheTestContext)(nil)

type cacheTestInstance struct {
	params         *StreamCacheParams
	streamRegistry StreamRegistry
	cache          *streamCacheImpl
	mbProducer     *miniblockProducer
}

type testParams struct {
	replFactor                    int
	mediaMaxChunkCount            int
	mediaMaxChunkSize             int
	recencyConstraintsGenerations int
	recencyConstraintsAgeSec      int
	defaultMinEventsPerSnapshot   int

	disableMineOnTx bool
	numInstances    int
}

// makeCacheTestContext creates a test context with a blockchain and a stream registry for stream cache tests.
// It doesn't create a stream cache itself. Call initCache to create a stream cache.
func makeCacheTestContext(t *testing.T, p testParams) (context.Context, *cacheTestContext) {
	t.Parallel()

	if p.numInstances <= 0 {
		p.numInstances = 1
	}

	ctx, cancel := test.NewTestContext()
	t.Cleanup(cancel)

	ctc := &cacheTestContext{
		testParams:      p,
		t:               t,
		ctx:             ctx,
		require:         require.New(t),
		instancesByAddr: make(map[common.Address]*cacheTestInstance),
	}

	clientWallet, err := crypto.NewWallet(ctx)
	ctc.require.NoError(err)
	ctc.clientWallet = clientWallet

	btc, err := crypto.NewBlockchainTestContext(
		ctx,
		crypto.TestParams{NumKeys: p.numInstances, MineOnTx: !p.disableMineOnTx, AutoMine: true},
	)
	ctc.require.NoError(err)
	ctc.btc = btc
	t.Cleanup(btc.Close)

	setOnChainStreamConfig(t, ctx, btc, p)

	for i := range p.numInstances {
		ctc.require.NoError(btc.InitNodeRecord(ctx, i, "fakeurl"))

		bc := btc.GetBlockchain(ctx, i)
		bc.StartChainMonitor(ctx)

		streamStore := storage.NewTestStreamStore(ctx)
		t.Cleanup(streamStore.Close)

		cfg := btc.RegistryConfig()
		registry, err := registries.NewRiverRegistryContract(ctx, bc, &cfg)
		ctc.require.NoError(err)

		blockNumber := btc.BlockNum(ctx)

		nr, err := LoadNodeRegistry(ctx, registry, bc.Wallet.Address, blockNumber, bc.ChainMonitor, nil)
		ctc.require.NoError(err)

		sr := NewStreamRegistry(bc.Wallet.Address, nr, registry, btc.OnChainConfig)

		params := &StreamCacheParams{
			Storage:                 streamStore.Storage,
			Wallet:                  bc.Wallet,
			RiverChain:              bc,
			Registry:                registry,
			ChainConfig:             btc.OnChainConfig,
			AppliedBlockNum:         blockNumber,
			ChainMonitor:            bc.ChainMonitor,
			Metrics:                 infra.NewMetricsFactory(nil, "", ""),
			RemoteMiniblockProvider: ctc,
		}

		inst := &cacheTestInstance{
			params:         params,
			streamRegistry: sr,
		}
		ctc.instances = append(ctc.instances, inst)
		ctc.instancesByAddr[bc.Wallet.Address] = inst
	}

	return ctx, ctc
}

func (ctc *cacheTestContext) initCache(n int, opts *MiniblockProducerOpts) *streamCacheImpl {
	streamCache, err := NewStreamCache(ctc.ctx, ctc.instances[n].params)
	ctc.require.NoError(err)
	ctc.instances[n].cache = streamCache
	ctc.instances[n].mbProducer = NewMiniblockProducer(ctc.ctx, streamCache, opts)
	return streamCache
}

func (ctc *cacheTestContext) initAllCaches(opts *MiniblockProducerOpts) {
	for i := range ctc.instances {
		_ = ctc.initCache(i, opts)
	}
}

func (ctc *cacheTestContext) createReplStream() (StreamId, []common.Address, []byte) {
	streamId := testutils.FakeStreamId(STREAM_USER_SETTINGS_BIN)
	mb := MakeGenesisMiniblockForUserSettingsStream(ctc.t, ctc.clientWallet, streamId)
	mbBytes, err := proto.Marshal(mb)
	ctc.require.NoError(err)

	nodes, err := ctc.instances[0].streamRegistry.AllocateStream(
		ctc.ctx,
		streamId,
		common.BytesToHash(mb.Header.Hash),
		mbBytes,
	)
	ctc.require.NoError(err)
	ctc.require.Len(nodes, ctc.testParams.replFactor)

	for _, n := range nodes {
		s, err := ctc.instancesByAddr[n].cache.GetStream(ctc.ctx, streamId)
		ctc.require.NoError(err)
		_, err = s.GetView(ctc.ctx)
		ctc.require.NoError(err)
	}

	return streamId, nodes, mb.Header.Hash
}

func (ctc *cacheTestContext) addReplEvent(streamId StreamId, prevMiniblockHash []byte, nodes []common.Address) {
	addr := crypto.GetTestAddress()
	ev, err := MakeParsedEventWithPayload(
		ctc.clientWallet,
		Make_UserSettingsPayload_UserBlock(
			&UserSettingsPayload_UserBlock{
				UserId:    addr[:],
				IsBlocked: true,
				EventNum:  22,
			},
		),
		prevMiniblockHash,
	)
	ctc.require.NoError(err)

	for _, n := range nodes {
		stream, err := ctc.instancesByAddr[n].cache.GetStream(ctc.ctx, streamId)
		ctc.require.NoError(err)

		err = stream.AddEvent(ctc.ctx, ev)
		ctc.require.NoError(err)
	}
}

// TODO: rename to allocateStream
func (ctc *cacheTestContext) createStreamNoCache(
	streamId StreamId,
	genesisMiniblock *Miniblock,
) {
	mbBytes, err := proto.Marshal(genesisMiniblock)
	ctc.require.NoError(err)

	_, err = ctc.instances[0].streamRegistry.AllocateStream(
		ctc.ctx,
		streamId,
		common.BytesToHash(genesisMiniblock.Header.Hash),
		mbBytes,
	)
	ctc.require.NoError(err)
}

// TODO: rename to createStreamInstance0
func (ctc *cacheTestContext) createStream(
	streamId StreamId,
	genesisMiniblock *Miniblock,
) (SyncStream, StreamView) {
	ctc.createStreamNoCache(streamId, genesisMiniblock)
	s, err := ctc.instances[0].cache.GetStream(ctc.ctx, streamId)
	ctc.require.NoError(err)
	v, err := s.GetView(ctc.ctx)
	ctc.require.NoError(err)
	return s, v
}

func (ctc *cacheTestContext) getBC() *crypto.Blockchain {
	return ctc.instances[0].params.RiverChain
}

func (ctc *cacheTestContext) allocateStreams(count int) map[StreamId]*Miniblock {
	genesisBlocks := make(map[StreamId]*Miniblock)
	var mu sync.Mutex

	var wg sync.WaitGroup
	wg.Add(count)
	for range count {
		go func() {
			defer wg.Done()

			streamID := testutils.FakeStreamId(STREAM_SPACE_BIN)
			mb := MakeGenesisMiniblockForSpaceStream(ctc.t, ctc.clientWallet, streamID)
			ctc.createStreamNoCache(streamID, mb)

			mu.Lock()
			defer mu.Unlock()
			genesisBlocks[streamID] = mb
		}()
	}
	wg.Wait()
	return genesisBlocks
}

func (ctc *cacheTestContext) makeMiniblock(inst int, streamId StreamId, forceSnapshot bool) (common.Hash, int64) {
	h, n, err := ctc.instances[inst].mbProducer.TestMakeMiniblock(ctc.ctx, streamId, forceSnapshot)
	ctc.require.NoError(err)
	return h, n
}

func (ctc *cacheTestContext) GetMbProposal(
	ctx context.Context,
	node common.Address,
	streamId StreamId,
	forceSnapshot bool,
) (*MiniblockProposal, error) {
	inst := ctc.instancesByAddr[node]

	stream, err := inst.cache.getStreamImpl(ctx, streamId)
	if err != nil {
		return nil, err
	}

	view, err := stream.getView(ctx)
	if err != nil {
		return nil, err
	}

	proposal, err := view.ProposeNextMiniblock(ctx, inst.params.ChainConfig.Get(), forceSnapshot)
	if err != nil {
		return nil, err
	}
	return proposal, nil
}

func (ctc *cacheTestContext) SaveMbCandidate(
	ctx context.Context,
	node common.Address,
	streamId StreamId,
	mb *Miniblock,
) error {
	inst := ctc.instancesByAddr[node]

	stream, err := inst.cache.getStreamImpl(ctx, streamId)
	if err != nil {
		return err
	}

	return stream.SaveMiniblockCandidate(ctx, mb)
}

// GetMiniBlocksStreamed returns a range of miniblocks from the given stream.
func (ctc *cacheTestContext) GetMbsStreamed(
	ctx context.Context,
	node common.Address,
	streamID StreamId,
	fromMiniBlockNum int64, // inclusive
	toMiniBlockNum int64, // exclusive
) <-chan *MbOrError {
	mbChanOrErr := make(chan *MbOrError)

	go func() {
		defer close(mbChanOrErr)

		for _, instance := range ctc.instances {
			if node == instance.params.Wallet.Address {
				streamAny, ok := instance.cache.cache.Load(streamID)
				if !ok {
					mbChanOrErr <- &MbOrError{
						Err: base.RiverError(Err_NOT_FOUND, "cacheTestContext::GetMbsStreamed stream not found"),
					}
					return
				}
				stream := streamAny.(*streamImpl)

				miniBlocks, _, err := stream.GetMiniblocks(ctx, fromMiniBlockNum, toMiniBlockNum)
				if err != nil {
					mbChanOrErr <- &MbOrError{Err: err}
					return
				}

				for _, miniBlock := range miniBlocks {
					mbChanOrErr <- &MbOrError{Miniblock: miniBlock}
				}
			}
		}
	}()

	return mbChanOrErr
}

func setOnChainStreamConfig(t *testing.T, ctx context.Context, btc *crypto.BlockchainTestContext, p testParams) {
	if p.replFactor != 0 {
		btc.SetConfigValue(
			t,
			ctx,
			crypto.StreamReplicationFactorConfigKey,
			crypto.ABIEncodeUint64(uint64(p.replFactor)),
		)
	}
	if p.mediaMaxChunkCount != 0 {
		btc.SetConfigValue(
			t,
			ctx,
			crypto.StreamMediaMaxChunkCountConfigKey,
			crypto.ABIEncodeUint64(uint64(p.mediaMaxChunkCount)),
		)
	}
	if p.mediaMaxChunkSize != 0 {
		btc.SetConfigValue(
			t,
			ctx,
			crypto.StreamMediaMaxChunkSizeConfigKey,
			crypto.ABIEncodeUint64(uint64(p.mediaMaxChunkSize)),
		)
	}
	if p.recencyConstraintsGenerations != 0 {
		btc.SetConfigValue(t, ctx,
			crypto.StreamRecencyConstraintsGenerationsConfigKey,
			crypto.ABIEncodeUint64(uint64(p.recencyConstraintsGenerations)),
		)
	}
	if p.recencyConstraintsAgeSec != 0 {
		btc.SetConfigValue(t, ctx,
			crypto.StreamRecencyConstraintsAgeSecConfigKey,
			crypto.ABIEncodeUint64(uint64(p.recencyConstraintsAgeSec)),
		)
	}
	if p.defaultMinEventsPerSnapshot != 0 {
		btc.SetConfigValue(t, ctx,
			crypto.StreamDefaultMinEventsPerSnapshotConfigKey,
			crypto.ABIEncodeUint64(uint64(p.defaultMinEventsPerSnapshot)),
		)
	}
}

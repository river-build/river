package events

import (
	"bytes"
	"context"
	"math/rand"
	"runtime"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/river-build/river/core/contracts/river"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/infra"
	. "github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
	"golang.org/x/sync/semaphore"
)

type StreamCacheParams struct {
	Storage                 storage.StreamStorage
	Wallet                  *crypto.Wallet
	RiverChain              *crypto.Blockchain
	Registry                *registries.RiverRegistryContract
	ChainConfig             crypto.OnChainConfiguration
	AppliedBlockNum         crypto.BlockNumber
	ChainMonitor            crypto.ChainMonitor // TODO: delete and use RiverChain.ChainMonitor
	Metrics                 infra.MetricsFactory
	RemoteMiniblockProvider RemoteMiniblockProvider
}

type StreamCache interface {
	Params() *StreamCacheParams
	GetStream(ctx context.Context, streamId StreamId) (SyncStream, StreamView, error)
	GetSyncStream(ctx context.Context, streamId StreamId) (SyncStream, error)
	CreateStream(ctx context.Context, streamId StreamId) (SyncStream, StreamView, error)
	ForceFlushAll(ctx context.Context)
	GetLoadedViews(ctx context.Context) []StreamView
	GetMbCandidateStreams(ctx context.Context) []*streamImpl
}

type streamCacheImpl struct {
	params *StreamCacheParams

	// streamId -> *streamImpl
	// cache is populated by getting all streams that should be on local node from River chain.
	// streamImpl can be in unloaded state, in which case it will be loaded on first GetStream call.
	cache sync.Map

	chainConfig crypto.OnChainConfiguration

	streamCacheSizeGauge     prometheus.Gauge
	streamCacheUnloadedGauge prometheus.Gauge
}

var _ StreamCache = (*streamCacheImpl)(nil)

func NewStreamCache(
	ctx context.Context,
	params *StreamCacheParams,
) (*streamCacheImpl, error) {
	s := &streamCacheImpl{
		params: params,
		streamCacheSizeGauge: params.Metrics.NewGaugeVecEx(
			"stream_cache_size", "Number of streams in stream cache",
			"chain_id", "address",
		).WithLabelValues(
			params.RiverChain.ChainId.String(),
			params.Wallet.Address.String(),
		),
		streamCacheUnloadedGauge: params.Metrics.NewGaugeVecEx(
			"stream_cache_unloaded", "Number of unloaded streams in stream cache",
			"chain_id", "address",
		).WithLabelValues(
			params.RiverChain.ChainId.String(),
			params.Wallet.Address.String(),
		),
		chainConfig: params.ChainConfig,
	}

	var (
		syncAndLoadCtx, cancelSyncAndLoad = context.WithCancel(ctx)
		streamFetchResultsChan            = params.Registry.GetAllStreams(syncAndLoadCtx, params.AppliedBlockNum)
		taskPoolSize                      = min(int64(runtime.NumCPU()), 32)
		taskPool                          = semaphore.NewWeighted(taskPoolSize)
		loadErrors                        = make(chan error, 1)
	)

	defer cancelSyncAndLoad()

	// sync and load streams in cache in parallel for faster startup.
	for streamsFetchResult := range streamFetchResultsChan {
		if streamsFetchResult.Err != nil {
			return nil, streamsFetchResult.Err
		}

		if err := taskPool.Acquire(syncAndLoadCtx, 1); err != nil {
			return nil, AsRiverError(err, Err_INTERNAL).
				Message("failed to acquire semaphore").
				Func("NewStreamCache")
		}

		go func() {
			defer taskPool.Release(1)

			if err := s.syncAndLoadStreams(syncAndLoadCtx, streamsFetchResult.Streams); err != nil {
				cancelSyncAndLoad()
				select {
				case loadErrors <- err:
				default: // prevent blocking
				}
			}
		}()
	}

	// wait till all stream loaders are done and close the loadErrors channel as indication all streams are loaded.
	if err := taskPool.Acquire(ctx, taskPoolSize); err != nil {
		loadErrors <- AsRiverError(err, Err_INTERNAL).
			Message("failed to acquire semaphore").
			Func("NewStreamCache")
	}
	taskPool.Release(taskPoolSize)
	close(loadErrors)

	// return err in case one of the loaders was unsuccessful.
	if err, ok := <-loadErrors; ok {
		return nil, err
	}

	// register callbacks that are called on state changes in stream registry.
	if err := params.Registry.OnStreamEvent(
		ctx,
		params.AppliedBlockNum+1,
		s.onStreamAllocated,
		s.onStreamLastMiniblockUpdated,
		s.onStreamPlacementUpdated,
	); err != nil {
		return nil, err
	}

	go s.runCacheCleanup(ctx)

	return s, nil
}

// syncAndLoadStreams loads streams from the registry into the cache. If the database is behind the river stream
// registry contract missing mini-blocks will be fetched from remote and written to the database before the stream is
// loaded into the cache.
func (s *streamCacheImpl) syncAndLoadStreams(
	ctx context.Context,
	streamsLoadedFromRegistry map[StreamId]*registries.GetStreamResult,
) error {
	// only load streams that are local to this node.
	var localStreamIds []StreamId
	for _, stream := range streamsLoadedFromRegistry {
		nodes := NewStreamNodes(stream.Nodes, s.params.Wallet.Address)
		if nodes.IsLocal() {
			localStreamIds = append(localStreamIds, stream.StreamId)
		}
	}

	if len(localStreamIds) == 0 {
		return nil
	}

	// load the last mini-block that the database has for each stream to determine if the stream needs to be synced
	// with a remote.
	streamLastMiniBlocksInDB, err := s.params.Storage.StreamLastMiniBlocks(ctx, localStreamIds)
	if err != nil {
		return err
	}

	log := dlog.FromCtx(ctx)

	// load the streams in the cache that this node is participating in.
	for _, streamID := range localStreamIds {
		streamAsInRegistry := streamsLoadedFromRegistry[streamID]
		streamAsInDB, ok := streamLastMiniBlocksInDB[streamID]

		if !ok { // stream not in database, sync stream from genesis with remote first
			if err := s.syncStream(ctx, streamAsInRegistry, nil); err != nil {
				// TODO: retry to sync stream periodically or as part of onStreamLastMiniblockUpdated processing?
				log.Error("Unable to sync stream", "err", err)
				continue
			}

			s.cache.Store(streamID, &streamImpl{
				params:   s.params,
				streamId: streamID,
				nodes:    NewStreamNodes(streamAsInRegistry.Nodes, s.params.Wallet.Address),
			})

		} else if streamAsInRegistry.LastMiniblockNum == uint64(streamAsInDB.Number) { // stream up to date, no sync needed
			s.cache.Store(streamID, &streamImpl{
				params:   s.params,
				streamId: streamID,
				nodes:    NewStreamNodes(streamAsInRegistry.Nodes, s.params.Wallet.Address),
			})

		} else if streamAsInRegistry.LastMiniblockNum > uint64(streamAsInDB.Number) { // stream out of sync, sync from remote
			if err := s.syncStream(ctx, streamAsInRegistry, streamAsInDB); err != nil {
				// TODO: retry to sync stream periodically or as part of onStreamLastMiniblockUpdated processing?
				log.Error("Unable to sync stream", "err", err)
				continue
			}

			s.cache.Store(streamID, &streamImpl{
				params:   s.params,
				streamId: streamID,
				nodes:    NewStreamNodes(streamAsInRegistry.Nodes, s.params.Wallet.Address),
			})

		} else {
			// database is ahead of smart contract, either the database is corrupt or the river chain RPC node is
			// lagging behind. TODO: determine what should be done in this case (for now ignore the stream).
			log.Error(
				"Stream in smart contract is behind local database",
				"streamId", streamID,
				"contract.num", streamAsInRegistry.LastMiniblockNum,
				"contract.hash", streamAsInRegistry.LastMiniblockHash,
				"db.num", streamAsInDB.Number,
			)
		}
	}

	return nil
}

// syncStream retrieves mini-blocks from another node participating in the stream and imports them into the database
// bringing the stream registry and database in sync.
func (s *streamCacheImpl) syncStream(
	ctx context.Context,
	stream *registries.GetStreamResult,
	latestStreamMiniBlockInDB *storage.LatestMiniBlock,
) error {
	var (
		log             = dlog.FromCtx(ctx)
		from            = uint64(0)                      // default sync from scratch
		to              = stream.LastMiniblockNum + 1    // API to is exclusive
		chain           = make(map[int64]*MiniblockInfo) // mini-block.num => mini-block
		syncFromGenesis = latestStreamMiniBlockInDB == nil
	)

	if !syncFromGenesis {
		miniBlockInfo, err := NewMiniblockInfoFromBytes(
			latestStreamMiniBlockInDB.MiniBlockInfo,
			latestStreamMiniBlockInDB.Number)

		if err != nil {
			return err
		}

		from = uint64(latestStreamMiniBlockInDB.Number) + 1
		chain[miniBlockInfo.Num] = miniBlockInfo // needed to verify that first fetched mini-block is built on top
	}

	// try nodes in random order until all required mini-blocks are fetched. Aggregated received mini-blocks from all
	// nodes in chain to allow for partial fetching if some nodes are not able to provide all blocks.
	rand.Shuffle(len(stream.Nodes), func(i, j int) {
		stream.Nodes[i], stream.Nodes[j] = stream.Nodes[j], stream.Nodes[i]
	})

	syncCtx, syncCancel := context.WithCancel(ctx)
	defer syncCancel()

nodeLoop:
	for _, node := range stream.Nodes {
		if node == s.params.Wallet.Address {
			continue // only fetch from remote
		}

		var (
			miniBlockStream, errors  = s.params.RemoteMiniblockProvider.GetMiniBlocksStreamed(syncCtx, node, stream.StreamId, from, to)
			expBlockNum              = int64(from)
			blockRangeSize           = int(to - from)
			remoteMiniBlocksReceived = 0
		)

	blockLoop:
		for {
			select {
			case miniBlock, ok := <-miniBlockStream:
				if !ok {
					break blockLoop // starts received mini-block chain verification and if valid imports it in db
				}

				remoteMiniBlocksReceived++

				if blockRangeSize < len(chain) || remoteMiniBlocksReceived > blockRangeSize {
					// got corrupt local chain, drop fetched mini-block chain and re-sync from scratch from next node
					chain = make(map[int64]*MiniblockInfo)
					continue nodeLoop
				}

				miniBlockInfo, err := NewMiniblockInfoFromProto(miniBlock, NewMiniblockInfoFromProtoOpts{
					ExpectedBlockNumber: expBlockNum,
					DontParseEvents:     true, // received mini-blocks are verified if part of canonical chain
				})

				// received corrupt block from node, continue from next node because gathered chain could not be trusted
				if err != nil {
					chain = make(map[int64]*MiniblockInfo)
					continue nodeLoop
				}

				if miniBlockInfo.headerEvent.PrevMiniblockHash != nil &&
					miniBlockInfo.Num >= int64(from) && miniBlockInfo.Num < int64(to) {
					chain[miniBlockInfo.Num] = miniBlockInfo
				} else if syncFromGenesis && miniBlockInfo.Num == 0 && miniBlockInfo.headerEvent.PrevMiniblockHash == nil {
					chain[miniBlockInfo.Num] = miniBlockInfo
				}

				expBlockNum++

			case err, ok := <-errors:
				if ok {
					return err
				}
			}
		}

		// check that the entire mini-block chain is received

		// make sure received chain is built on top of the latest mini-block in the database.
		// or if genesis isn't available is started from the genesis block
		if syncFromGenesis {
			_, ok := chain[0]
			if !ok {
				continue nodeLoop
			}
		} else {
			miniBlockInDB, ok := chain[latestStreamMiniBlockInDB.Number]
			if !ok {
				continue nodeLoop
			}

			firstFetchedBlock, ok := chain[latestStreamMiniBlockInDB.Number+1]
			if !ok {
				continue nodeLoop
			}

			if miniBlockInDB.Hash != *firstFetchedBlock.headerEvent.PrevMiniblockHash {
				continue nodeLoop
			}
		}

		// make sure that last received block is the block as the stream registry contains
		lastBlock, ok := chain[int64(stream.LastMiniblockNum)]
		if !ok {
			continue nodeLoop
		}
		if stream.LastMiniblockHash != lastBlock.Hash {
			continue nodeLoop
		}

		// ensure that chain is canonical, if some blocks are missing, query the next node to fetch missing blocks
		for n := int64(from); n < int64(to-1); n++ {
			parent, ok := chain[n]
			if !ok {
				continue nodeLoop
			}

			child, ok := chain[n+1]
			if !ok {
				continue nodeLoop
			}

			if !bytes.Equal(parent.Hash[:], child.headerEvent.PrevMiniblockHash.Bytes()) {
				continue nodeLoop
			}
		}

		// store retrieved stream mini-blocks in database
		var serializedMiniBlocks [][]byte
		serializedMiniBlocksFirstNum := int64(0)
		for n := int64(from); n < int64(to); n++ {
			block := chain[n]
			serialized, err := block.ToBytes()
			if err != nil {
				return err
			}

			if block.Num == 0 {
				err = s.params.Storage.CreateStreamStorage(ctx, stream.StreamId, serialized)
				if err != nil {
					return err
				}
				from = 1
			} else {
				serializedMiniBlocksFirstNum = min(serializedMiniBlocksFirstNum, block.Num)
				serializedMiniBlocks = append(serializedMiniBlocks, serialized)
			}
		}

		if len(serializedMiniBlocks) > 0 {
			err := s.params.Storage.WriteArchiveMiniblocks(
				ctx, stream.StreamId, int64(from), serializedMiniBlocks)
			if err != nil {
				return err
			}
		}

		log.Debug("Synced stream", "streamId", stream.StreamId, "node", node, "from", from, "to", to)

		return nil
	}

	return RiverError(Err_BAD_BLOCK_NUMBER, "Unable to fetch mini-blocks for st4ream", "stream", stream.StreamId)
}

func (s *streamCacheImpl) onStreamAllocated(ctx context.Context, event *river.StreamRegistryV1StreamAllocated) {
}

func (s *streamCacheImpl) onStreamLastMiniblockUpdated(
	ctx context.Context,
	event *river.StreamRegistryV1StreamLastMiniblockUpdated,
) {
	entry, _ := s.cache.Load(StreamId(event.StreamId))
	if entry == nil {
		// Stream is not local, ignore.
		return
	}

	stream := entry.(*streamImpl)

	view, err := stream.getView(ctx)
	if err != nil {
		dlog.FromCtx(ctx).Error("onStreamLastMiniblockUpdated: failed to get stream view", "err", err)
		return
	}

	// Check if current state is beyond candidate. (Local candidates are applied immediately after tx).
	if uint64(view.LastBlock().Num) >= event.LastMiniblockNum {
		return
	}

	err = stream.PromoteCandidate(ctx, event.LastMiniblockHash, int64(event.LastMiniblockNum))
	if err != nil {
		dlog.FromCtx(ctx).Error("onStreamLastMiniblockUpdated: failed to promote candidate", "err", err)
	}
}

func (s *streamCacheImpl) onStreamPlacementUpdated(
	ctx context.Context,
	event *river.StreamRegistryV1StreamPlacementUpdated,
) {
}

func (s *streamCacheImpl) Params() *StreamCacheParams {
	return s.params
}

func (s *streamCacheImpl) runCacheCleanup(ctx context.Context) {
	log := dlog.FromCtx(ctx)

	for {
		pollInterval := s.params.ChainConfig.Get().StreamCachePollIntterval
		expirationEnabled := false
		if pollInterval > 0 {
			expirationEnabled = true
		}
		select {
		case <-time.After(pollInterval):
			s.cacheCleanup(ctx, expirationEnabled, s.params.ChainConfig.Get().StreamCacheExpiration)
		case <-ctx.Done():
			log.Debug("stream cache cache cleanup shutdown")
			return
		}
	}
}

func (s *streamCacheImpl) cacheCleanup(ctx context.Context, enabled bool, expiration time.Duration) {
	var (
		log                  = dlog.FromCtx(ctx)
		totalStreamsCount    = 0
		unloadedStreamsCount = 0
	)

	// TODO: add data structure that supports to loop over streams that have their view loaded instead of
	// looping over all streams.
	s.cache.Range(func(streamID, streamVal any) bool {
		totalStreamsCount++
		if enabled {
			if stream := streamVal.(*streamImpl); stream.tryCleanup(expiration) {
				unloadedStreamsCount++
				log.Debug("stream view is unloaded from cache", "streamId", stream.streamId)
			}
		}
		return true
	})

	s.streamCacheSizeGauge.Set(float64(totalStreamsCount))
	if enabled {
		s.streamCacheUnloadedGauge.Set(float64(unloadedStreamsCount))
	} else {
		s.streamCacheUnloadedGauge.Set(float64(-1))
	}
}

func (s *streamCacheImpl) tryLoadStreamRecord(
	ctx context.Context,
	streamId StreamId,
	loadView bool,
) (SyncStream, StreamView, error) {
	// Same code is called for GetStream, GetSyncStream and CreateStream.
	// For GetStream the fact that record is not in cache means that there is race to get it during creation:
	// Blockchain record is already created, but this fact is not reflected yet in local storage.
	// This may happen if somebody observes record allocation on blockchain and tries to get stream
	// while local storage is being initialized.
	record, _, mb, err := s.params.Registry.GetStreamWithGenesis(ctx, streamId)
	if err != nil {
		return nil, nil, err
	}

	nodes := NewStreamNodes(record.Nodes, s.params.Wallet.Address)
	if !nodes.IsLocal() {
		return nil, nil, RiverError(
			Err_INTERNAL,
			"tryLoadStreamRecord: Stream is not local",
			"streamId", streamId,
			"nodes", record.Nodes,
			"localNode", s.params.Wallet,
		)
	}

	if record.LastMiniblockNum > 0 {
		// TODO: reconcile from other nodes.
		return nil, nil, RiverError(
			Err_INTERNAL,
			"tryLoadStreamRecord: Stream is past genesis",
			"streamId",
			streamId,
			"record",
			record,
		)
	}

	stream := &streamImpl{
		params:           s.params,
		streamId:         streamId,
		nodes:            nodes,
		lastAccessedTime: time.Now(),
	}

	// Lock stream, so parallel creators have to wait for the stream to be intialized.
	stream.mu.Lock()
	defer stream.mu.Unlock()

	entry, loaded := s.cache.LoadOrStore(streamId, stream)
	if !loaded {
		// Our stream won the race, put into storage.
		err := s.params.Storage.CreateStreamStorage(ctx, streamId, mb)
		if err != nil {
			if AsRiverError(err).Code == Err_ALREADY_EXISTS {
				if loadView {
					// Attempt to load stream from storage. Might as well do it while under lock.
					if err = stream.loadInternal(ctx); err == nil {
						return stream, stream.view, nil
					}
					return nil, nil, err
				}
				return stream, nil, err
			}
			return nil, nil, err
		}

		// Successfully put data into storage, init stream view.
		view, err := MakeStreamView(&storage.ReadStreamFromLastSnapshotResult{
			StartMiniblockNumber: 0,
			Miniblocks:           [][]byte{mb},
		})
		if err != nil {
			return nil, nil, err
		}
		stream.view = view
		return stream, view, nil
	} else {
		// There was another record in the cache, use it.
		if entry == nil {
			return nil, nil, RiverError(Err_INTERNAL, "tryLoadStreamRecord: Cache corruption", "streamId", streamId)
		}
		stream = entry.(*streamImpl)
		if !loadView {
			return stream, nil, err
		}

		view, err := stream.GetView(ctx)
		if err != nil {
			return nil, nil, err
		}
		return stream, view, nil
	}
}

func (s *streamCacheImpl) GetStream(ctx context.Context, streamId StreamId) (SyncStream, StreamView, error) {
	entry, _ := s.cache.Load(streamId)
	if entry == nil {
		return s.tryLoadStreamRecord(ctx, streamId, true)
	}
	stream := entry.(*streamImpl)

	streamView, err := stream.GetView(ctx)

	if err == nil {
		return stream, streamView, nil
	} else {
		// TODO: if stream is not present in local storage, schedule reconciliation.
		return nil, nil, err
	}
}

func (s *streamCacheImpl) getStreamImpl(ctx context.Context, streamId StreamId) (*streamImpl, error) {
	entry, _ := s.cache.Load(streamId)
	if entry == nil {
		syncStream, _, err := s.tryLoadStreamRecord(ctx, streamId, false)
		return syncStream.(*streamImpl), err
	}
	return entry.(*streamImpl), nil
}

func (s *streamCacheImpl) GetSyncStream(ctx context.Context, streamId StreamId) (SyncStream, error) {
	entry, _ := s.cache.Load(streamId)
	if entry == nil {
		syncStream, _, err := s.tryLoadStreamRecord(ctx, streamId, false)
		return syncStream, err
	}
	return entry.(*streamImpl), nil
}

func (s *streamCacheImpl) CreateStream(
	ctx context.Context,
	streamId StreamId,
) (SyncStream, StreamView, error) {
	// Same logic as in GetStream: read from blockchain, create if present.
	return s.GetStream(ctx, streamId)
}

func (s *streamCacheImpl) ForceFlushAll(ctx context.Context) {
	s.cache.Range(func(key, value interface{}) bool {
		stream := value.(*streamImpl)
		stream.ForceFlush(ctx)
		return true
	})
}

func (s *streamCacheImpl) GetLoadedViews(ctx context.Context) []StreamView {
	var result []StreamView
	s.cache.Range(func(key, value interface{}) bool {
		stream := value.(*streamImpl)
		view := stream.tryGetView()
		if view != nil {
			result = append(result, view)
		}
		return true
	})
	return result
}

func (s *streamCacheImpl) GetMbCandidateStreams(ctx context.Context) []*streamImpl {
	var candidates []*streamImpl
	s.cache.Range(func(key, value interface{}) bool {
		stream := value.(*streamImpl)
		if stream.canCreateMiniblock() {
			candidates = append(candidates, stream)
		}
		return true
	})

	return candidates
}

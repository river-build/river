package events

import (
	"context"
	"math/big"
	"slices"
	"sync/atomic"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/gammazero/workerpool"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/puzpuzpuz/xsync/v3"
	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/contracts/river"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/infra"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
)

type Scrubber interface {
	// Scrub schedules a scrub for the given channel.
	// Returns true if the scrub was scheduled, false if it was already pending.
	Scrub(channelId StreamId) bool
}

type StreamCacheParams struct {
	Storage                 storage.StreamStorage
	Wallet                  *crypto.Wallet
	RiverChain              *crypto.Blockchain
	Registry                *registries.RiverRegistryContract
	ChainConfig             crypto.OnChainConfiguration
	Config                  *config.Config
	AppliedBlockNum         crypto.BlockNumber
	ChainMonitor            crypto.ChainMonitor // TODO: delete and use RiverChain.ChainMonitor
	Metrics                 infra.MetricsFactory
	RemoteMiniblockProvider RemoteMiniblockProvider
	Scrubber                Scrubber
}

type StreamCache interface {
	Start(ctx context.Context) error
	Params() *StreamCacheParams
	// GetStreamWaitForLocal is a transitional method to support existing GetStream API before block number are wired through APIs.
	GetStreamWaitForLocal(ctx context.Context, streamId StreamId) (SyncStream, error)
	// GetStreamNoWait is a transitional method to support existing GetStream API before block number are wired through APIs.
	GetStreamNoWait(ctx context.Context, streamId StreamId) (SyncStream, error)
	ForceFlushAll(ctx context.Context)
	GetLoadedViews(ctx context.Context) []StreamView
	GetMbCandidateStreams(ctx context.Context) []*streamImpl
	CacheCleanup(ctx context.Context, enabled bool, expiration time.Duration) CacheCleanupResult
}

type streamCacheImpl struct {
	params *StreamCacheParams

	// streamId -> *streamImpl
	// cache is populated by getting all streams that should be on local node from River chain.
	// streamImpl can be in unloaded state, in which case it will be loaded on first GetStream call.
	cache *xsync.MapOf[StreamId, *streamImpl]

	// appliedBlockNum is the number of the last block logs from which were applied to cache.
	appliedBlockNum atomic.Uint64

	chainConfig crypto.OnChainConfiguration

	streamCacheSizeGauge     prometheus.Gauge
	streamCacheUnloadedGauge prometheus.Gauge
	streamCacheRemoteGauge   prometheus.Gauge

	onlineSyncWorkerPool *workerpool.WorkerPool
}

var _ StreamCache = (*streamCacheImpl)(nil)

func NewStreamCache(
	ctx context.Context,
	params *StreamCacheParams,
) *streamCacheImpl {
	return &streamCacheImpl{
		params: params,
		cache:  xsync.NewMapOf[StreamId, *streamImpl](),
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
		streamCacheRemoteGauge: params.Metrics.NewGaugeVecEx(
			"stream_cache_remote", "Number of remote streams in stream cache",
			"chain_id", "address",
		).WithLabelValues(
			params.RiverChain.ChainId.String(),
			params.Wallet.Address.String(),
		),
		chainConfig:          params.ChainConfig,
		onlineSyncWorkerPool: workerpool.New(params.Config.StreamReconciliation.OnlineWorkerPoolSize),
	}
}

func (s *streamCacheImpl) Start(ctx context.Context) error {
	retrievedStreams, err := s.retrieveStreams(ctx)
	if err != nil {
		return err
	}

	// load local streams in-memory cache and if enabled stream reconciliation is enabled
	// create a sync task that syncs the local DB stream data with the streams registry.
	initialSyncWorkerPool := workerpool.New(s.params.Config.StreamReconciliation.InitialWorkerPoolSize)
	for streamID, stream := range retrievedStreams {
		si := &streamImpl{
			params:              s.params,
			streamId:            streamID,
			lastAppliedBlockNum: s.params.AppliedBlockNum,
			local:               &localStreamState{},
		}
		si.nodesLocked.Reset(stream.Nodes, s.params.Wallet.Address)
		s.cache.Store(stream.StreamId, si)
		if s.params.Config.StreamReconciliation.InitialWorkerPoolSize > 0 {
			s.submitSyncStreamTask(
				ctx,
				initialSyncWorkerPool,
				streamID,
				&MiniblockRef{
					Hash: stream.MiniblockHash,
					Num:  stream.MiniblockNumber,
				},
			)
		}
	}

	s.appliedBlockNum.Store(uint64(s.params.AppliedBlockNum))

	// Close initial worker pool after all tasks are executed.
	go initialSyncWorkerPool.StopWait()

	// TODO: add buffered channel to avoid blocking ChainMonitor
	s.params.RiverChain.ChainMonitor.OnBlockWithLogs(
		s.params.AppliedBlockNum+1,
		s.onBlockWithLogs,
	)

	go s.runCacheCleanup(ctx)

	go func() {
		<-ctx.Done()
		s.onlineSyncWorkerPool.Stop()
		initialSyncWorkerPool.Stop()
	}()

	return nil
}

// retrieveStreams, either from persistent storage and apply delta since last integrated block.
// Or from the stream registry at s.params.AppliedBlockNum if there is no local state in persistent storage.
func (s *streamCacheImpl) retrieveStreams(ctx context.Context) (map[StreamId]*storage.StreamMetadata, error) {
	// try to fetch latest streams state from the DB
	streamsMetaData, lastBlock, err := s.params.Storage.AllStreamsMetaData(ctx)
	if err != nil {
		return nil, err
	}

	var removed []StreamId // streams replaced away from this node

	if lastBlock == 0 { // first time, fetch from River chain
		streamsMetaData, err = s.retrieveFromRiverChain(ctx)
	} else { // retrieve stream updates since lastBlock and apply to streamsMetaDat
		removed, err = s.applyDeltas(ctx, lastBlock, streamsMetaData)
	}

	if err != nil {
		return nil, err
	}

	if err := s.params.Storage.UpdateStreamsMetaData(ctx, streamsMetaData, removed); err != nil {
		return nil, WrapRiverError(Err_DB_OPERATION_FAILURE, err).
			Func("NewStreamCache").
			Message("Unable to update stream metadata records in DB")
	}

	return streamsMetaData, nil
}

func (s *streamCacheImpl) retrieveFromRiverChain(ctx context.Context) (map[StreamId]*storage.StreamMetadata, error) {
	streams := make(map[StreamId]*storage.StreamMetadata)

	err := s.params.Registry.ForAllStreams(ctx, s.params.AppliedBlockNum,
		func(stream *registries.GetStreamResult) bool {
			if slices.Contains(stream.Nodes, s.params.Wallet.Address) {
				streams[stream.StreamId] = &storage.StreamMetadata{
					StreamId:        stream.StreamId,
					Nodes:           stream.Nodes,
					MiniblockHash:   stream.LastMiniblockHash,
					MiniblockNumber: int64(stream.LastMiniblockNum),
				}
			}
			return true
		})

	if err != nil {
		return nil, err
	}

	return streams, nil
}

// applyDeltas applies deltas on the given streams between [lastBlock, params.AppliedBlockNum]
// from RiverChain streams registry. It returns a list of streams that are allocated or replaced
// to this node and a list of streams that are removed from this node.
func (s *streamCacheImpl) applyDeltas(
	ctx context.Context,
	lastDBBlock int64,
	streams map[StreamId]*storage.StreamMetadata,
) (removals []StreamId, err error) {
	if lastDBBlock > int64(s.params.AppliedBlockNum.AsUint64()) {
		return nil, RiverError(Err_BAD_BLOCK_NUMBER, "Local database is ahead of River Chain").
			Func("loadStreamsUpdatesFromRiverChain").
			Tags("riverChainLastBlock", lastDBBlock, "appliedBlockNum", s.params.AppliedBlockNum)
	}

	// fetch and apply changes that happened since latest sync
	var (
		log                    = dlog.FromCtx(ctx)
		streamRegistryContract = s.params.Registry.StreamRegistry.BoundContract()
		from                   = lastDBBlock + 1
		to                     = int64(s.params.AppliedBlockNum.AsUint64())
		query                  = ethereum.FilterQuery{
			Addresses: []common.Address{s.params.Registry.Address},
			Topics: [][]common.Hash{{
				s.params.Registry.StreamRegistryAbi.Events[river.Event_StreamAllocated].ID,
				s.params.Registry.StreamRegistryAbi.Events[river.Event_StreamLastMiniblockUpdated].ID,
				s.params.Registry.StreamRegistryAbi.Events[river.Event_StreamPlacementUpdated].ID,
			}},
		}
		maxBlockRange = int64(2000) // if too large the number of events in a single rpc call can become too big
		retryCounter  = 0
	)

	for from <= to {
		toBlock := min(from+maxBlockRange, to)
		query.FromBlock, query.ToBlock = big.NewInt(from), big.NewInt(toBlock)

		logs, err := s.params.RiverChain.Client.FilterLogs(ctx, query)
		if err != nil {
			log.Error("Unable to retrieve logs from RiverChain", "retry", retryCounter, "err", err)

			retryCounter++
			if retryCounter > 40 {
				return nil, WrapRiverError(Err_CANNOT_CALL_CONTRACT, err).
					Message("Unable to fetch stream changes").
					Tags("from", from, "to", toBlock).
					Func("retrieveFromDeltas")
			}

			select {
			case <-time.After(3 * time.Second):
				continue
			case <-ctx.Done():
				return nil, ctx.Err()
			}
		}

		for _, event := range logs {
			if len(event.Topics) == 0 {
				continue
			}

			switch event.Topics[0] {
			case s.params.Registry.StreamRegistryAbi.Events[river.Event_StreamAllocated].ID:
				streamAllocatedEvent := new(river.StreamRegistryV1StreamAllocated)
				if err := streamRegistryContract.UnpackLog(event, river.Event_StreamAllocated, event); err != nil {
					log.Error("Unable to unpack StreamRegistryV1StreamAllocated event",
						"transaction", event.TxHash, "logIdx", event.Index, "err", err)
					continue
				}

				if slices.Contains(streamAllocatedEvent.Nodes, s.params.Wallet.Address) {
					streams[streamAllocatedEvent.StreamId] = &storage.StreamMetadata{
						StreamId:        streamAllocatedEvent.StreamId,
						Nodes:           streamAllocatedEvent.Nodes,
						MiniblockHash:   streamAllocatedEvent.GenesisMiniblockHash,
						MiniblockNumber: 0,
						IsSealed:        false,
					}
				}

			case s.params.Registry.StreamRegistryAbi.Events[river.Event_StreamLastMiniblockUpdated].ID:
				lastMiniblockUpdatedEvent := new(river.StreamRegistryV1StreamLastMiniblockUpdated)
				if err := streamRegistryContract.UnpackLog(event, river.Event_StreamLastMiniblockUpdated, event); err != nil {
					log.Error("Unable to unpack StreamRegistryV1StreamLastMiniblockUpdated event",
						"transaction", event.TxHash, "logIdx", event.Index, "err", err)
					continue
				}

				if stream, ok := streams[lastMiniblockUpdatedEvent.StreamId]; ok {
					stream.MiniblockHash = common.BytesToHash(lastMiniblockUpdatedEvent.LastMiniblockHash[:])
					stream.MiniblockNumber = int64(lastMiniblockUpdatedEvent.LastMiniblockNum)
					stream.IsSealed = lastMiniblockUpdatedEvent.IsSealed
				}

			case s.params.Registry.StreamRegistryAbi.Events[river.Event_StreamPlacementUpdated].ID:
				streamPlacementUpdatedEvent := new(river.StreamRegistryV1StreamPlacementUpdated)
				if err := streamRegistryContract.UnpackLog(event, river.Event_StreamPlacementUpdated, event); err != nil {
					log.Error("Unable to unpack StreamRegistryV1StreamPlacementUpdated event",
						"transaction", event.TxHash, "logIdx", event.Index, "err", err)
					continue
				}

				if s.params.Wallet.Address == streamPlacementUpdatedEvent.NodeAddress {
					if streamPlacementUpdatedEvent.IsAdded { // stream was replaced to this node
						retrievedStream, err := s.params.Registry.GetStream(
							ctx, streamPlacementUpdatedEvent.StreamId, s.params.AppliedBlockNum)
						if err != nil {
							return nil, WrapRiverError(Err_BAD_EVENT, err).
								Tags("stream", streamPlacementUpdatedEvent.StreamId, "transaction", event.TxHash, "logIdx", event.Index).
								Message("Unable to retrieve replaced stream").
								Func("retrieveFromDeltas")
						}

						streams[streamPlacementUpdatedEvent.StreamId] = &storage.StreamMetadata{
							StreamId:        streamPlacementUpdatedEvent.StreamId,
							Nodes:           retrievedStream.Nodes,
							MiniblockHash:   retrievedStream.LastMiniblockHash,
							MiniblockNumber: int64(retrievedStream.LastMiniblockNum),
							IsSealed:        false,
						}

						slices.DeleteFunc(removals, func(streamID StreamId) bool {
							return streamID == streamPlacementUpdatedEvent.StreamId
						})
					} else { // stream was replaced away from this node
						removals = append(removals, streamPlacementUpdatedEvent.StreamId)
					}
				}
			}
		}

		retryCounter = 0
		from = toBlock + 1
	}

	return removals, nil
}

func (s *streamCacheImpl) onBlockWithLogs(ctx context.Context, blockNum crypto.BlockNumber, logs []*types.Log) {
	streamEvents, errs := s.params.Registry.FilterStreamEvents(ctx, logs)
	// Process parsed stream events even if some failed to parse
	for _, err := range errs {
		dlog.FromCtx(ctx).Error("Failed to parse stream event", "err", err)
	}

	// TODO: parallel processing?
	for streamId, events := range streamEvents {
		allocatedEvent, ok := events[0].(*river.StreamAllocated)
		if ok {
			s.onStreamAllocated(ctx, allocatedEvent, events[1:], blockNum)
			continue
		}

		stream, ok := s.cache.Load(streamId)
		if !ok {
			continue
		}
		stream.applyStreamEvents(ctx, events, blockNum)
	}

	s.appliedBlockNum.Store(uint64(blockNum))

	// TODO(BvK): update last block in DB for delta sync
}

func (s *streamCacheImpl) onStreamAllocated(
	ctx context.Context,
	event *river.StreamAllocated,
	otherEvents []river.EventWithStreamId,
	blockNum crypto.BlockNumber,
) {
	if slices.Contains(event.Nodes, s.params.Wallet.Address) {
		stream := &streamImpl{
			params:              s.params,
			streamId:            StreamId(event.StreamId),
			lastAppliedBlockNum: blockNum,
			lastAccessedTime:    time.Now(),
			local:               &localStreamState{},
		}

		stream.nodesLocked.Reset(event.Nodes, s.params.Wallet.Address)
		stream, created, err := s.createStreamStorage(ctx, stream, event.Nodes, event.GenesisMiniblockHash, event.GenesisMiniblock)
		if err != nil {
			dlog.FromCtx(ctx).Error("Failed to allocate stream", "err", err, "streamId", StreamId(event.StreamId))
		}
		if created && len(otherEvents) > 0 {
			stream.applyStreamEvents(ctx, otherEvents, blockNum)
		}
	}
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
			s.CacheCleanup(ctx, expirationEnabled, s.params.ChainConfig.Get().StreamCacheExpiration)
		case <-ctx.Done():
			log.Debug("stream cache cache cleanup shutdown")
			return
		}
	}
}

type CacheCleanupResult struct {
	TotalStreams    int
	UnloadedStreams int
	RemoteStreams   int
}

func (s *streamCacheImpl) CacheCleanup(ctx context.Context, enabled bool, expiration time.Duration) CacheCleanupResult {
	var (
		log    = dlog.FromCtx(ctx)
		result CacheCleanupResult
	)

	// TODO: add data structure that supports to loop over streams that have their view loaded instead of
	// looping over all streams.
	s.cache.Range(func(streamID StreamId, stream *streamImpl) bool {
		if !stream.IsLocal() {
			result.RemoteStreams++
			return true
		}
		result.TotalStreams++
		if enabled {
			// TODO: add purge from cache for non-local streams.
			if stream.tryCleanup(expiration) {
				result.UnloadedStreams++
				log.Debug("stream view is unloaded from cache", "streamId", stream.streamId)
			}
		}
		return true
	})

	s.streamCacheSizeGauge.Set(float64(result.TotalStreams))
	if enabled {
		s.streamCacheUnloadedGauge.Set(float64(result.UnloadedStreams))
	} else {
		s.streamCacheUnloadedGauge.Set(float64(-1))
	}
	s.streamCacheRemoteGauge.Set(float64(result.RemoteStreams))
	return result
}

func (s *streamCacheImpl) tryLoadStreamRecord(
	ctx context.Context,
	streamId StreamId,
	waitForLocal bool,
) (*streamImpl, error) {
	// For GetStream the fact that record is not in cache means that there is race to get it during creation:
	// Blockchain record is already created, but this fact is not reflected yet in local storage.
	// This may happen if somebody observes record allocation on blockchain and tries to get stream
	// while local storage is being initialized.
	record, mbHash, mb, blockNum, err := s.params.Registry.GetStreamWithGenesis(ctx, streamId)
	if err != nil {
		if !waitForLocal {
			return nil, err
		}

		// Loop here waiting for record to be created.
		// This is less optimal than implementing pub/sub, but given that this is rare codepath,
		// it is not worth over-engineering.
		ctx, cancel := context.WithTimeout(ctx, time.Second*10)
		defer cancel()
		delay := time.Millisecond * 20
	forLoop:
		for {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(delay):
				stream, _ := s.cache.Load(streamId)
				if stream != nil {
					return stream, nil
				}
				record, _, mb, blockNum, err = s.params.Registry.GetStreamWithGenesis(ctx, streamId)
				if err == nil {
					break forLoop
				}
				delay *= 2
			}
		}
	}

	stream := &streamImpl{
		params:              s.params,
		streamId:            streamId,
		lastAppliedBlockNum: blockNum,
		lastAccessedTime:    time.Now(),
	}
	stream.nodesLocked.Reset(record.Nodes, s.params.Wallet.Address)

	if !stream.nodesLocked.IsLocal() {
		stream, _ = s.cache.LoadOrStore(streamId, stream)
		return stream, nil
	}

	stream.local = &localStreamState{}

	if record.LastMiniblockNum > 0 {
		// TODO: reconcile from other nodes.
		return nil, RiverError(
			Err_INTERNAL,
			"tryLoadStreamRecord: Stream is past genesis",
			"streamId",
			streamId,
			"record",
			record,
		)
	}

	stream, _, err = s.createStreamStorage(ctx, stream, record.Nodes, mbHash, mb)
	return stream, err
}

func (s *streamCacheImpl) createStreamStorage(
	ctx context.Context,
	stream *streamImpl,
	nodes []common.Address,
	mbHash common.Hash,
	mb []byte,
) (*streamImpl, bool, error) {
	// Lock stream, so parallel creators have to wait for the stream to be intialized.
	stream.mu.Lock()
	defer stream.mu.Unlock()
	entry, loaded := s.cache.LoadOrStore(stream.streamId, stream)
	if !loaded {
		// TODO: delete entry on failures below?

		// Our stream won the race, put into storage.
		err := s.params.Storage.CreateStreamStorage(ctx, stream.streamId, nodes, mbHash, mb)
		if err != nil {
			if AsRiverError(err).Code == Err_ALREADY_EXISTS {
				// Attempt to load stream from storage. Might as well do it while under lock.
				err = stream.loadInternal(ctx)
				if err != nil {
					return nil, false, err
				}
				return stream, true, nil
			}
			return nil, false, err
		}

		// Successfully put data into storage, init stream view.
		view, err := MakeStreamView(
			ctx,
			&storage.ReadStreamFromLastSnapshotResult{
				StartMiniblockNumber: 0,
				Miniblocks:           [][]byte{mb},
			},
		)
		if err != nil {
			return nil, false, err
		}
		stream.setView(view)

		return stream, true, nil
	} else {
		// There was another record in the cache, use it.
		if entry == nil {
			return nil, false, RiverError(Err_INTERNAL, "tryLoadStreamRecord: Cache corruption", "streamId", stream.streamId)
		}
		return entry, false, nil
	}
}

func (s *streamCacheImpl) GetStreamWaitForLocal(ctx context.Context, streamId StreamId) (SyncStream, error) {
	stream, err := s.getStreamImpl(ctx, streamId, true)
	if err != nil {
		return nil, err
	}
	return stream, nil
}

func (s *streamCacheImpl) GetStreamNoWait(ctx context.Context, streamId StreamId) (SyncStream, error) {
	stream, err := s.getStreamImpl(ctx, streamId, false)
	if err != nil {
		return nil, err
	}
	return stream, nil
}

func (s *streamCacheImpl) getStreamImpl(
	ctx context.Context,
	streamId StreamId,
	waitForLocal bool,
) (*streamImpl, error) {
	stream, _ := s.cache.Load(streamId)
	if stream == nil {
		return s.tryLoadStreamRecord(ctx, streamId, waitForLocal)
	}
	return stream, nil
}

func (s *streamCacheImpl) ForceFlushAll(ctx context.Context) {
	s.cache.Range(func(streamID StreamId, stream *streamImpl) bool {
		stream.ForceFlush(ctx)
		return true
	})
}

func (s *streamCacheImpl) GetLoadedViews(ctx context.Context) []StreamView {
	var result []StreamView
	s.cache.Range(func(streamID StreamId, stream *streamImpl) bool {
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
	s.cache.Range(func(streamID StreamId, stream *streamImpl) bool {
		if stream.canCreateMiniblock() {
			candidates = append(candidates, stream)
		}
		return true
	})

	return candidates
}

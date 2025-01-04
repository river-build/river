package rpc

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"github.com/prometheus/client_golang/prometheus"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/contracts/river"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/scrub"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
)

// maxFailedConsecutiveUpdates is the maximum number of consecutive update failures allowed
// before a stream is considered corrupt.
var maxFailedConsecutiveUpdates = uint32(50)

type CorruptionReason int

const (
	NotCorrupt CorruptionReason = iota
	FetchFailed
	ScrubFailed
)

type StreamCorruptionTracker struct {
	// The following fields track metadata for determining stream corruption state.
	// Streams are considered corrupt if they are reported as corrupt from a miniblock
	// scrub or if the archiver fails to update the stream to the current block after
	// a set number of update attempts.

	// All below fields must be updated in tandem under lock.
	mu sync.RWMutex

	corrupt          bool
	corruptionReason CorruptionReason

	// Scrubbing metadata
	latestScrubbedBlock int64
	firstCorruptBlock   int64
	corruptionError     error

	// Update failure metadata
	consecutiveUpdateFailures uint32

	// Corresponding archive stream. Read-only, set on creation.
	parent *ArchiveStream
}

func (ct *StreamCorruptionTracker) IsCorrupt() bool {
	ct.mu.RLock()
	defer ct.mu.RUnlock()

	return ct.corrupt
}

// IncrementConsecutiveBlockUpdateFailures increments the internal tracker of the number of
// times we have failed to update the stream to the number of blocks currently stored in the
// contract. Whenever a stream fully updates up to the current block number as it is stored
// in the contract, this counter is reset. If the stream fails to fully update
// `maxFailedConsecutiveUpdates` times, it will be considered corrupt. This is because we
// suspect the stream may be unavailable due to a bad block, although it's also quite likely
// to be an intermittent node availability issue.
func (ct *StreamCorruptionTracker) IncrementConsecutiveBlockUpdateFailures() {
	ct.mu.Lock()
	defer ct.mu.Unlock()

	ct.consecutiveUpdateFailures = ct.consecutiveUpdateFailures + 1
	if ct.consecutiveUpdateFailures >= maxFailedConsecutiveUpdates && !ct.corrupt {
		ct.corrupt = true
		ct.corruptionReason = FetchFailed
		ct.firstCorruptBlock = ct.parent.numBlocksInDb.Load() + 1
	}
}

func (ct *StreamCorruptionTracker) ResetConsecutiveBlockUpdateFailures() {
	ct.mu.Lock()
	defer ct.mu.Unlock()

	ct.consecutiveUpdateFailures = 0

	// If the stream was marked corrupt because it was failing to fetch, this may
	// have been temporary unavailability due to an upgrade, operator outage, etc.
	// In this case once fetches to the stream are successful we'd like to mark the
	// stream as not corrupt. However, if a miniblock was detected as corrupt during
	// a stream miniblock scrub, it does not matter if the stream is fetchable on
	// the network, as it's corrupt even if it's available.
	if ct.corrupt && ct.corruptionReason == FetchFailed {
		ct.corrupt = false
		ct.firstCorruptBlock = -1
		ct.corruptionReason = NotCorrupt
	}
}

// MarkBlockCorrupt marks a block corrupt as a result of a failed scrub.
// If the stream was already marked as corrupt, say due to persistent failure to update,
// this method will update the corruption reason and the first corrupt block.
func (ct *StreamCorruptionTracker) MarkBlockCorrupt(blockNum int64, scrubErr error) error {
	ct.mu.Lock()
	defer ct.mu.Unlock()

	if blockNum <= ct.latestScrubbedBlock {
		return AsRiverError(
			fmt.Errorf("Corrupt block was already marked well-formed"),
			Err_INTERNAL,
		).Func("CorruptionTracker.MarkBlockCorrupt").
			Tag("latestScrubbedBlock", ct.latestScrubbedBlock).
			Tag("blockNum", blockNum)
	}

	if ct.corrupt && ct.corruptionReason == ScrubFailed && blockNum < ct.firstCorruptBlock {
		return AsRiverError(
			fmt.Errorf("Corrupt block was already marked well-formed"),
			Err_INTERNAL,
		).Func("CorruptionTracker.MarkBlockCorrupt").
			Tag("latestScrubbedBlock", ct.latestScrubbedBlock).
			Tag("blockNum", blockNum)
	}

	ct.corrupt = true
	// Scrub failure is a "stronger" corruption reason than fetch failure since it is not
	// potentially induced by intermittent availability or networking errors. If we detect
	// a corrupt miniblock from scrubbing, mark the stream as corrupt for this reason and
	// record the earliest detected corrupt miniblock. Since the correctness of later
	// miniblocks depends on previous miniblocks, it doesn't necessarily make sense to consider
	// any miniblocks after this one.
	if ct.corruptionReason != ScrubFailed {
		ct.corruptionReason = ScrubFailed
		ct.firstCorruptBlock = blockNum
		// We always run the scrubber starting at the lowest block number that has not yet been
		// scrubbed, so if we detect a corrupt block from scrubbing, we are guaranteed that the
		// previous block was well-formed.
		ct.latestScrubbedBlock = blockNum - 1
		ct.corruptionError = scrubErr
	}

	return nil
}

func (ct *StreamCorruptionTracker) ReportScrubSuccess(ctx context.Context, blockNum int64) {
	ct.mu.Lock()
	defer ct.mu.Unlock()

	if ct.corrupt && ct.corruptionReason == ScrubFailed {
		if blockNum >= ct.firstCorruptBlock {
			// This really should not happen. We should never see a scrub succeed where another
			// scrub failed. The code is (should be) written so that scrubbing fails on the first corrupt
			// miniblock, and we can never skip scrubbing a miniblock in a stream unless it is confirmed
			// that we have already scrubbed that miniblock. Furthermore, miniblock scrubbing is
			// deterministic.
			dlog.FromCtx(ctx).
				Error(
					"Successful scrub occurred after a failed scrub",
					"corruptBlock", ct.firstCorruptBlock,
					"scrubUntilBlockInclusive", blockNum,
				)
		}
		//
		return
	}

	if ct.latestScrubbedBlock < blockNum {
		ct.latestScrubbedBlock = blockNum
	}
}

func (ct *StreamCorruptionTracker) GetLatestScrubbedBlock() int64 {
	ct.mu.RLock()
	defer ct.mu.Unlock()

	return ct.latestScrubbedBlock
}

func (ct *StreamCorruptionTracker) GetCorruptionReason() CorruptionReason {
	ct.mu.RLock()
	defer ct.mu.Unlock()

	return ct.corruptionReason
}

func (ct *StreamCorruptionTracker) GetScrubError() error {
	ct.mu.RLock()
	defer ct.mu.Unlock()

	return ct.corruptionError
}

func (ct *StreamCorruptionTracker) GetFirstCorruptBlock() int64 {
	ct.mu.RLock()
	defer ct.mu.Unlock()

	return ct.firstCorruptBlock
}

func (ct *StreamCorruptionTracker) GetConsecutiveFailedUpdates() uint32 {
	ct.mu.RLock()
	defer ct.mu.Unlock()

	return ct.consecutiveUpdateFailures
}

// NewStreamCorruptionTracker returns a new CorruptionTracker. A constructor is needed because
// the default values of some fields are nonzero.
func NewStreamCorruptionTracker() StreamCorruptionTracker {
	return StreamCorruptionTracker{
		latestScrubbedBlock: -1,
		firstCorruptBlock:   -1,
	}
}

type ArchiveStream struct {
	streamId StreamId
	nodes    nodes.StreamNodes

	// registryState describes the state of the stream as reported by the stream
	// registry.
	numBlocksInContract atomic.Int64
	numBlocksInDb       atomic.Int64 // -1 means not loaded

	corrupt StreamCorruptionTracker

	// Mutex is used so only one archive operation is performed at a time.
	// It also protects non-atomic fields that track stream corruption state.
	mu sync.Mutex
}

func NewArchiveStream(streamId StreamId, nn *[]common.Address, lastKnownMiniblock uint64) *ArchiveStream {
	stream := &ArchiveStream{
		streamId: streamId,
		nodes:    nodes.NewStreamNodesWithLock(*nn, common.Address{}),
		corrupt:  NewStreamCorruptionTracker(),
	}
	stream.numBlocksInContract.Store(int64(lastKnownMiniblock + 1))
	stream.numBlocksInDb.Store(-1)
	// Set circular reference
	stream.corrupt.parent = stream

	return stream
}

type Archiver struct {
	config       *config.ArchiveConfig
	contract     *registries.RiverRegistryContract
	nodeRegistry nodes.NodeRegistry
	storage      storage.StreamStorage

	// Miniblock scrubbing
	scrubber scrub.MiniblockScrubber
	reports  chan<- *scrub.MiniblockScrubReport

	// Task management
	tasks     chan StreamId
	workersWG sync.WaitGroup

	// tasksWG is used in single run mode: it archives everything there is to archive and exits
	tasksWG *sync.WaitGroup

	streams sync.Map

	// set to done when archiver has started
	startedWG sync.WaitGroup

	// Statistics
	streamsExamined            atomic.Uint64
	streamsCreated             atomic.Uint64
	streamsUpToDate            atomic.Uint64
	successOpsCount            atomic.Uint64
	failedOpsCount             atomic.Uint64
	miniblocksProcessed        atomic.Uint64
	newStreamAllocated         atomic.Uint64
	streamPlacementUpdated     atomic.Uint64
	streamLastMiniblockUpdated atomic.Uint64

	// metrics
	nodeAdvances *prometheus.CounterVec
}

type ArchiverStats struct {
	StreamsExamined            uint64
	StreamsCreated             uint64
	StreamsUpToDate            uint64
	SuccessOpsCount            uint64
	FailedOpsCount             uint64
	MiniblocksProcessed        uint64
	NewStreamAllocated         uint64
	StreamPlacementUpdated     uint64
	StreamLastMiniblockUpdated uint64
}

func NewArchiver(
	config *config.ArchiveConfig,
	contract *registries.RiverRegistryContract,
	nodeRegistry nodes.NodeRegistry,
	storage storage.StreamStorage,
) *Archiver {
	reports := make(chan *scrub.MiniblockScrubReport, 50)
	a := &Archiver{
		config:       config,
		contract:     contract,
		nodeRegistry: nodeRegistry,
		storage:      storage,
		tasks:        make(chan StreamId, config.GetTaskQueueSize()),
		reports:      reports,
		scrubber:     scrub.NewMiniblockScrubber(storage, 0, reports),
	}
	a.startedWG.Add(1)
	return a
}

func (a *Archiver) setupStatisticsMetrics(factory infra.MetricsFactory) {
	factory.NewGaugeFunc(
		prometheus.GaugeOpts{
			Name: "stats_streams_examined",
			Help: "Total streams monitored by the archiver",
		},
		func() float64 { return float64(a.streamsExamined.Load()) },
	)
	factory.NewGaugeFunc(
		prometheus.GaugeOpts{
			Name: "stats_streams_created",
			Help: "Total streams allocated on disk by the archiver since the last boot",
		},
		func() float64 { return float64(a.streamsCreated.Load()) },
	)
	factory.NewGaugeFunc(
		prometheus.GaugeOpts{
			Name: "stats_streams_up_to_date",
			Help: "Total ArchiveStream executions where stream was already up to date",
		},
		func() float64 { return float64(a.streamsUpToDate.Load()) },
	)
	factory.NewGaugeFunc(
		prometheus.GaugeOpts{
			Name: "stats_success_ops_count",
			Help: "Total successful ArchiveStream executions",
		},
		func() float64 { return float64(a.successOpsCount.Load()) },
	)
	factory.NewGaugeFunc(
		prometheus.GaugeOpts{
			Name: "stats_failed_ops_count",
			Help: "Total ArchiveStream executions that produced errors",
		},
		func() float64 { return float64(a.failedOpsCount.Load()) },
	)
	factory.NewGaugeFunc(
		prometheus.GaugeOpts{
			Name: "stats_miniblocks_processed",
			Help: "Total miniblocks downloaded and stored since the last boot",
		},
		func() float64 { return float64(a.miniblocksProcessed.Load()) },
	)
	factory.NewGaugeFunc(
		prometheus.GaugeOpts{
			Name: "stats_new_stream_allocated",
			Help: "Total streams allocated in response to detected stream allocation events",
		},
		func() float64 { return float64(a.newStreamAllocated.Load()) },
	)
	factory.NewGaugeFunc(
		prometheus.GaugeOpts{
			Name: "stats_stream_placement_updated",
			Help: "Total stream placement changes",
		},
		func() float64 { return float64(a.streamPlacementUpdated.Load()) },
	)
	factory.NewGaugeFunc(
		prometheus.GaugeOpts{
			Name: "stats_stream_last_miniblock_updated",
			Help: "Total miniblock update events",
		},
		func() float64 { return float64(a.streamLastMiniblockUpdated.Load()) },
	)

	a.nodeAdvances = factory.NewCounterVecEx(
		"node_advances",
		"Total times a node was advanced, indicating it was behind or returned an error response",
		"node_address",
	)
}

// getCorruptStreams iterates over all streams in the in-memory cache and collects ids for
// streams that are considered corrupt. This list does not represent a snapshot of the archiver
// at any particular state, as the cache iteration is not thread-safe. However, for the purposes
// of generating a periodic report of corrupt streams, this is good enough.
func (a *Archiver) getCorruptStreams(ctx context.Context) map[StreamId]*ArchiveStream {
	corruptStreams := make(map[StreamId]*ArchiveStream, 0)

	a.streams.Range(
		func(key, value any) bool {
			stream, ok := value.(*ArchiveStream)
			if ok && stream.corrupt.IsCorrupt() {
				corruptStreams[stream.streamId] = stream
			} else if !ok {
				dlog.FromCtx(ctx).
					Error("Unexpected value stored in stream cache (not an ArchiveStream)", "value", value)
			}

			return true
		},
	)

	return corruptStreams
}

func (a *Archiver) addNewStream(
	ctx context.Context,
	streamId StreamId,
	nn *[]common.Address,
	lastKnownMiniblock uint64,
) {
	_, loaded := a.streams.LoadOrStore(streamId, NewArchiveStream(streamId, nn, lastKnownMiniblock))
	if loaded {
		// TODO: Double notification, shouldn't happen.
		dlog.FromCtx(ctx).
			Error("Stream already exists in archiver map", "streamId", streamId, "lastKnownMiniblock", lastKnownMiniblock)
		return
	}

	a.tasks <- streamId

	a.streamsExamined.Add(1)
}

// ArchiveStream attempts to add all new miniblocks seen, according to the registry contract,
// since the last time the stream was archived into storage.  It creates a new stream for
// streams that have not yet been seen.
func (a *Archiver) ArchiveStream(ctx context.Context, stream *ArchiveStream) (err error) {
	defer func() {
		if err != nil {
			stream.corrupt.IncrementConsecutiveBlockUpdateFailures()
		}
	}()
	log := dlog.FromCtx(ctx)

	if !stream.mu.TryLock() {
		// Reschedule with delay.
		streamId := stream.streamId
		time.AfterFunc(time.Second, func() {
			a.tasks <- streamId
		})
		return nil
	}
	defer stream.mu.Unlock()

	mbsInDb := stream.numBlocksInDb.Load()

	// Check if stream info was loaded from db.
	if mbsInDb <= -1 {
		maxBlockNum, err := a.storage.GetMaxArchivedMiniblockNumber(ctx, stream.streamId)
		if err != nil && AsRiverError(err).Code == Err_NOT_FOUND {
			err = a.storage.CreateStreamArchiveStorage(ctx, stream.streamId)
			if err != nil {
				return err
			}
			a.streamsCreated.Add(1)

			mbsInDb = 0
			stream.numBlocksInDb.Store(mbsInDb)
		} else if err != nil {
			return err
		} else {
			mbsInDb = maxBlockNum + 1
			stream.numBlocksInDb.Store(mbsInDb)
		}
	}

	mbsInContract := stream.numBlocksInContract.Load()
	if mbsInDb >= mbsInContract {
		a.streamsUpToDate.Add(1)
		stream.corrupt.ResetConsecutiveBlockUpdateFailures()
		return nil
	}

	log.Debug(
		"Archiving stream",
		"streamId",
		stream.streamId,
		"numBlocksInDb",
		mbsInDb,
		"numBlocksInContract",
		mbsInContract,
	)

	nodeAddr := stream.nodes.GetStickyPeer()

	stub, err := a.nodeRegistry.GetStreamServiceClientForAddress(nodeAddr)
	if err != nil {
		return err
	}

	for mbsInDb < mbsInContract {

		toBlock := min(mbsInDb+int64(a.config.GetReadMiniblocksSize()), mbsInContract)

		resp, err := stub.GetMiniblocks(
			ctx,
			connect.NewRequest(&GetMiniblocksRequest{
				StreamId:      stream.streamId[:],
				FromInclusive: mbsInDb,
				ToExclusive:   toBlock,
			}),
		)
		if err != nil && AsRiverError(err).Code != Err_NOT_FOUND {
			log.Warn(
				"Error when calling GetMiniblocks on server",
				"error",
				err,
				"streamId",
				stream.streamId,
				"node",
				nodeAddr.Hex(),
			)

			// Advance node
			if a.nodeAdvances != nil {
				a.nodeAdvances.With(prometheus.Labels{"node_address": nodeAddr.String()}).Inc()
			}
			stream.nodes.AdvanceStickyPeer(nodeAddr)

			// Reschedule all streams unless this stream has passed the threshold of maximum failed
			// update attempts. If the stream's miniblocks are updated in the contract, this stream
			// will be re-added to the task queue and another attempt to archive it's most recent blocks
			// will be made.
			if stream.corrupt.GetConsecutiveFailedUpdates() < maxFailedConsecutiveUpdates {
				time.AfterFunc(5*time.Second, func() {
					a.tasks <- stream.streamId
				})
			}
			return err
		}

		if (err != nil && AsRiverError(err).Code == Err_NOT_FOUND) || resp.Msg == nil || len(resp.Msg.Miniblocks) == 0 {
			// If the stream is unable to fully update, consider this attempt to archive the stream as
			// a failure, but not an error.
			stream.corrupt.IncrementConsecutiveBlockUpdateFailures()

			log.Debug(
				"ArchiveStream: GetMiniblocks did not return data, remote storage is not up-to-date with contract yet",
				"streamId",
				stream.streamId,
				"fromInclusive",
				mbsInDb,
				"toExclusive",
				toBlock,
			)

			// Advance node
			if a.nodeAdvances != nil {
				a.nodeAdvances.With(prometheus.Labels{"node_address": nodeAddr.String()}).Inc()
			}
			stream.nodes.AdvanceStickyPeer(nodeAddr)

			// Reschedule with delay.
			if !stream.corrupt.IsCorrupt() {
				streamId := stream.streamId
				time.AfterFunc(time.Second, func() {
					a.tasks <- streamId
				})
			}
			return nil
		}

		msg := resp.Msg

		// Validate miniblocks are sequential.
		// TODO: validate miniblock signatures.
		var serialized [][]byte
		for i, mb := range msg.Miniblocks {
			// Parse header
			info, err := events.NewMiniblockInfoFromProto(
				mb,
				events.NewParsedMiniblockInfoOpts().
					WithExpectedBlockNumber(int64(i)+mbsInDb).
					WithDoNotParseEvents(true),
			)
			if err != nil {
				return err
			}
			bb, err := info.ToBytes()
			if err != nil {
				return err
			}
			serialized = append(serialized, bb)
		}

		log.Debug("Writing miniblocks to storage", "streamId", stream.streamId, "numBlocks", len(serialized))

		err = a.storage.WriteArchiveMiniblocks(ctx, stream.streamId, mbsInDb, serialized)
		if err != nil {
			return err
		}
		mbsInDb += int64(len(serialized))
		stream.numBlocksInDb.Store(mbsInDb)

		a.miniblocksProcessed.Add(uint64(len(serialized)))
	}

	// Update the consecutive updates counter to reflect that the miniblocks were available
	// on the network.
	stream.corrupt.ResetConsecutiveBlockUpdateFailures()
	return nil
}

func (a *Archiver) emitPeriodicCorruptStreamReport(ctx context.Context) {
	ticker := time.NewTicker(15 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			corruptStreams := a.getCorruptStreams(ctx)

			var builder strings.Builder
			builder.WriteString("StreamId")
			for _, as := range corruptStreams {
				builder.WriteString(as.streamId.String())
				builder.WriteString(",")
				builder.WriteString(fmt.Sprintf("%d", as.corrupt.GetFirstCorruptBlock()))
				builder.WriteString("\n")
			}
			dlog.FromCtx(ctx).
				Info("Corrupt streams report", "total", len(corruptStreams), "streams", builder.String())
		}
	}
}

func (a *Archiver) Start(ctx context.Context, once bool, metrics infra.MetricsFactory, exitSignal chan<- error) {
	defer a.startedWG.Done()
	go a.emitPeriodicCorruptStreamReport(ctx)
	err := a.startImpl(ctx, once, metrics)
	if err != nil {
		exitSignal <- err
	}
}

func (a *Archiver) startImpl(ctx context.Context, once bool, metrics infra.MetricsFactory) error {
	if once {
		a.tasksWG = &sync.WaitGroup{}
	} else if metrics != nil {
		dlog.FromCtx(ctx).Info("Setting up metrics")
		a.setupStatisticsMetrics(metrics)
	}

	numWorkers := a.config.GetWorkerPoolSize()
	for i := 0; i < numWorkers; i++ {
		a.workersWG.Add(1)
		go a.worker(ctx)
	}

	blockNum := a.contract.Blockchain.InitialBlockNum
	totalCount, err := a.contract.GetStreamCount(ctx, blockNum)
	if err != nil {
		return err
	}

	log := dlog.FromCtx(ctx)
	log.Info(
		"Reading stream registry for contract state of streams",
		"blockNum",
		blockNum,
		"totalCount",
		totalCount,
	)

	// Copy page size to the river registry contract for implicit use with ForAllStreams
	a.contract.Settings.PageSize = int(a.config.GetStreamsContractCallPageSize())

	if err := a.contract.ForAllStreams(
		ctx,
		blockNum,
		func(stream *registries.GetStreamResult) bool {
			if stream.StreamId == registries.ZeroBytes32 {
				return true
			}
			if a.tasksWG != nil {
				a.tasksWG.Add(1)
			}

			a.addNewStream(ctx, stream.StreamId, &stream.Nodes, stream.LastMiniblockNum)
			return true
		},
	); err != nil {
		return err
	}

	if !once {
		log.Info("Listening to stream events", "blockNum", blockNum+1)
		err := a.contract.OnStreamEvent(
			ctx,
			blockNum+1,
			a.onStreamAllocated,
			a.onStreamLastMiniblockUpdated,
			a.onStreamPlacementUpdated,
		)
		if err != nil {
			return err
		}
	}

	return nil
}

func (a *Archiver) onStreamAllocated(ctx context.Context, event *river.StreamRegistryV1StreamAllocated) {
	a.newStreamAllocated.Add(1)
	id := StreamId(event.StreamId)
	a.addNewStream(ctx, id, &event.Nodes, 0)
	a.tasks <- id
}

func (a *Archiver) onStreamPlacementUpdated(
	ctx context.Context,
	event *river.StreamRegistryV1StreamPlacementUpdated,
) {
	a.streamPlacementUpdated.Add(1)

	id := StreamId(event.StreamId)
	record, loaded := a.streams.Load(id)
	if !loaded {
		dlog.FromCtx(ctx).Error("onStreamPlacementUpdated: Stream not found in map", "streamId", id)
		return
	}
	stream := record.(*ArchiveStream)
	_ = stream.nodes.Update(event, common.Address{})
}

func (a *Archiver) onStreamLastMiniblockUpdated(
	ctx context.Context,
	event *river.StreamRegistryV1StreamLastMiniblockUpdated,
) {
	a.streamLastMiniblockUpdated.Add(1)

	id := StreamId(event.StreamId)
	record, loaded := a.streams.Load(id)
	if !loaded {
		dlog.FromCtx(ctx).Error("onStreamLastMiniblockUpdated: Stream not found in map", "streamId", id)
		return
	}
	stream := record.(*ArchiveStream)
	stream.numBlocksInContract.Store(int64(event.LastMiniblockNum + 1))
	a.tasks <- id
}

func (a *Archiver) WaitForWorkers() {
	a.workersWG.Wait()
}

// Waiting for tasks is only possible if archiver is started in "once" mode.
func (a *Archiver) WaitForTasks() {
	a.tasksWG.Wait()
}

func (a *Archiver) WaitForStart() {
	a.startedWG.Wait()
}

func (a *Archiver) GetStats() *ArchiverStats {
	return &ArchiverStats{
		StreamsExamined:            a.streamsExamined.Load(),
		StreamsCreated:             a.streamsCreated.Load(),
		StreamsUpToDate:            a.streamsUpToDate.Load(),
		SuccessOpsCount:            a.successOpsCount.Load(),
		FailedOpsCount:             a.failedOpsCount.Load(),
		MiniblocksProcessed:        a.miniblocksProcessed.Load(),
		NewStreamAllocated:         a.newStreamAllocated.Load(),
		StreamPlacementUpdated:     a.streamPlacementUpdated.Load(),
		StreamLastMiniblockUpdated: a.streamLastMiniblockUpdated.Load(),
	}
}

func (a *Archiver) worker(ctx context.Context) {
	log := dlog.FromCtx(ctx)

	defer a.workersWG.Done()

	for {
		select {
		case <-ctx.Done():
			return
		case streamId := <-a.tasks:
			record, loaded := a.streams.Load(streamId)
			if !loaded {
				log.Error("archiver.worker: Stream not found in map", "streamId", streamId)
				continue
			}
			err := a.ArchiveStream(ctx, record.(*ArchiveStream))
			if err != nil {
				log.Error("archiver.worker: Failed to archive stream", "error", err, "streamId", streamId)
				a.failedOpsCount.Add(1)
			} else {
				a.successOpsCount.Add(1)
			}
			if a.tasksWG != nil {
				a.tasksWG.Done()
			}
		}
	}
}

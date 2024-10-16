package sync

import (
	"context"
	"crypto/sha256"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/river-build/river/core/node/infra"
	"math/big"
	"slices"
	"sync"

	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/contracts/river"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/shared"
)

const DefaultStreamsTrackerWorkerCount = 50

type StreamsTracker struct {
	riverRegistry *registries.RiverRegistryContract
	workers       []*streamsTrackerWorker
	metrics       infra.MetricsFactory
}

// NewStreamsTracker create stream tracker instance.
func NewStreamsTracker(
	ctx context.Context,
	onChainConfig crypto.OnChainConfiguration,
	workersCount uint,
	riverRegistry *registries.RiverRegistryContract,
	nodes nodes.NodeRegistry,
	listener events.StreamEventListener,
	storage events.UserPreferencesStore,
	metrics infra.MetricsFactory,
) (*StreamsTracker, error) {
	if workersCount <= 0 {
		workersCount = DefaultStreamsTrackerWorkerCount
	}

	tracker := &StreamsTracker{
		riverRegistry: riverRegistry,
		workers:       make([]*streamsTrackerWorker, workersCount),
		metrics:       metrics,
	}

	// subscribe to stream events in river registry
	tracker.riverRegistry.OnStreamEvent(
		ctx,
		tracker.riverRegistry.Blockchain.InitialBlockNum,
		tracker.StreamAllocated,
		tracker.StreamLastMiniblockUpdated,
		tracker.StreamPlacementUpdated,
	)

	log := dlog.FromCtx(ctx)
	validNodes := nodes.GetValidNodeAddresses()

	// load streams and distribute streams by hashing the stream id over buckets and assign each bucket
	// to a worker to process stream updates.
	streamBuckets := make([][]*registries.GetStreamResult, workersCount)
	streamsLoaded := 0

	err := tracker.riverRegistry.ForAllStreams(
		ctx,
		tracker.riverRegistry.Blockchain.InitialBlockNum,
		func(stream *registries.GetStreamResult) bool {
			if tracker.TrackStreamForNotifications(stream.StreamId) {
				// there are some streams corrupted and managed by a node that isn't registered anymore.
				// filter these out because we can't sync these streams.
				stream.Nodes = slices.DeleteFunc(stream.Nodes, func(address common.Address) bool {
					return !slices.Contains(validNodes, address)
				})

				if len(stream.Nodes) == 0 {
					log.Warn("Ignore stream, no valid node", "stream", stream.StreamId)
					return true
				}

				// distribute streams in buckets for parallel processing
				idx := tracker.workerIndex(stream.StreamId)
				streamBuckets[idx] = append(streamBuckets[idx], stream)

				streamsLoaded++
			}
			return true
		})

	if err != nil {
		return nil, err
	}

	log.Info("Loaded streams from streams registry", "count", streamsLoaded, "workers", len(tracker.workers))

	// create workers in the background in parallel and ensure that all initialized successful.
	var (
		initCtx, cancel = context.WithCancel(ctx)
		tasks           sync.WaitGroup
		muErrors        sync.Mutex
		errors          []error
	)

	defer cancel()

	workerMetrics := createWorkerMetrics(metrics)

	tasks.Add(int(workersCount))
	for i := range workersCount {
		go func() {
			worker, err := NewStreamsTrackerWorker(initCtx, i, onChainConfig, tracker.riverRegistry, nodes,
				streamBuckets[i], listener, storage, workerMetrics)
			if err == nil {
				tracker.workers[i] = worker
			} else {
				muErrors.Lock()
				errors = append(errors, err)
				muErrors.Unlock()
				cancel()
			}
			tasks.Done()
		}()
	}

	tasks.Wait()

	if len(errors) > 0 {
		return nil, errors[0]
	}

	return tracker, nil
}

func createWorkerMetrics(metrics infra.MetricsFactory) *streamsTrackerWorkerMetrics {
	trackedStreamsGauge := metrics.NewGaugeVecEx(
		"tracked_streams", "Number of tracked streams, grouped per type and if down or up",
		"stream_type", "status",
	)

	return &streamsTrackerWorkerMetrics{
		trackedStreamsMessageCounter: metrics.NewCounter(prometheus.CounterOpts{
			Name: "tracked_streams_msg_count",
			Help: "Received stream messages",
		}),
		trackedDMStreamsUp:             trackedStreamsGauge.With(prometheus.Labels{"stream_type": "dm", "status": "up"}),
		trackedDMStreamsDown:           trackedStreamsGauge.With(prometheus.Labels{"stream_type": "dm", "status": "down"}),
		trackedGDMStreamsUp:            trackedStreamsGauge.With(prometheus.Labels{"stream_type": "gdm", "status": "up"}),
		trackedGDMStreamsDown:          trackedStreamsGauge.With(prometheus.Labels{"stream_type": "gdm", "status": "down"}),
		trackedSpaceChannelStreamsUp:   trackedStreamsGauge.With(prometheus.Labels{"stream_type": "space_channel", "status": "up"}),
		trackedSpaceChannelStreamsDown: trackedStreamsGauge.With(prometheus.Labels{"stream_type": "space_channel", "status": "down"}),
		trackedUserSettingsStreamsUp:   trackedStreamsGauge.With(prometheus.Labels{"stream_type": "user_settings", "status": "up"}),
		trackedUserSettingsStreamsDown: trackedStreamsGauge.With(prometheus.Labels{"stream_type": "user_settings", "status": "down"}),
	}
}

// Run the stream tracker workers until the given ctx expires.
func (tracker *StreamsTracker) Run(ctx context.Context) {
	var (
		log         = dlog.FromCtx(ctx)
		workerTasks sync.WaitGroup
	)

	workerTasks.Add(len(tracker.workers))
	for _, w := range tracker.workers {
		go func() {
			w.run(ctx)
			workerTasks.Done()
		}()
	}
	workerTasks.Wait()

	log.Info("stream tracker stopped")
}

// TrackStreamForNotifications returns true if the given streamID must be tracked for notifications.
func (tracker *StreamsTracker) TrackStreamForNotifications(streamID shared.StreamId) bool {
	streamType := streamID.Type()

	return streamType == shared.STREAM_DM_CHANNEL_BIN ||
		streamType == shared.STREAM_GDM_CHANNEL_BIN ||
		streamType == shared.STREAM_CHANNEL_BIN ||
		streamType == shared.STREAM_USER_SETTINGS_BIN // user adds address of blocked users into his settings stream
}

// workerID determines the worker index that is responsible for handling the stream. It calculates the sha256 hash over
// the stream and determines the worker index by interpreting the sha256 digest as a big endian number and taking the
// result of that number mod N with N as the number of workers.
func (tracker *StreamsTracker) workerIndex(streamID shared.StreamId) int {
	var (
		digest = sha256.Sum256(streamID[:])
		num    = new(big.Int).SetBytes(digest[:])
		N      = big.NewInt(int64(len(tracker.workers)))
	)
	return int(new(big.Int).Mod(num, N).Int64())
}

// StreamAllocated is called each time a stream is allocated in the river registry.
// If the stream must be tracked for notifications add it to the worker that is responsible for it.
func (tracker *StreamsTracker) StreamAllocated(
	_ context.Context,
	event *river.StreamRegistryV1StreamAllocated,
) {
	streamID := shared.StreamId(event.StreamId)
	if tracker.TrackStreamForNotifications(streamID) {
		go func() {
			workerIdx := tracker.workerIndex(streamID)
			worker := tracker.workers[workerIdx]
			worker.streamAddRequests <- &streamSyncProgress{
				streamID:  streamID,
				nodes:     event.Nodes,
				allocated: true,
			}
		}()
	}
}

func (tracker *StreamsTracker) StreamLastMiniblockUpdated(
	context.Context,
	*river.StreamRegistryV1StreamLastMiniblockUpdated,
) {
	// miniblocks are processed when a stream event with a block header is received for the stream
}

func (tracker *StreamsTracker) StreamPlacementUpdated(
	context.Context,
	*river.StreamRegistryV1StreamPlacementUpdated,
) {
	// reserved for future use
}

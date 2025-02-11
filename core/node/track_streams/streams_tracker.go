package track_streams

import (
	"context"
	"math/rand"
	"slices"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/common"

	"github.com/river-build/river/core/contracts/river"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/logging"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/shared"
)

type StreamFilter interface {
	// These methods are exposed to allow embedders to override them. The implementation
	// below casts itself as the StreamsTracker interface before calling these methods,
	// so overrides will be enforced in structs that embed it.
	TrackStream(streamID shared.StreamId) bool

	NewTrackedStream(
		ctx context.Context,
		streamID shared.StreamId,
		cfg crypto.OnChainConfiguration,
		stream *protocol.StreamAndCookie,
	) (events.TrackedStreamView, error)
}

type StreamsTracker interface {
	Run(ctx context.Context) error
}

// The StreamsTrackerImpl implements watching the river registry, detecting new streams, and syncing them.
// It defers to the filterto determine whether a stream should be tracked and to create new tracked stream
// views, which are application-specific. The filter struct may embed this implementation and provide these
// methods for encapsulation.
type StreamsTrackerImpl struct {
	filter         StreamFilter
	nodeRegistries []nodes.NodeRegistry
	riverRegistry  *registries.RiverRegistryContract
	onChainConfig  crypto.OnChainConfiguration
	listener       StreamEventListener
	metrics        *TrackStreamsSyncMetrics
	tracked        sync.Map // map[shared.StreamId] = struct{}
	syncRunner     *SyncRunner
}

// NewStreamsTracker creates a stream tracker instance.
func NewStreamsTracker(
	ctx context.Context,
	onChainConfig crypto.OnChainConfiguration,
	riverRegistry *registries.RiverRegistryContract,
	nodeRegistries []nodes.NodeRegistry,
	listener StreamEventListener,
	filter StreamFilter,
	metricsFactory infra.MetricsFactory,
) (*StreamsTrackerImpl, error) {
	tracker := &StreamsTrackerImpl{}
	if err := tracker.Init(ctx, onChainConfig, riverRegistry, nodeRegistries, listener, filter, metricsFactory); err != nil {
		return nil, err
	}

	return tracker, nil
}

// Init can be used by a struct embedded the StreamsTrackerImpl to initialize it.
func (tracker *StreamsTrackerImpl) Init(
	ctx context.Context,
	onChainConfig crypto.OnChainConfiguration,
	riverRegistry *registries.RiverRegistryContract,
	nodeRegistries []nodes.NodeRegistry,
	listener StreamEventListener,
	filter StreamFilter,
	metricsFactory infra.MetricsFactory,
) error {
	tracker.metrics = NewTrackStreamsSyncMetrics(metricsFactory)
	tracker.riverRegistry = riverRegistry
	tracker.onChainConfig = onChainConfig
	tracker.nodeRegistries = nodeRegistries
	tracker.listener = listener
	tracker.filter = filter
	tracker.syncRunner = NewSyncRunner()

	// Subscribe to stream events in river registry
	if err := tracker.riverRegistry.OnStreamEvent(
		ctx,
		tracker.riverRegistry.Blockchain.InitialBlockNum,
		tracker.OnStreamAllocated,
		tracker.OnStreamLastMiniblockUpdated,
		tracker.OnStreamPlacementUpdated,
	); err != nil {
		return err
	}

	return nil
}

func (tracker *StreamsTrackerImpl) Listener() StreamEventListener {
	return tracker.listener
}

// Run the stream tracker workers until the given ctx expires.
func (tracker *StreamsTrackerImpl) Run(ctx context.Context) error {
	// load streams and distribute streams by hashing the stream id over buckets and assign each bucket
	// to a worker to process stream updates.
	var (
		log                   = logging.FromCtx(ctx)
		validNodes            = tracker.nodeRegistries[0].GetValidNodeAddresses()
		streamsLoaded         = 0
		totalStreams          = 0
		streamsLoadedProgress = 0
		start                 = time.Now()
	)

	err := tracker.riverRegistry.ForAllStreams(
		ctx,
		tracker.riverRegistry.Blockchain.InitialBlockNum,
		func(stream *registries.GetStreamResult) bool {
			// print progress report every 50k streams that are added to track
			if streamsLoaded > 0 && streamsLoaded%50_000 == 0 && streamsLoadedProgress != streamsLoaded {
				log.Infow("Progress stream loading", "tracked", streamsLoaded, "total", totalStreams)
				streamsLoadedProgress = streamsLoaded
			}

			totalStreams++

			if !tracker.filter.TrackStream(stream.StreamId) {
				return true
			}

			// there are some streams managed by a node that isn't registered anymore.
			// filter these out because we can't sync these streams.
			stream.Nodes = slices.DeleteFunc(stream.Nodes, func(address common.Address) bool {
				return !slices.Contains(validNodes, address)
			})

			if len(stream.Nodes) == 0 {
				// We know that we have a set of these on the network because some nodes were accidentally deployed
				// with the wrong addresses early in the network's history. We've deemed these streams not worthy
				// of repairing and generally ignore them.
				log.Debugw("Ignore stream, no valid node found", "stream", stream.StreamId)
				return true
			}

			streamsLoaded++

			// start stream sync session for stream if it hasn't seen before
			_, loaded := tracker.tracked.LoadOrStore(stream.StreamId, struct{}{})
			if !loaded {
				// start tracking the stream until ctx expires
				go func() {
					idx := rand.Int63n(int64(len(tracker.nodeRegistries)))
					tracker.syncRunner.Run(
						ctx,
						stream,
						false,
						tracker.nodeRegistries[idx],
						tracker.onChainConfig,
						tracker.filter.NewTrackedStream,
						tracker.metrics,
					)
				}()
			}

			return true
		})
	if err != nil {
		return err
	}

	log.Infow("Loaded streams from streams registry",
		"count", streamsLoaded,
		"total", totalStreams,
		"took", time.Since(start).String())

	// wait till service stopped
	<-ctx.Done()

	log.Infow("stream tracker stopped")

	return nil
}

// OnStreamAllocated is called each time a stream is allocated in the river registry.
// If the stream must be tracked for the service, then add it to the worker that is
// responsible for it.
func (tracker *StreamsTrackerImpl) OnStreamAllocated(
	ctx context.Context,
	event *river.StreamRegistryV1StreamAllocated,
) {
	streamID := shared.StreamId(event.StreamId)
	if !tracker.filter.TrackStream(streamID) {
		return
	}

	_, loaded := tracker.tracked.LoadOrStore(streamID, struct{}{})
	if !loaded {
		go func() {
			stream := &registries.GetStreamResult{
				StreamId: streamID,
				Nodes:    event.Nodes,
			}

			idx := rand.Int63n(int64(len(tracker.nodeRegistries)))
			tracker.syncRunner.Run(
				ctx,
				stream,
				true,
				tracker.nodeRegistries[idx],
				tracker.onChainConfig,
				tracker.filter.NewTrackedStream,
				tracker.metrics,
			)
		}()
	}
}

func (tracker *StreamsTrackerImpl) OnStreamLastMiniblockUpdated(
	context.Context,
	*river.StreamRegistryV1StreamLastMiniblockUpdated,
) {
	// miniblocks are processed when a stream event with a block header is received for the stream
}

func (tracker *StreamsTrackerImpl) OnStreamPlacementUpdated(
	context.Context,
	*river.StreamRegistryV1StreamPlacementUpdated,
) {
	// reserved when replacements are introduced
	// 1. stop existing sync operation
	// 2. restart it against the new node
}

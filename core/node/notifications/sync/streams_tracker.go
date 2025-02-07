package sync

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
	"github.com/river-build/river/core/node/track_streams"
)

type StreamsTracker struct {
	nodeRegistries []nodes.NodeRegistry
	riverRegistry  *registries.RiverRegistryContract
	// prevent making too many requests at the same time to a remote.
	// keep per remote a worker pool that limits the number of concurrent requests.
	onChainConfig crypto.OnChainConfiguration
	listener      StreamEventListener
	storage       UserPreferencesStore
	metrics       *track_streams.TrackStreamsSyncMetrics
	tracked       sync.Map // map[shared.StreamId] = struct{}
	syncRunner    *track_streams.SyncRunner
}

// NewStreamsTracker creates a stream tracker instance.
func NewStreamsTracker(
	ctx context.Context,
	onChainConfig crypto.OnChainConfiguration,
	riverRegistry *registries.RiverRegistryContract,
	nodeRegistries []nodes.NodeRegistry,
	listener StreamEventListener,
	storage UserPreferencesStore,
	metricsFactory infra.MetricsFactory,
) (*StreamsTracker, error) {
	metrics := track_streams.NewTrackStreamsSyncMetrics(metricsFactory)

	tracker := &StreamsTracker{
		riverRegistry:  riverRegistry,
		onChainConfig:  onChainConfig,
		nodeRegistries: nodeRegistries,
		listener:       listener,
		storage:        storage,
		metrics:        metrics,
		syncRunner:     track_streams.NewSyncRunner(),
	}

	// subscribe to stream events in river registry
	if err := tracker.riverRegistry.OnStreamEvent(
		ctx,
		tracker.riverRegistry.Blockchain.InitialBlockNum,
		tracker.OnStreamAllocated,
		tracker.OnStreamLastMiniblockUpdated,
		tracker.OnStreamPlacementUpdated,
	); err != nil {
		return nil, err
	}

	return tracker, nil
}

func (tracker *StreamsTracker) newTrackedStreamViewForNotifications(
	ctx context.Context,
	streamID shared.StreamId,
	cfg crypto.OnChainConfiguration,
	stream *protocol.StreamAndCookie,
) (events.TrackedStreamView, error) {
	return NewTrackedStreamForNotifications(ctx, streamID, cfg, stream, tracker.listener, tracker.storage)
}

// Run the stream tracker workers until the given ctx expires.
func (tracker *StreamsTracker) Run(ctx context.Context) error {
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

			if !tracker.TrackStreamForNotifications(stream.StreamId) {
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
						tracker.newTrackedStreamViewForNotifications,
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

// TrackStreamForNotifications returns true if the given streamID must be tracked for notifications.
func (tracker *StreamsTracker) TrackStreamForNotifications(streamID shared.StreamId) bool {
	streamType := streamID.Type()

	return streamType == shared.STREAM_DM_CHANNEL_BIN ||
		streamType == shared.STREAM_GDM_CHANNEL_BIN ||
		streamType == shared.STREAM_CHANNEL_BIN ||
		streamType == shared.STREAM_USER_SETTINGS_BIN // users add addresses of blocked users into their settings stream
}

// OnStreamAllocated is called each time a stream is allocated in the river registry.
// If the stream must be tracked for notifications add it to the worker that is responsible for it.
func (tracker *StreamsTracker) OnStreamAllocated(
	ctx context.Context,
	event *river.StreamRegistryV1StreamAllocated,
) {
	streamID := shared.StreamId(event.StreamId)
	if !tracker.TrackStreamForNotifications(streamID) {
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
				tracker.newTrackedStreamViewForNotifications,
				tracker.metrics,
			)
		}()
	}
}

func (tracker *StreamsTracker) OnStreamLastMiniblockUpdated(
	context.Context,
	*river.StreamRegistryV1StreamLastMiniblockUpdated,
) {
	// miniblocks are processed when a stream event with a block header is received for the stream
}

func (tracker *StreamsTracker) OnStreamPlacementUpdated(
	context.Context,
	*river.StreamRegistryV1StreamPlacementUpdated,
) {
	// reserved when replacements are introduced
	// 1. stop existing sync operation
	// 2. restart it against the new node
}

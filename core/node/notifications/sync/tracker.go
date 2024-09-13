package sync

import (
	"context"
	"crypto/sha256"
	"github.com/river-build/river/core/node/crypto"
	"math/big"
	"slices"
	"sync"

	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/contracts/river"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/notifications/push"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/shared"
)

const DefaultStreamsTrackerWorkerCount = 10

type StreamsTracker struct {
	riverRegistry *registries.RiverRegistryContract
	workers       []*streamsTrackerWorker
}

// NewStreamsTracker create stream tracker instance.
func NewStreamsTracker(
	ctx context.Context,
	onChainConfig crypto.OnChainConfiguration,
	workersCount uint,
	riverRegistry *registries.RiverRegistryContract,
	nodes nodes.NodeRegistry,
	notifier push.MessageNotifier,
) (*StreamsTracker, error) {
	if workersCount <= 0 {
		workersCount = DefaultStreamsTrackerWorkerCount
	}

	tracker := &StreamsTracker{
		riverRegistry: riverRegistry,
		workers:       make([]*streamsTrackerWorker, workersCount),
	}

	log := dlog.FromCtx(ctx)
	validNodes := nodes.GetValidNodeAddresses()

	// load streams and distribute streams over buckets and assign each bucket to a worker.
	streamBuckets := make([][]*registries.GetStreamResult, workersCount)

	err := tracker.riverRegistry.ForAllStreams(
		ctx,
		tracker.riverRegistry.Blockchain.InitialBlockNum,
		func(stream *registries.GetStreamResult) bool {
			if tracker.StreamSupported(stream.StreamId) {
				stream.Nodes = slices.DeleteFunc(stream.Nodes, func(address common.Address) bool {
					return !slices.Contains(validNodes, address)
				})
				if len(stream.Nodes) == 0 {
					log.Warn("Ignore stream, no valid node", "stream", stream.StreamId)
					return true
				}

				streamBuckets[tracker.workerIndex(stream.StreamId)] =
					append(streamBuckets[tracker.workerIndex(stream.StreamId)], stream)
			}
			return true
		})

	if err != nil {
		return nil, err
	}

	for i := range workersCount {
		tracker.workers[i] = newStreamsTrackerWorker(
			i+1, onChainConfig, tracker.riverRegistry, nodes, notifier, streamBuckets[i])
	}

	return tracker, nil
}

func (tracker *StreamsTracker) Run(ctx context.Context) {
	var workerTasks sync.WaitGroup
	workerTasks.Add(len(tracker.workers))
	for _, w := range tracker.workers {
		go func() {
			w.run(ctx)
			workerTasks.Done()
		}()
	}

	workerTasks.Wait()

	dlog.FromCtx(ctx).Info("stream tracker stopped")
}

// StreamSupported returns an indication if the stream identified by the given streamID is
// supported by the notification streams tracker.
func (tracker *StreamsTracker) StreamSupported(streamID shared.StreamId) bool {
	streamType := streamID.Type()
	return streamType == shared.STREAM_DM_CHANNEL_BIN ||
		streamType == shared.STREAM_GDM_CHANNEL_BIN ||
		streamType == shared.STREAM_CHANNEL_BIN
}

// workerID determines the worker index that is responsible for handling the stream
func (tracker *StreamsTracker) workerIndex(streamID shared.StreamId) int {
	digest := sha256.Sum256(streamID[:])
	return int(new(big.Int).Mod(new(big.Int).SetBytes(digest[:]), big.NewInt(int64(len(tracker.workers)))).Int64())
}

func (tracker *StreamsTracker) StreamAllocated(ctx context.Context, event *river.StreamRegistryV1StreamAllocated) {
	streamID, err := shared.StreamIdFromBytes(event.StreamId[:])
	if err != nil {
		return
	}
	if tracker.StreamSupported(streamID) {
		// TODO: tracker.workers[tracker.workerIndex(streamID)].addStream(ctx, streamID)
	}
}

func (tracker *StreamsTracker) StreamLastMiniblockUpdated(ctx context.Context, event *river.StreamRegistryV1StreamLastMiniblockUpdated) {
	// no-op
}

func (tracker *StreamsTracker) StreamPlacementUpdated(ctx context.Context, event *river.StreamRegistryV1StreamPlacementUpdated) {
	// TODO: move stream to different worker if needed
}

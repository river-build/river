package sync

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"sync"
	"sync/atomic"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	riversync "github.com/river-build/river/core/node/rpc/sync"
	"github.com/river-build/river/core/node/shared"
)

type (
	streamSyncProgress struct {
		// streamID is the unique stream identifier
		streamID shared.StreamId
		// syncPos can be nil when a stream was allocated, and it is the first time the stream is synced
		syncPos *protocol.SyncCookie
		// nodes it the list of node addresses responsible for the stream
		nodes []common.Address
		// allocated indicates if the stream was just allocated and need to be synced from its genesis
		allocated bool
	}

	streamsTrackerWorker struct {
		// unique identifier for worker
		ID uint
		// onChainConfig provides access to config stored on-chain
		onChainConfig crypto.OnChainConfiguration
		// ReceivedEvents keeps track how many stream updates to worker has processed
		ReceivedEvents atomic.Uint64
		// SubscribedStreams keeps track how many streams this worker is receiving updates for
		SubscribedStreams atomic.Uint64
		// trackedStreams is a mapping from shared.StreamId -> *events.streamViewImpl
		// and contains all streams that are added to the current sync session
		trackedStreams sync.Map
		// riverRegistry provides access to the registry as deployed on the River chain
		riverRegistry *registries.RiverRegistryContract
		// nodes provide access to nodes that are registered
		nodes nodes.NodeRegistry
		// listener is called for each event added to a stream
		listener events.StreamEventListener
		// userPreferences provides access to user notifications related preferences
		userPreferences events.UserPreferencesStore
		// streamAddRequests is used to add new streams to track
		streamAddRequests chan *streamSyncProgress
		// streams is used to keep a mapping of stream id to streamSyncProgress for all streams this worker is tracking
		// regardless if they are up or down
		streams sync.Map // map[shared.StreamId]*streamSyncProgress
		// streamsDown keeps the set of streams that are reported as down and need to be added again when the stream
		// becomes available again
		streamsDown sync.Map
		// metrics holds metrics for telemetry purposes
		metrics *streamsTrackerWorkerMetrics
	}

	streamsTrackerWorkerMetrics struct {
		trackedStreamsMessageCounter   prometheus.Counter
		trackedDMStreamsUp             prometheus.Gauge
		trackedDMStreamsDown           prometheus.Gauge
		trackedGDMStreamsUp            prometheus.Gauge
		trackedGDMStreamsDown          prometheus.Gauge
		trackedSpaceChannelStreamsUp   prometheus.Gauge
		trackedSpaceChannelStreamsDown prometheus.Gauge
		trackedUserSettingsStreamsUp   prometheus.Gauge
		trackedUserSettingsStreamsDown prometheus.Gauge
	}
)

func NewStreamsTrackerWorker(
	ctx context.Context,
	id uint,
	onChainConfig crypto.OnChainConfiguration,
	riverRegistry *registries.RiverRegistryContract,
	nodes nodes.NodeRegistry,
	streams []*registries.GetStreamResult,
	listener events.StreamEventListener,
	userPreferences events.UserPreferencesStore,
	metrics *streamsTrackerWorkerMetrics,
) (*streamsTrackerWorker, error) {
	worker := &streamsTrackerWorker{
		ID:                id,
		onChainConfig:     onChainConfig,
		riverRegistry:     riverRegistry,
		nodes:             nodes,
		listener:          listener,
		userPreferences:   userPreferences,
		streamAddRequests: make(chan *streamSyncProgress, 1024),
		metrics:           metrics,
	}

	log := worker.logFromCtx(ctx)
	log.Info("init stream tracker worker", "streams", len(streams))

	// for each stream send an invalid sync cookie as position.
	// that forces a sync reset allowing the notification service to init each stream from the latest snapshot.
	for _, stream := range streams {
		worker.streams.Store(stream.StreamId, &streamSyncProgress{
			streamID: stream.StreamId,
			nodes:    stream.Nodes,
			syncPos: &protocol.SyncCookie{
				NodeAddress:       stream.Nodes[0][:],
				StreamId:          stream.StreamId[:],
				MinipoolGen:       math.MaxInt64, // force sync reset
				MinipoolSlot:      0,
				PrevMiniblockHash: []byte{0},
			},
		})
	}

	return worker, nil
}

// run tracks streams and emits notifications until the given ctx expires
func (w *streamsTrackerWorker) run(ctx context.Context) {
	var (
		log         = w.logFromCtx(ctx)
		keepOnGoing = func(ctx context.Context) bool {
			select {
			case <-ctx.Done():
				return false
			default:
				return true
			}
		}
		waitOrCtxExpires = func(ctx context.Context, howLong time.Duration) {
			select {
			case <-ctx.Done():
				return
			case <-time.After(howLong):
				return
			}
		}

		waitDuration = 15 * time.Second
	)

	go w.addDownStreamsAgain(ctx)

	for keepOnGoing(ctx) {
		var (
			syncID              = base.GenNanoid()
			syncCtx, syncCancel = context.WithCancel(ctx)
			log                 = log.With("syncId", syncID)
		)

		// cleanup previous tracked streams if this isn't the first iteration
		w.trackedStreams = sync.Map{}

		// stream cache and address are only required for local streams which the notification service doesn't have.
		// therefor it is safe to pass a nil stream cache as long as an address is used that isn't used by any of the
		// stream nodes.
		syncOp, err := riversync.NewStreamsSyncOperation(
			syncCtx, syncID, common.Address{8, 1, 4, 0, 7, 3, 2, 2, 0, 5, 7, 3, 44, 8, 32}, nil, w.nodes)
		if err != nil {
			log.Error("Unable to create streams sync session", "err", err)
			waitOrCtxExpires(ctx, waitDuration)
			continue
		}

		var tasks sync.WaitGroup
		tasks.Add(3)

		// run stream sync session till either syncCtx expires or an error occurred
		go func() {
			if err := w.syncOp(syncOp); !errors.Is(err, context.Canceled) {
				log.Error("Stream sync session finished unexpected", "syncId", syncOp.SyncID, "err", err)
			}
			syncCancel()
			tasks.Done()
		}()

		// process stream add requests until syncCtx expires or an error occurred
		go func() {
			w.addStreams(syncCtx, syncOp)
			syncCancel()
			tasks.Done()
		}()

		// add streams to syncOp
		go func() {
			defer tasks.Done()
			w.streams.Range(func(key, value interface{}) bool {
				w.streamAddRequests <- value.(*streamSyncProgress)
				return keepOnGoing(syncCtx)
			})
		}()

		tasks.Wait()

		// wait a bit if necessary to prevent retrying too fast if sync op ended unexpected
		waitOrCtxExpires(ctx, waitDuration)
	}
}

func (w *streamsTrackerWorker) syncOp(
	syncOp *riversync.StreamSyncOperation,
) error {
	w.SubscribedStreams.Store(0)

	// run the sync op until ctx expires or something bad happened
	return syncOp.Run(connect.NewRequest(&protocol.SyncStreamsRequest{}), w)
}

func (w *streamsTrackerWorker) logFromCtx(ctx context.Context) *slog.Logger {
	return dlog.FromCtx(ctx).With("workerId", w.ID)
}

func (w *streamsTrackerWorker) addStreams(
	ctx context.Context,
	syncOp *riversync.StreamSyncOperation,
) {
	log := w.logFromCtx(ctx)

	for req := range w.streamAddRequests {
		if err := w.processAddStreamRequest(ctx, log, syncOp, req); err != nil {
			log.Error("Unable to add stream", "stream", req.streamID, "err", err)
		}
	}
}

func (w *streamsTrackerWorker) processAddStreamRequest(
	ctx context.Context,
	log *slog.Logger,
	syncOp *riversync.StreamSyncOperation,
	request *streamSyncProgress,
) error {
	_, loaded := w.trackedStreams.Load(request.streamID)
	if loaded {
		log.Debug("Stream already tracked", "stream", request.streamID)
		return nil
	}

	if request.syncPos == nil {
		request.syncPos = &protocol.SyncCookie{
			StreamId:          request.streamID[:],
			NodeAddress:       request.nodes[0][:],
			MinipoolGen:       math.MaxInt64,
			MinipoolSlot:      0,
			PrevMiniblockHash: []byte{0},
		}
	}

	// add stream to local collection of streams to track
	w.streams.Store(request.streamID, request)

	if _, err := syncOp.AddStreamToSync(ctx, connect.NewRequest(&protocol.AddStreamToSyncRequest{
		SyncId:  syncOp.SyncID,
		SyncPos: request.syncPos,
	})); err != nil {
		return err
	}

	w.SubscribedStreams.Add(1)

	w.markStreamUp(request.streamID)

	return nil
}

// Send is called by the sync session for each update.
func (w *streamsTrackerWorker) Send(msg *protocol.SyncStreamsResponse) error {
	var (
		log    = dlog.Log().With("worker", w.ID)
		syncID = msg.GetSyncId()
	)

	switch msg.GetSyncOp() {
	case protocol.SyncOp_SYNC_UPDATE:
		streamID, err := shared.StreamIdFromBytes(msg.GetStream().GetNextSyncCookie().GetStreamId())
		if err != nil {
			return err
		}

		w.metrics.trackedStreamsMessageCounter.Inc()

		reset := msg.GetStream().GetSyncReset()

		// a reset is forced and the cookie contains the latest block with snapshot that is used to construct a view
		// on which later events can be applied.
		if reset {
			trackedStream, err := events.NewNotificationsStreamTrackerFromStreamAndCookie(
				streamID, w.onChainConfig, msg.GetStream(), w.listener, w.userPreferences)

			if err != nil {
				log.Error("Unable to make remote stream view", "stream", streamID, "err", err)
				return err
			}

			// this could replace an existing tracked stream if the stream was reported as down before
			w.trackedStreams.Store(streamID, trackedStream)

			for _, event := range msg.GetStream().GetEvents() {
				if err := trackedStream.HandleEvent(event); err != nil {
					log.Error("Unable to handle event", "stream", streamID, "err", err)
				} else {
					log.Debug("Applied event to stream",
						"stream", streamID, "event", fmt.Sprintf("%x", event.Hash))
				}
			}
		} else {
			raw, loaded := w.trackedStreams.Load(streamID)
			if loaded {
				trackedStream := raw.(*events.TrackedNotificationStreamView)
				for _, event := range msg.GetStream().GetEvents() {
					if err := trackedStream.HandleEvent(event); err != nil {
						log.Error("Unable to handle event", "stream", streamID, "err", err)
					} else {
						log.Debug("Applied event to stream",
							"stream", streamID, "event", fmt.Sprintf("%x", event.Hash))
					}
				}
			} else {
				// resumed sync from last known position, load view and apply updates.
				log.Debug("not loaded view", "stream", streamID)
				trackedStream, err := events.NewNotificationsStreamTrackerFromStreamAndCookie(
					streamID, w.onChainConfig, msg.GetStream(), w.listener, w.userPreferences)

				if err != nil {
					log.Error("Unable to make remote stream view", "stream", streamID, "err", err)
					return err
				}

				w.trackedStreams.Store(streamID, trackedStream)

				for _, event := range msg.GetStream().GetEvents() {
					if err := trackedStream.HandleEvent(event); err != nil {
						log.Error("Unable to handle event", "stream", streamID, "err", err)
					} else {
						log.Debug("Applied event to stream",
							"stream", streamID, "event", fmt.Sprintf("%x", event.Hash))
					}
				}
			}
		}

		w.ReceivedEvents.Add(uint64(len(msg.GetStream().GetEvents())))

	case protocol.SyncOp_SYNC_DOWN:
		streamID, err := shared.StreamIdFromBytes(msg.GetStreamId())
		if err != nil {
			return err
		}

		log.Warn("Stream reported as down, reschedule to add again", "stream", msg.GetStreamId())
		w.streamsDown.Store(streamID, struct{}{})
		w.markStreamDown(streamID)

	case protocol.SyncOp_SYNC_CLOSE:
		log.Error("Sync stopped unexpected", "syncId", syncID)
	case protocol.SyncOp_SYNC_PONG:
		log.Debug("received pong")
	default:
		log.Error("Unhandled sync op", "syncOp", msg.GetSyncOp())
	}

	return nil
}

// addDownStreamsAgain tries to add streams that failed to be added to a sync session
// or for which a down message was received.
func (w *streamsTrackerWorker) addDownStreamsAgain(ctx context.Context) {
	next := time.After(30 * time.Second)
	for {
		select {
		case <-next:
			w.streamsDown.Range(func(key, value interface{}) bool {
				streamID := key.(shared.StreamId)
				v, _ := w.streams.Load(streamID)
				progress := v.(*streamSyncProgress)
				nodes := progress.nodes
				w.streamAddRequests <- &streamSyncProgress{
					streamID: streamID,
					nodes:    nodes,
					syncPos: &protocol.SyncCookie{
						NodeAddress:       nodes[0][:],
						StreamId:          streamID[:],
						MinipoolGen:       math.MaxInt64, // force sync reset
						MinipoolSlot:      0,
						PrevMiniblockHash: []byte{0},
					},
				}
				return true
			})
			next = time.After(30 * time.Second)
		case <-ctx.Done():
			return
		}
	}
}

func (w *streamsTrackerWorker) markStreamUp(streamID shared.StreamId) {
	switch streamID.Type() {
	case shared.STREAM_USER_SETTINGS_BIN:
		w.metrics.trackedUserSettingsStreamsUp.Inc()
	case shared.STREAM_CHANNEL_BIN:
		w.metrics.trackedSpaceChannelStreamsUp.Inc()
	case shared.STREAM_DM_CHANNEL_BIN:
		w.metrics.trackedDMStreamsUp.Inc()
	case shared.STREAM_GDM_CHANNEL_BIN:
		w.metrics.trackedGDMStreamsUp.Inc()
	}
}

func (w *streamsTrackerWorker) markStreamDown(streamID shared.StreamId) {
	switch streamID.Type() {
	case shared.STREAM_USER_SETTINGS_BIN:
		w.metrics.trackedUserSettingsStreamsUp.Inc()
	case shared.STREAM_CHANNEL_BIN:
		w.metrics.trackedSpaceChannelStreamsUp.Inc()
	case shared.STREAM_DM_CHANNEL_BIN:
		w.metrics.trackedDMStreamsUp.Inc()
	case shared.STREAM_GDM_CHANNEL_BIN:
		w.metrics.trackedGDMStreamsUp.Inc()
	}
}

package sync

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/notifications/push"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	riversync "github.com/river-build/river/core/node/rpc/sync"
	"github.com/river-build/river/core/node/shared"
)

type (
	streamsTrackerWorker struct {
		// unique identifier for worker
		ID uint
		// onChainConfig provides access to config stored on-chain
		onChainConfig crypto.OnChainConfiguration
		// ReceivedEvents keeps track how many stream updates to worker has processed
		ReceivedEvents atomic.Uint64
		// SubscribedStreams keeps track how many streams this worker is receiving updates for
		SubscribedStreams atomic.Uint64
		// notifier is used to send notifications to clients
		notifier push.MessageNotifier
		// trackedStreams is a mapping from shared.StreamId -> *events.notificationTrackedStream
		// and contains all streams that are added to the current sync session
		trackedStreams sync.Map
		// riverRegistry provides access to the registry as deployed on the River chain
		riverRegistry *registries.RiverRegistryContract
		// nodes provide access to nodes that are registered
		nodes nodes.NodeRegistry
		// streamToNodeAddresses is used to keep a list of streams to its node addresses
		streamToNodeAddresses map[shared.StreamId][]common.Address
	}
)

func newStreamsTrackerWorker(
	id uint,
	onChainConfig crypto.OnChainConfiguration,
	riverRegistry *registries.RiverRegistryContract,
	nodes nodes.NodeRegistry,
	notifier push.MessageNotifier,
	streams []*registries.GetStreamResult,
) *streamsTrackerWorker {
	worker := &streamsTrackerWorker{
		ID:                    id,
		onChainConfig:         onChainConfig,
		riverRegistry:         riverRegistry,
		nodes:                 nodes,
		notifier:              notifier,
		streamToNodeAddresses: make(map[shared.StreamId][]common.Address),
	}

	for _, stream := range streams {
		worker.streamToNodeAddresses[stream.StreamId] = stream.Nodes
	}

	return worker
}

// run tracks streams and emits notifications until the given ctx expires
func (w *streamsTrackerWorker) run(ctx context.Context) {
	var (
		log         = dlog.FromCtx(ctx).With("workerId", w.ID)
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
	)

	go w.metrics(ctx)

	for keepOnGoing(ctx) {
		var (
			syncOpCtx, syncOpCancel = context.WithCancel(ctx)
			syncID                  = base.GenNanoid()
			log                     = log.With("syncId", syncID)
		)

		log.Info("Start stream sync session", "ID", w.ID)

		// stream cache and address are only required for local streams which the notification service doesn't have.
		// therefor it is safe to pass a nil stream cache with a dummy address.
		syncOp, err := riversync.NewStreamsSyncOperation(syncOpCtx, syncID, common.Address{1}, nil, w.nodes)
		if err != nil {
			syncOpCancel()
			log.Error("Unable to create streams sync session", "err", err)
			waitOrCtxExpires(ctx, 10*time.Second)
			continue
		}

		// spin off 2 go-routines, one processes stream updates and the other one processes stream registrations.
		// if one of the fails unexpected cancel the other one and restart sync operation.
		var tasks sync.WaitGroup
		tasks.Add(2)

		// subscribe to stream updates
		go func() {
			w.syncOp(syncOpCtx, syncOp)
			syncOpCancel()
			tasks.Done()
		}()

		// monitor streams and add to sync session
		go func() {
			w.syncStreams(syncOpCtx, syncOp)
			syncOpCancel()
			tasks.Done()
		}()

		tasks.Wait()

		// wait a bit if necessary to prevent retrying too fast
		waitOrCtxExpires(ctx, 10*time.Second)
	}
}

func (w *streamsTrackerWorker) syncOp(
	ctx context.Context,
	syncOp *riversync.StreamSyncOperation,
) {
	// run the sync op until ctx expires or something bad happened
	err := syncOp.Run(connect.NewRequest(&protocol.SyncStreamsRequest{}), w)
	w.SubscribedStreams.Store(0)

	if err != nil && !errors.Is(err, context.Canceled) {
		log := dlog.FromCtx(ctx)
		log.Error("Stream sync session finished unexpected",
			"worker", w.ID, "syncId", syncOp.SyncID, "err", err)
	}
}

func (w *streamsTrackerWorker) syncStreams(
	ctx context.Context,
	syncOp *riversync.StreamSyncOperation,
) {
	log := dlog.FromCtx(ctx)

	for streamID, nodes := range w.streamToNodeAddresses {
		err := w.addStream(ctx, syncOp, streamID, nodes)
		if err != nil {
			log.Error("Unable to add stream to sync operation", "err", err)
			if errors.Is(err, context.Canceled) {
				return
			}
		}
	}

	<-ctx.Done()
}

func (w *streamsTrackerWorker) addStream(
	ctx context.Context,
	syncOp *riversync.StreamSyncOperation,
	streamID shared.StreamId,
	nodes []common.Address,
) error {
	// TODO: discuss if we can add "SyncFromLastSnapshot" to the add stream to sync request that orders the
	// node to always sync from latest snapshot instead only when the client provided an outdated sync cookie.
	_, err := syncOp.AddStreamToSync(ctx, connect.NewRequest(&protocol.AddStreamToSyncRequest{
		SyncId: syncOp.SyncID,
		SyncPos: &protocol.SyncCookie{
			StreamId:          streamID[:],
			NodeAddress:       nodes[0][:],
			MinipoolGen:       1, // try to force a sync reset
			MinipoolSlot:      0,
			PrevMiniblockHash: []byte{0},
		},
	}))

	if err == nil {
		w.SubscribedStreams.Add(1)
	}

	return err
}

func (w *streamsTrackerWorker) Send(msg *protocol.SyncStreamsResponse) error {
	log := dlog.Log()
	syncID := msg.GetSyncId()
	switch msg.GetSyncOp() {
	case protocol.SyncOp_SYNC_DOWN:
		// TODO: decide what to do, drop stream from
		// submit through a task manager
		//go func() {
		//	if streamID, err := shared.StreamIdFromBytes(msg.GetStream().GetNextSyncCookie().GetStreamId()); err == nil {
		//		if ts, ok := w.trackedStreams.Load(streamID); ok {
		//			w.addStream(context.Background(), nil, streamID, ts.(*trackedStream))
		//		}
		//	}
		//}()

		log.Error("TODO: Stream reported as down, reschedule to add again", "stream", msg.GetStreamId())
	case protocol.SyncOp_SYNC_UPDATE:
		streamID, err := shared.StreamIdFromBytes(msg.GetStream().GetNextSyncCookie().GetStreamId())
		if err != nil {
			return nil
		}

		reset := msg.GetStream().GetSyncReset()

		if reset {
			// construct view from latest snapshot with follow blocks and apply incoming events to it
			// to keep track of the member list.
			trackedStream, err := events.NotificationsStreamTrackerFromStreamAndCookie(
				w.onChainConfig, msg.GetStream())
			if err != nil {
				log.Warn("Unable to make remote stream view", "stream", msg.GetStreamId(), "err", err)
				return nil
			}

			w.trackedStreams.Store(streamID, trackedStream)

		} else {
			ts, ok := w.trackedStreams.Load(streamID)
			if !ok {
				// TODO: handle case where we didn't receive the sync reset indication first and must grab the stream
				// snapshot in a different way. Maybe add the FromSnapshot indication to the AddStreamRequest to force
				// the node to always sync from the latest snapshot.
				log.Debug("TODO: got sync update without reset - ignore stream for now but handle this case",
					"syncId", syncID,
					"stream", msg.GetStream().GetNextSyncCookie().GetStreamId(),
					"reset", reset)

				return nil
			}

			trackedStream := ts.(*events.TrackedNotificationStreamView)

			for _, event := range msg.GetStream().GetEvents() {
				parsedEvent, err := events.ParseEvent(event)
				if err != nil {
					log.Error("Received corrupt stream event", "streamId", streamID)
					// TODO: decide what to do, force sync stream reset and start over?
					return err
				}

				if parsedEvent.Event.GetMiniblockHeader() != nil {
					// clean up minipool
					if err := trackedStream.ApplyMiniblockHeader(parsedEvent.Event.GetMiniblockHeader()); err != nil {
						log.Error("Unable to apply miniblock to tracked stream", "streamId", streamID, "err", err)
						// TODO: decide what to do, force sync stream reset and start over?
						return err
					}
				} else {
					if err := trackedStream.AddEvent(parsedEvent); err != nil {
						log.Error("Unable to add event to tracked stream", "streamId", streamID, "err", err)
						// TODO: decide what to do, force sync stream reset and start over?
						return err
					}

					log.Info("applied event to stream", "streamId", streamID)

					// TODO: determine if there is someone that needs to receive a notification for this update
					// Logic should also take care of not sending notifications multiple times.
				}
			}
		}

		w.ReceivedEvents.Add(uint64(len(msg.GetStream().GetEvents())))

	case protocol.SyncOp_SYNC_CLOSE:
		log.Error("Sync stopped unexpected", "syncId", syncID)
	case protocol.SyncOp_SYNC_PONG:
		log.Info("received pong")
	default:
		log.Error("Unhandled sync op", "syncOp", msg.GetSyncOp())
	}

	return nil
}

func (w *streamsTrackerWorker) metrics(ctx context.Context) {
	log := dlog.FromCtx(ctx)
	ticker := time.NewTicker(time.Minute)
	for {
		select {
		case <-ticker.C:
			log.Info("worker tracks streams", "worker", w.ID, "streamsCount", w.SubscribedStreams.Load())
		case <-ctx.Done():
			return
		}
	}
}

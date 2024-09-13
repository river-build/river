package sync

import (
	"context"
	"errors"
	"fmt"
	"math"
	"math/rand"
	"strconv"
	"sync/atomic"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/shared"
	"golang.org/x/sync/semaphore"
)

type StreamTrackerConnectGo struct{}

func channelLabelType(streamID shared.StreamId) string {
	switch streamID.Type() {
	case shared.STREAM_DM_CHANNEL_BIN:
		return "dm"
	case shared.STREAM_GDM_CHANNEL_BIN:
		return "gdm"
	case shared.STREAM_CHANNEL_BIN:
		return "space_channel"
	case shared.STREAM_USER_SETTINGS_BIN:
		return "user_settings"
	default:
		return "unknown"
	}
}

func (s *StreamTrackerConnectGo) Run(
	ctx context.Context,
	stream *registries.GetStreamResult,
	nodeRegistry nodes.NodeRegistry,
	workerPool *semaphore.Weighted,
	onChainConfig crypto.OnChainConfiguration,
	listener events.StreamEventListener,
	userPreferences events.UserPreferencesStore,
	metrics *streamsTrackerWorkerMetrics,
) {
	restartSyncSessionCounter := 0

	for {
		var (
			sticky              = nodes.NewStreamNodes(stream.Nodes, common.Address{}).GetStickyPeer()
			log                 = dlog.FromCtx(ctx).With("stream", stream.StreamId, "remote", sticky)
			syncCtx, syncCancel = context.WithCancel(ctx)
			lastReceivedPong    atomic.Int64
			syncID              string
			trackedStream       *events.TrackedNotificationStreamView
			promLabels          = prometheus.Labels{"type": channelLabelType(stream.StreamId)}
		)

		metrics.TotalStreams.With(promLabels).Inc()

		client, err := nodeRegistry.GetStreamServiceClientForAddress(sticky)
		if err != nil {
			syncCancel()
			log.Error("unable to obtain stream service client", "err", err)
			if s.waitMaxOrUntilCancel(syncCtx, time.Minute, 2*time.Minute) {
				return
			}
			continue
		}

		// workers are started in parallel, prevent starting too many at the same time
		// to ensure that remotes are not overflown with SyncStream requests.
		metrics.SyncSessionInFlight.Inc()
		if err := workerPool.Acquire(syncCtx, 1); err != nil {
			metrics.SyncSessionInFlight.Dec()
			syncCancel()
			log.Error("unable to acquire worker pool task", "err", err)
			if s.waitMaxOrUntilCancel(ctx, 10*time.Second, 30*time.Second) {
				return
			}
			continue
		}

		restartSyncSessionCounter++

		if restartSyncSessionCounter > 1 {
			log.Info("Restart sync session", "times", restartSyncSessionCounter)
		}

		syncPos := []*protocol.SyncCookie{{
			NodeAddress:       sticky[:],
			StreamId:          stream.StreamId[:],
			MinipoolGen:       math.MaxInt64, // force sync reset
			MinipoolSlot:      0,
			PrevMiniblockHash: common.Hash{}.Bytes(),
		}}

		streamUpdates, err := client.SyncStreams(syncCtx, connect.NewRequest(&protocol.SyncStreamsRequest{
			SyncPos: syncPos,
		}))
		workerPool.Release(1)
		metrics.SyncSessionInFlight.Dec()

		if err != nil {
			syncCancel()
			log.Error("unable to start stream sync session", "err", err)
			if s.waitMaxOrUntilCancel(ctx, time.Minute, 2*time.Minute) {
				return
			}
			continue
		}

		// ensure that the first message is received within 30 seconds.
		// if not cancel the sync session and restart a new one.
		syncIDCtx, syncIDGot := context.WithTimeout(syncCtx, time.Minute)
		go func() {
			select {
			case <-time.After(30 * time.Second):
				log.Warn("Didn't receive sync id within 30s, cancel sync session")
				syncCancel() // cancel sync session
				syncIDGot()
				return
			case <-syncIDCtx.Done(): // cancelled when syncID is received within 30s
				return
			case <-ctx.Done():
				return
			}
		}()

		if streamUpdates.Receive() {
			firstMsg := streamUpdates.Msg()
			if firstMsg.GetSyncOp() != protocol.SyncOp_SYNC_NEW {
				syncCancel()
				log.Error("Stream sync session didn't start with SyncOp_SYNC_NEW")
				if s.waitMaxOrUntilCancel(syncCtx, 10*time.Second, 30*time.Second) {
					return
				}
				continue
			}
			syncID = firstMsg.GetSyncId()
		}

		if err := streamUpdates.Err(); err != nil {
			log.Error("Unable to receive first sync message", "err", err)
			syncCancel()
			if s.waitMaxOrUntilCancel(syncCtx, time.Minute, 2*time.Minute) {
				return
			}
			continue
		}

		if syncID == "" {
			syncCancel()
			log.Error("invalid sync id")
			if s.waitMaxOrUntilCancel(syncCtx, time.Minute, 2*time.Minute) {
				return
			}
			continue
		}

		// indicate that the sync ID was received
		syncIDGot()

		metrics.ActiveStreamSyncSessions.Inc()

		// sync session started, start liveness loop that periodically checks the
		// status of the sync session with ping/pong. If no pong is received this
		// will cancel the sync session and a new one will be started after.
		// gotSyncResetUpdate is set to true when the expected sync reset is received.
		// If it isn't received within reasonable time the liveness loop will
		// cancel the sync session causing a new session to be started.
		var gotSyncResetUpdate atomic.Bool
		go s.liveness(syncCtx, syncCancel, &gotSyncResetUpdate,
			workerPool, stream.StreamId, syncID, client, &lastReceivedPong, metrics)

		for streamUpdates.Receive() {
			update := streamUpdates.Msg()
			switch update.GetSyncOp() {
			case protocol.SyncOp_SYNC_UPDATE:
				var (
					reset  = update.GetStream().GetSyncReset()
					labels = prometheus.Labels{"reset": "false"}
				)
				if reset {
					gotSyncResetUpdate.Store(true)
					labels["reset"] = "true"
				}

				metrics.SyncUpdate.With(labels).Inc()

				streamID, err := shared.StreamIdFromBytes(update.GetStream().GetNextSyncCookie().GetStreamId())
				if err != nil {
					log.Error("Received corrupt update, invalid stream ID")
					syncCancel()
					continue
				}

				if streamID != stream.StreamId {
					log.Error("Received update for unexpected stream", "want", stream.StreamId, "got", streamID)
					syncCancel()
					continue
				}

				if reset {
					newTrackedStream, err := events.NewNotificationsStreamTrackerFromStreamAndCookie(
						syncCtx, streamID, onChainConfig, update.GetStream(), listener, userPreferences)
					if err != nil {
						syncCancel()
						log.Error("Unable to instantiate tracked stream", "err", err)
						continue
					}

					if trackedStream == nil { // if non-nil -> was already tracked
						metrics.TrackedStreams.With(promLabels).Inc()
					} else {
						log.Warn("Got sync reset for tracked stream")
					}

					trackedStream = newTrackedStream
					continue
				}

				// first received update must be a sync reset that instantiates the trackedStream
				if trackedStream == nil {
					syncCancel()
					log.Error("Received unexpected non sync-reset update")
					continue
				}

				// apply update
				for _, event := range update.GetStream().GetEvents() {
					if err := trackedStream.HandleEvent(event); err != nil {
						log.Error("Unable to handle event", "stream", streamID, "err", err)
					}
				}

			case protocol.SyncOp_SYNC_DOWN:
				log.Info("Stream reported as down")
				metrics.SyncDown.Inc()
				syncCancel()
			case protocol.SyncOp_SYNC_CLOSE:
				log.Info("Got stream close")
				syncCancel()
			case protocol.SyncOp_SYNC_UNSPECIFIED:
				log.Warn("Got stream unspecified")
				syncCancel()
			case protocol.SyncOp_SYNC_NEW:
				log.Warn("Got stream new")
				syncCancel()
			case protocol.SyncOp_SYNC_PONG:
				metrics.SyncPong.Inc()
				receivedPong, err := strconv.ParseInt(update.GetPongNonce(), 0, 64)
				if err == nil {
					lastPong := lastReceivedPong.Load()
					if receivedPong > lastPong {
						lastReceivedPong.Store(receivedPong)
					}
				}
			}
		}

		metrics.ActiveStreamSyncSessions.Dec()

		syncCancel()
		if trackedStream != nil {
			metrics.TrackedStreams.With(promLabels).Dec()
			trackedStream = nil
		}

		if err := streamUpdates.Err(); err != nil {
			select {
			case <-ctx.Done(): // if parent ctx is cancelled -> service shutdown is initiated
				return
			default:
				if !errors.Is(err, context.Canceled) {
					log.Error("Stream sync session ended unexpected", "err", err)
				}
			}
		}

		if s.waitMaxOrUntilCancel(ctx, 10*time.Second, 30*time.Second) {
			return
		}
	}
}

func (s *StreamTrackerConnectGo) liveness(
	ctx context.Context,
	cancelSyncSession context.CancelFunc,
	gotSyncResetUpdate *atomic.Bool,
	workerPool *semaphore.Weighted,
	streamID shared.StreamId,
	syncID string,
	client protocolconnect.StreamServiceClient,
	lastReceivedPong *atomic.Int64,
	metrics *streamsTrackerWorkerMetrics,
) {
	var (
		pongTimeout = 30 * time.Second
		log         = dlog.FromCtx(ctx).With("stream", streamID)
	)

	// ensure that a pong reply on a ping is received within pongTimeout. If pong replay is not
	// received cancel the stream sync session. This will initiate a new stream sync session.
	for {
		pingInterval := time.Minute + time.Duration(rand.Int63n(int64(time.Minute)))
		select {
		case <-time.After(pingInterval):
			// first update must be a sync update reset, if not received the sync session
			// is considered dead -> cancel it.
			if !gotSyncResetUpdate.Load() {
				cancelSyncSession()
				return
			}

			if err := workerPool.Acquire(ctx, 1); err != nil {
				continue
			}

			ping := time.Now().Unix()
			pingReqCtx, pingReqCancel := context.WithTimeout(ctx, 30*time.Second)
			metrics.SyncPingInFlight.Inc()
			_, err := client.PingSync(pingReqCtx, connect.NewRequest(&protocol.PingSyncRequest{
				SyncId: syncID,
				Nonce:  fmt.Sprintf("%d", ping),
			}))
			workerPool.Release(1)
			metrics.SyncPingInFlight.Dec()
			pingReqCancel()

			if err != nil {
				metrics.SyncPing.With(prometheus.Labels{"status": "failure"}).Inc()
				if !errors.Is(err, context.Canceled) {
					log.Error("Unable to ping stream session", "err", err)
				}
				cancelSyncSession()
				return
			}

			metrics.SyncPing.With(prometheus.Labels{"status": "success"}).Inc()

			// expect to receive the pong reply from remote within pongTimeout
			pongCtx, cancelPong := context.WithTimeout(ctx, pongTimeout)

		pingReceiveLoop:
			for {
				select {
				case <-time.After(time.Second):
					lastPong := lastReceivedPong.Load()
					if lastPong >= ping {
						cancelPong()
						break pingReceiveLoop // restart new ping/ping after pingInterval
					}
				case <-pongCtx.Done():
					cancelPong()

					// stream sync session considered dead
					// cancel existing stream sync session and start a new sync session
					if ctx.Err() == nil {
						cancelSyncSession()
						log.Warn("Stream sync session timeout")
					}
					return
				case <-ctx.Done():
					cancelPong()
					return
				}
			}

			cancelPong()

		case <-ctx.Done():
			cancelSyncSession()
			return
		}
	}
}

// waitMaxOrUntilCancel waits a random duration between minWait and maxWait
// or returns true when ctx expires before.
func (s *StreamTrackerConnectGo) waitMaxOrUntilCancel(
	ctx context.Context,
	minWait time.Duration,
	maxWait time.Duration,
) bool {
	if minWait > maxWait {
		panic("minWait > maxWait")
	}
	wait := minWait + time.Duration(rand.Int63n(int64(maxWait-minWait)))
	select {
	case <-time.After(wait):
		return false
	case <-ctx.Done():
		return true
	}
}

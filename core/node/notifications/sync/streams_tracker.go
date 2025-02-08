package sync

import (
	"context"

	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/track_streams"
)

type notificationsStreamsTracker struct {
	track_streams.StreamsTrackerImpl
	listener StreamEventListener
	storage  UserPreferencesStore
}

// NewStreamsTrackerForNotifications creates a stream tracker instance for the notifications
// service.
func NewStreamsTrackerForNotifications(
	ctx context.Context,
	onChainConfig crypto.OnChainConfiguration,
	riverRegistry *registries.RiverRegistryContract,
	nodeRegistries []nodes.NodeRegistry,
	listener StreamEventListener,
	storage UserPreferencesStore,
	metricsFactory infra.MetricsFactory,
) (track_streams.StreamsTracker, error) {
	tracker := &notificationsStreamsTracker{
		listener: listener,
		storage:  storage,
	}
	if err := tracker.StreamsTrackerImpl.Init(
		ctx,
		onChainConfig,
		riverRegistry,
		nodeRegistries,
		tracker.newTrackedStreamView,
		tracker.trackStream,
		metricsFactory,
	); err != nil {
		return nil, err
	}

	return tracker, nil
}

func (tracker *notificationsStreamsTracker) newTrackedStreamView(
	ctx context.Context,
	streamID shared.StreamId,
	cfg crypto.OnChainConfiguration,
	stream *protocol.StreamAndCookie,
) (events.TrackedStreamView, error) {
	return NewTrackedStreamForNotifications(ctx, streamID, cfg, stream, tracker.listener, tracker.storage)
}

// TrackStreamForNotifications returns true if the given streamID must be tracked for notifications.
func (tracker *notificationsStreamsTracker) trackStream(streamID shared.StreamId) bool {
	streamType := streamID.Type()

	return streamType == shared.STREAM_DM_CHANNEL_BIN ||
		streamType == shared.STREAM_GDM_CHANNEL_BIN ||
		streamType == shared.STREAM_CHANNEL_BIN ||
		streamType == shared.STREAM_USER_SETTINGS_BIN // users add addresses of blocked users into their settings stream
}

package sync

import (
	"context"

	"github.com/river-build/river/core/node/crypto"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/track_streams"
)

// NewTrackedStreamForBotRegistry constructs a TrackedStreamView instance from the given
// stream, and executes callbacks to ensure that all bots' cached key fulfillments are up to date,
// and that message events are sent to the supplied listener. It's expected that the stream cookie
// starts with a miniblock that contains a snapshot with stream members.
func NewTrackedStreamForBotRegistryService(
	ctx context.Context,
	streamID shared.StreamId,
	cfg crypto.OnChainConfiguration,
	stream *StreamAndCookie,
	listener track_streams.StreamEventListener,
) (TrackedStreamView, error) {
	onViewLoaded := func(view *StreamView) error {
		// streamId := view.StreamId()
		// if streamId.Type() == shared.STREAM_USER_INBOX_BIN {
		// 	// TODO: Load bot key fulfillments from user inbox stream into an in-memory cache
		// 	// backed by db to support restarts
		// }
		return nil
	}

	onNewEvent := func(ctx context.Context, view *StreamView, event *ParsedEvent) error {
		if streamID.Type() == shared.STREAM_USER_INBOX_BIN {
			// TODO: update bot key fulfillments, possibly triggering a flurry of webhook calls
			// that were queued up waiting for a particular fulfillment for a particular channel
			return nil
		}

		// TODO: this list of "members" should be the list of bot members in the channel. We
		// expect the StreamEventListener to make webhook calls for bots that meet "notification"
		// criteria for this channel message.
		members, err := view.GetChannelMembers()
		if err != nil {
			return err
		}

		listener.OnMessageEvent(ctx, streamID, view.StreamParentId(), members, event)
		return nil
	}

	return NewTrackedStreamView(ctx, streamID, cfg, stream, onViewLoaded, onNewEvent)
}

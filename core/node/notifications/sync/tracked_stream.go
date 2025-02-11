package sync

import (
	"context"

	"github.com/ethereum/go-ethereum/common"

	"github.com/river-build/river/core/node/crypto"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/track_streams"
)

type (
	UserPreferencesStore interface {
		// BlockUser blocks the given blockedUser for the given user
		BlockUser(
			user common.Address,
			blockedUser common.Address,
		)

		// UnblockUser unblocks the given blockedUser for the given user
		UnblockUser(
			user common.Address,
			blockedUser common.Address,
		)
	}
)

// NewTrackedStreamForNotifications constructs a TrackedStreamView instance from the given
// stream, and executes callbacks to ensure that the user's blocked list is up to date and that message events
// are sent to the supplied listener. It's expected that the stream cookie starts with a miniblock that
// contains a snapshot with stream members.
func NewTrackedStreamForNotifications(
	ctx context.Context,
	streamID shared.StreamId,
	cfg crypto.OnChainConfiguration,
	stream *StreamAndCookie,
	listener track_streams.StreamEventListener,
	userPreferences UserPreferencesStore,
) (TrackedStreamView, error) {
	onViewLoaded := func(view *StreamView) error {
		// Load the list of users that someone has blocked from their personal user settings stream into the user
		// preference cache which is queried when determining if a notification must be sent.
		streamId := view.StreamId()
		if streamId.Type() == shared.STREAM_USER_SETTINGS_BIN {
			user := common.BytesToAddress(streamId[1:21])
			if blockedUsers, err := view.BlockedUsers(); err == nil {
				blockedUsers.Each(func(address common.Address) bool {
					userPreferences.BlockUser(user, address)
					return false
				})
			}
		}
		return nil
	}

	onNewEvent := func(ctx context.Context, view *StreamView, event *ParsedEvent) error {
		// in case the event was a block/unblock event update the users blocked list.
		if streamID.Type() == shared.STREAM_USER_SETTINGS_BIN {
			if settings := event.Event.GetUserSettingsPayload(); settings != nil {
				if userBlock := settings.GetUserBlock(); userBlock != nil {
					userID := common.BytesToAddress(event.Event.CreatorAddress)
					blockedUser := common.BytesToAddress(userBlock.GetUserId())

					if userBlock.GetIsBlocked() {
						userPreferences.BlockUser(userID, blockedUser)
					} else {
						userPreferences.UnblockUser(userID, blockedUser)
					}
				}
			}

			return nil
		}

		// otherwise for each member that is a member of the stream, or for anyone that is mentioned
		members, err := view.GetChannelMembers()
		if err != nil {
			return err
		}

		listener.OnMessageEvent(ctx, streamID, view.StreamParentId(), members, event)
		return nil
	}

	return NewTrackedStreamView(ctx, streamID, cfg, stream, onViewLoaded, onNewEvent)
}

package sync

import (
	"context"

	mapset "github.com/deckarep/golang-set/v2"
	"github.com/ethereum/go-ethereum/common"

	"github.com/river-build/river/core/node/crypto"
	. "github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
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

	StreamEventListener interface {
		OnMessageEvent(
			ctx context.Context,
			streamID shared.StreamId,
			parentStreamID *shared.StreamId, // only
			members mapset.Set[string],
			event *ParsedEvent,
		)
	}
)

type notificationsTrackedStreamView struct {
	TrackedStreamViewImpl
	listener        StreamEventListener
	userPreferences UserPreferencesStore
}

func (n *notificationsTrackedStreamView) onViewLoaded(view *StreamView) error {
	// Load the list of users that someone has blocked from their personal user settings stream into the user
	// preference cache which is queried when determining if a notification must be sent.
	streamId := view.StreamId()
	if streamId.Type() == shared.STREAM_USER_SETTINGS_BIN {
		user := common.BytesToAddress(streamId[1:21])
		if blockedUsers, err := view.BlockedUsers(); err == nil {
			blockedUsers.Each(func(address common.Address) bool {
				n.userPreferences.BlockUser(user, address)
				return false
			})
		}
	}
	return nil
}

func (n *notificationsTrackedStreamView) onNewEvent(ctx context.Context, view *StreamView, event *ParsedEvent) error {
	// in case the event was a block/unblock event update the users blocked list.
	streamID := view.StreamId()
	if streamID.Type() == shared.STREAM_USER_SETTINGS_BIN {
		if settings := event.Event.GetUserSettingsPayload(); settings != nil {
			if userBlock := settings.GetUserBlock(); userBlock != nil {
				userID := common.BytesToAddress(event.Event.CreatorAddress)
				blockedUser := common.BytesToAddress(userBlock.GetUserId())

				if userBlock.GetIsBlocked() {
					n.userPreferences.BlockUser(userID, blockedUser)
				} else {
					n.userPreferences.UnblockUser(userID, blockedUser)
				}
			}
		}

		return nil
	}

	if view == nil {
		return nil
	}

	// otherwise for each member that is a member of the stream, or for anyone that is mentioned
	members, err := view.GetChannelMembers()
	if err != nil {
		return err
	}

	n.listener.OnMessageEvent(ctx, *streamID, view.StreamParentId(), members, event)
	return nil
}

// NewTrackedStreamForNotifications constructs a TrackedStreamView instance from the given
// stream, and executes callbacks to ensure that the user's blocked list is up to date and that message events
// are sent to the supplied listener. It's expected that the stream cookie starts with a miniblock that
// contains a snapshot with stream members.
func NewTrackedStreamForNotifications(
	ctx context.Context,
	streamID shared.StreamId,
	cfg crypto.OnChainConfiguration,
	stream *StreamAndCookie,
	listener StreamEventListener,
	userPreferences UserPreferencesStore,
) (TrackedStreamView, error) {
	view := &notificationsTrackedStreamView{
		listener:        listener,
		userPreferences: userPreferences,
	}

	if err := view.TrackedStreamViewImpl.Init(
		ctx,
		streamID,
		cfg,
		stream,
		view.onViewLoaded,
		view.onNewEvent,
	); err != nil {
		return nil, err
	}
	return view, nil
}

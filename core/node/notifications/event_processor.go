package notifications

import (
	"bytes"
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"slices"
	"time"

	"github.com/SherClockHolmes/webpush-go"
	mapset "github.com/deckarep/golang-set/v2"
	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/notifications/push"
	"github.com/river-build/river/core/node/notifications/types"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/sideshow/apns2/payload"
)

// MessageToNotificationsProcessor implements events.StreamEventListener and for each stream event determines
// if it needs to send a notification, to who and sends it.
type MessageToNotificationsProcessor struct {
	ctx                    context.Context
	cache                  UserPreferencesStore
	subscriptionExpiration time.Duration
	notifier               push.MessageNotifier
	log                    *slog.Logger
}

// NewNotificationMessageProcessor processes incoming messages, determines when and to whom to send a notification
// for a processed message and sends it.
func NewNotificationMessageProcessor(
	ctx context.Context,
	userPreferences UserPreferencesStore,
	config config.NotificationsConfig,
	notifier push.MessageNotifier,
) *MessageToNotificationsProcessor {
	subscriptionExpiration := 90 * 24 * time.Hour // 90 days default
	if config.SubscriptionExpirationDuration != time.Duration(0) {
		subscriptionExpiration = config.SubscriptionExpirationDuration
	}

	return &MessageToNotificationsProcessor{
		ctx:                    ctx,
		notifier:               notifier,
		cache:                  userPreferences,
		subscriptionExpiration: subscriptionExpiration,
		log:                    dlog.FromCtx(ctx),
	}
}

// OnMessageEvent sends a notification to the given user for the given event when needed.
//
// Note: there is room for an optimization for (large) space channels to keep a list of members that have subscribed
// to messages or replies and reactions and use that list to iterate over the group members to determine to who send a
// notification instead of walking over the entire member list for each message.
func (p *MessageToNotificationsProcessor) OnMessageEvent(
	channelID shared.StreamId,
	spaceID *shared.StreamId,
	members mapset.Set[string],
	event *events.ParsedEvent,
) {
	l := p.log.With(
		"channel", channelID,
		"event", event.Hash,
		"members", members.String(),
		"eventCreator", common.BytesToAddress(event.Event.CreatorAddress),
	)
	if spaceID != nil {
		l = l.With("space", *spaceID)
	}
	l.Debug("Process event")

	usersToNotify := make(map[common.Address]*types.UserPreferences)

	members.Each(func(member string) bool {
		var (
			participant = common.HexToAddress(member)
			sender      = common.BytesToAddress(event.Event.CreatorAddress)
			pref, err   = p.cache.GetUserPreferences(context.Background(), participant) // lint:ignore context.Background() is fine here
		)

		if err != nil {
			p.log.Warn("Unable to retrieve user preference to determine if notification must be send",
				"channel", channelID,
				"event", event.Hash,
				"err", err,
			)
			return false
		}

		//
		// There are 3 global rules that apply to DM, GDM, and Space channel messages
		// 1. never receive a notification for your own message
		// 2. never receive a notification when the user hasn't subscribed (web/apn push)
		// 3. never receive a notification for a message from a blocked user
		//

		if sender == participant {
			return false
		}

		if !pref.HasSubscriptions() {
			p.log.Debug("User hasn't subscribed for notifications",
				"user", participant, "event", event.Hash)
			return false
		}

		blocked := p.cache.IsBlocked(participant, sender)
		if blocked {
			p.log.Debug("Message creator was blocked", "user", participant, "blocked_user", sender)
			return false
		}

		switch payload := event.Event.Payload.(type) {
		case *StreamEvent_DmChannelPayload:
			if p.onDMChannelPayload(channelID, participant, pref, event) {
				usersToNotify[participant] = pref
			}
		case *StreamEvent_GdmChannelPayload:
			if p.onGDMChannelPayload(channelID, participant, pref, event) {
				usersToNotify[participant] = pref
			}
		case *StreamEvent_ChannelPayload:
			if spaceID != nil {
				if p.onSpaceChannelPayload(*spaceID, channelID, participant, pref, event) {
					usersToNotify[participant] = pref
				}
			} else {
				p.log.Error("Space channel misses spaceID", "channel", channelID)
			}
		default:
			p.log.Debug("unsupported payload, skip", "channel", channelID, "type", fmt.Sprintf("%T", payload))
			return false
		}

		return false
	})

	streamEventJSON, _ := json.Marshal(event)
	for user, userPref := range usersToNotify {
		p.sendNotification(user, userPref, channelID, event, streamEventJSON)
	}
}

func (p *MessageToNotificationsProcessor) onDMChannelPayload(
	streamID shared.StreamId,
	participant common.Address,
	userPref *types.UserPreferences,
	event *events.ParsedEvent,
) bool {
	if userPref.WantsNotificationForDMMessage(streamID) {
		return true
	}

	p.log.Warn("User has doesn't want to receive notification for DM message",
		"user", participant,
		"channel", streamID,
		"event", event.Hash)

	return false
}

func isMentioned(
	participant common.Address,
	groupMentions []GroupMentionType,
	mentionedUsers [][]byte,
) bool {
	if slices.Contains(groupMentions, GroupMentionType_GROUP_MENTION_TYPE_AT_CHANNEL) {
		return true
	}

	return slices.ContainsFunc(mentionedUsers, func(addr []byte) bool {
		return bytes.Equal(addr, participant[:])
	})
}

func isParticipating(
	participant common.Address,
	participatingUsers [][]byte,
) bool {
	return slices.ContainsFunc(participatingUsers, func(addr []byte) bool {
		return bytes.Equal(addr, participant[:])
	})
}

func (p *MessageToNotificationsProcessor) onGDMChannelPayload(
	streamID shared.StreamId,
	participant common.Address,
	userPref *types.UserPreferences,
	event *events.ParsedEvent,
) bool {
	messageInteractionType := event.Tags.GetMessageInteractionType()
	mentioned := isMentioned(participant, event.Tags.GetGroupMentionTypes(), event.Tags.GetMentionedUserAddresses())
	participating := isParticipating(participant, event.Tags.GetParticipatingUserAddresses())

	if userPref.WantsNotificationForGDMMessage(streamID, mentioned, participating, messageInteractionType) {
		return true
	}

	p.log.Debug("User don't want to receive notification for GDM message",
		"user", participant,
		"channel", streamID,
		"event", event.Hash,
		"mentioned", mentioned,
		"messageType", messageInteractionType)

	return false
}

func (p *MessageToNotificationsProcessor) onSpaceChannelPayload(
	spaceID shared.StreamId,
	channelID shared.StreamId,
	participant common.Address,
	userPref *types.UserPreferences,
	event *events.ParsedEvent,
) bool {
	messageInteractionType := event.Tags.GetMessageInteractionType()
	mentioned := isMentioned(participant, event.Tags.GetGroupMentionTypes(), event.Tags.GetMentionedUserAddresses())
	participating := isParticipating(participant, event.Tags.GetParticipatingUserAddresses())

	// for non-reaction events send a notification to all users
	if userPref.WantNotificationForSpaceChannelMessage(spaceID, channelID, mentioned, participating, messageInteractionType) {
		return true
	}

	p.log.Warn("User don't want to receive notification for space channel message",
		"user", participant,
		"space", spaceID,
		"channel", channelID,
		"event", event.Hash,
		"mentioned", mentioned,
		"messageType", messageInteractionType)

	return false
}

func (p *MessageToNotificationsProcessor) sendNotification(
	user common.Address,
	userPref *types.UserPreferences,
	streamID shared.StreamId,
	event *events.ParsedEvent,
	notificationPayload []byte,
) {
	for _, sub := range userPref.Subscriptions.WebPush {
		if time.Since(sub.LastSeen) >= p.subscriptionExpiration {
			continue
		}

		if err := p.sendWebPushNotification(sub.Sub, event, notificationPayload); err == nil {
			p.log.Debug("Successfully sent web push notification",
				"user", user,
				"event", event.Hash,
				"streamID", streamID,
			)
		} else {
			p.log.Error("Unable to send web push notification",
				"user",
				user, "err", err,
				"event", event.Hash,
				"streamID", streamID,
			)
		}
	}

	for _, sub := range userPref.Subscriptions.APNPush {
		if time.Since(sub.LastSeen) >= p.subscriptionExpiration {
			continue
		}

		if err := p.sendAPNNotification(sub.DeviceToken, event, notificationPayload); err == nil {
			p.log.Debug("Successfully sent APN notification",
				"user", user,
				"event", event.Hash,
				"streamID", streamID,
			)
		} else {
			p.log.Error("Unable to send APN notification",
				"user", user,
				"user", user,
				"event", event.Hash,
				"streamID", streamID,
				"err", err)
		}
	}
}

func (p *MessageToNotificationsProcessor) sendWebPushNotification(
	sub *webpush.Subscription, event *events.ParsedEvent, content []byte) error {
	// lint:ignore context.Background() is fine here
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return p.notifier.SendWebPushNotification(ctx, sub, event.Hash, content)
}

func (p *MessageToNotificationsProcessor) sendAPNNotification(
	deviceToken []byte, event *events.ParsedEvent, content []byte) error {
	// lint:ignore context.Background() is fine here
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	notificationPayload := payload.NewPayload().Alert(string(content))

	return p.notifier.SendApplePushNotification(ctx, hex.EncodeToString(deviceToken), event.Hash, notificationPayload)
}

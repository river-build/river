package notifications

import (
	"context"
	"encoding/hex"
	"fmt"
	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/notifications/push"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	payload2 "github.com/sideshow/apns2/payload"
	"log/slog"
	"time"
)

// NotificationMessageProcessor implements events.StreamEventListener and for each stream event determines
// if it needs to send a notification and to who and sends it.
type NotificationMessageProcessor struct {
	ctx      context.Context
	cache    UserPreferencesStore
	notifier push.MessageNotifier
	log      *slog.Logger
}

func NewNotificationMessageProcessor(
	ctx context.Context,
	userPreferences UserPreferencesStore,
	notifier push.MessageNotifier,
) *NotificationMessageProcessor {
	return &NotificationMessageProcessor{
		ctx:      ctx,
		notifier: notifier,
		cache:    userPreferences,
		log:      dlog.FromCtx(ctx),
	}
}

// OnMessageEvent sends a notification to the given user for the given event when needed.
func (p *NotificationMessageProcessor) OnMessageEvent(
	streamID shared.StreamId,
	streamMembers map[common.Address]struct{},
	event *events.ParsedEvent,
) {
	//var (
	//	messageInteractionType = event.Tags.GetMessageInteractionType()
	//	groupMentiondType      = event.Tags.GetGroupMentionType()
	//	mentions               = bytesToAddrs(event.Tags.GetMentionedUserAddresses())
	//	participating          = bytesToAddrs(event.Tags.GetParticipatingUserIds())
	//)

	//	*StreamEvent_MiniblockHeader
	//	*StreamEvent_MemberPayload
	//	*StreamEvent_SpacePayload
	//	*StreamEvent_ChannelPayload
	//	*StreamEvent_UserPayload
	//	*StreamEvent_UserSettingsPayload
	//	*StreamEvent_UserMetadataPayload
	//	*StreamEvent_UserInboxPayload
	//	*StreamEvent_MediaPayload
	//	*StreamEvent_DmChannelPayload
	//	*StreamEvent_GdmChannelPayload
	//switch streamID.Type() {
	//case shared.STREAM_DM_CHANNEL_BIN:
	//	if payload, ok := event.Event.Payload.(*protocol.StreamEvent_DmChannelPayload); ok {
	//		p.onDMChannelPayload(member, event, payload)
	//	}
	//case shared.STREAM_GDM_CHANNEL_BIN:
	//	if payload, ok := event.Event.Payload.(*protocol.StreamEvent_GdmChannelPayload); ok {
	//		p.onGDMChannelPayload(member, event, payload)
	//	}
	//case shared.STREAM_CHANNEL_BIN:
	//	if payload, ok := event.Event.Payload.(*protocol.StreamEvent_ChannelPayload); ok {
	//		p.onChannelPayload(member, event, payload)
	//	}
	//}

	switch payload := event.Event.Payload.(type) {
	case *protocol.StreamEvent_DmChannelPayload:
		p.onDMChannelPayload(streamMembers, event, payload)
	case *protocol.StreamEvent_GdmChannelPayload:
		p.onGDMChannelPayload(streamMembers, event, payload)
	case *protocol.StreamEvent_ChannelPayload:
		p.onChannelPayload(streamMembers, event, payload)
	default:
		p.log.Debug("unsupported payload, skip", "stream", streamID, "type", fmt.Sprintf("%T", payload))
		return
	}

	return
}

func (p *NotificationMessageProcessor) onDMChannelPayload(
	streamMembers map[common.Address]struct{},
	event *events.ParsedEvent,
	eventPayload *protocol.StreamEvent_DmChannelPayload,
) {
	for user, _ := range streamMembers {
		// never send notification for your own messages
		creator := common.BytesToAddress(event.Event.CreatorAddress)
		if creator == user {
			continue
		}

		userPref, err := p.cache.GetUserPreference(p.ctx, user)
		if err != nil {
			p.log.Error("Unable to retrieve user preference", "user", user, "err", err)
			continue
		}

		// never send notification if the user to receive the notification has blocked the event creator
		if userPref.IsUserBlocked(creator) {
			p.log.Info("Don't send notification, user blocked event creator", "creator", creator, "user", user)
			continue
		}

		// never send notification if user hasn't enabled subscriptions
		if !userPref.HasSubscription() {
			p.log.Info("Don't send notification, user hasn't subscribed on notifications", "user", user)
			continue
		}

		notificationPayload := []byte("TODO") // TODO

		p.sendNotifications(user, userPref, event, notificationPayload)

		// TODO: apply filter logic to determine if notification must be send to member
		// always send notification unless member has silenced DM notifications or specific this channel
		p.log.Info("Received DM channel payload",
			"event", event.Hash,
			"user", user,
			"content", eventPayload.DmChannelPayload.GetContent(),
			"msg", eventPayload.DmChannelPayload.GetMessage(),
			"inception", eventPayload.DmChannelPayload.GetInception())
	}
}

func parseAddrList(list [][]byte) []common.Address {
	result := make([]common.Address, 0, len(list))

	for i := range list {
		result = append(result, common.BytesToAddress(list[i]))
	}

	return result
}

func (p *NotificationMessageProcessor) onGDMChannelPayload(
	streamMembers map[common.Address]struct{},
	event *events.ParsedEvent,
	eventPayload *protocol.StreamEvent_GdmChannelPayload,
) {
	var (
		messageInteractionType = event.Tags.GetMessageInteractionType()
		//groupMentiondType      = event.Tags.GetGroupMentionTypes()
		//mentionedUsers         = parseAddrList(event.Tags.GetMentionedUserAddresses())
		participating = parseAddrList(event.Tags.GetParticipatingUserAddresses())
		eventCreator  = common.BytesToAddress(event.Event.CreatorAddress)
	)

	if messageInteractionType == protocol.MessageInteractionType_MESSAGE_INTERACTION_TYPE_REACTION {
		// only send notification to the creator of the message that was reacted on, unless he has blocked the user
		// or has disabled replyTo notifications.
		if len(participating) != 1 {
			p.log.Error("Got reaction in GDM with unexpected number of participants", "n", len(participating))
			return
		}

		user := participating[0]
		userPref, err := p.cache.GetUserPreference(p.ctx, user)
		if err != nil {
			return
		}

		if userPref.IsUserBlocked(eventCreator) {
			return
		}

		payload := []byte("TODO") // TODO
		p.sendNotifications(user, userPref, event, payload)

		return
	}

	/*
		// @channel -> send notification to all members of the stream
		if groupMentiondType == protocol.GroupMentionType_GROUP_MENTION_TYPE_AT_CHANNEL {
			for user, _ := range streamMembers {
				if user == eventCreator { // not for your own messages
					continue
				}

				userPref, err := p.cache.GetUserPreference(p.ctx, user)
				if err != nil {
					continue
				}

				if userPref.IsUserBlocked(eventCreator) { // user has blocked event creator
					continue
				}

				payload := []byte("TODO") // TODO
				p.sendNotifications(user, userPref, event, payload)
			}

			for _, mentioned := range mentionedUsers {
				if _, ok := streamMembers[mentioned]; ok {
					continue // already processed
				}

				userPref, err := p.cache.GetUserPreference(p.ctx, mentioned)
				if err != nil {
					continue
				}

				if userPref.IsUserBlocked(eventCreator) { // user has blocked event creator
					continue
				}

				payload := []byte("TODO") // TODO
				p.sendNotifications(mentioned, userPref, event, payload)
			}

			return
		}
	*/

	// for every message, mention, reply send a notification to all
	//payload := []byte("TODO") // TODO
	//p.sendNotifications(user, userPref, event, payload)

	// TODO: apply filter logic to determine if notification must be send to user
	p.log.Debug("Received GDM channel payload", "event", event.Hash, "streamMembers", streamMembers)
}

func (p *NotificationMessageProcessor) onChannelPayload(
	streamMembers map[common.Address]struct{},
	event *events.ParsedEvent,
	eventPayload *protocol.StreamEvent_ChannelPayload,
) {

	// for non-reaction events send a notification to all users

	// TODO: apply filter logic to determine if notification must be send to user
	p.log.Debug("Received channel payload", "event", event.Hash, "streamMembers", streamMembers)
}

func (p *NotificationMessageProcessor) sendNotifications(
	user common.Address,
	userPref *UserPreference,
	event *events.ParsedEvent,
	notificationPayload []byte,
) {
	for _, sub := range userPref.WebPushSubscriptions {
		if err := p.sendWebPushNotification(sub, notificationPayload); err == nil {
			p.log.Debug("Successfully sent web push notification", "user", user, "event", event.Hash)
		} else {
			p.log.Error("Unable to send web push notification", "user", user, "err", err)
		}
	}

	for _, sub := range userPref.APNSubscriptionDeviceTokens {
		if err := p.sendAPNNotification(sub, notificationPayload); err == nil {
			p.log.Debug("Successfully sent APN notification", "user", user, "event", event.Hash)
		} else {
			p.log.Error("Unable to send APN notification", "user", user, "err", err)
		}
	}
}

func (p *NotificationMessageProcessor) sendWebPushNotification(sub *webpush.Subscription, payload []byte) error {
	// lint:ignore context.Background() is fine here
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return p.notifier.SendWebPushNotification(ctx, sub, payload)
}

func (p *NotificationMessageProcessor) sendAPNNotification(deviceToken []byte, payload []byte) error {
	// lint:ignore context.Background() is fine here
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	notificationPayload := payload2.NewPayload().Alert(string(payload))

	return p.notifier.SendApplePushNotification(ctx, hex.EncodeToString(deviceToken), notificationPayload)
}

package storage

import (
	"context"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
)

type NotificationsStorage interface {
	SetSettings(
		ctx context.Context,
		userID common.Address,
		settings *protocol.Settings,
	) error

	GetSettings(
		ctx context.Context,
		userID common.Address,
	) (*protocol.Settings, error)

	UpdateSpaceSetting(
		ctx context.Context,
		userID common.Address,
		spaceID shared.StreamId,
		value protocol.SpaceNotificationSettingValue,
	) error

	UpdateChannelSetting(
		ctx context.Context,
		userID common.Address,
		spaceID *shared.StreamId,
		channelID shared.StreamId,
		value protocol.ChannelSettingValue,
	) error

	// SubscribeWebPush does an upsert for the given userID and webPushSubscription.
	// This is an upsert because a browser can be shared among multiple users and the active userID needs to
	// be correlated with the web push sub.
	SubscribeWebPush(
		ctx context.Context,
		userID common.Address,
		webPushSubscription *webpush.Subscription,
	) error

	// UnsubscribeWebPush deletes a web push subscription.
	UnsubscribeWebPush(
		ctx context.Context,
		userID common.Address,
		webPushSubscription *webpush.Subscription,
	) error

	SubscribeAPN(
		ctx context.Context,
		deviceToken []byte,
		userID common.Address,
	) error

	UnsubscribeAPN(ctx context.Context,
		deviceToken []byte,
		userID common.Address,
	) error
}

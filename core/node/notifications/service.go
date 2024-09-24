package notifications

import (
	"context"
	"errors"
	"time"

	"connectrpc.com/connect"
	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/config"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/notifications/push"
	"github.com/river-build/river/core/node/notifications/sync"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
)

type (
	Service struct {
		notificationsConfig config.NotificationsConfig
		onChainConfig       crypto.OnChainConfiguration
		storage             storage.NotificationsStorage
		tracker             *sync.StreamsTracker
		riverRegistry       *registries.RiverRegistryContract
		nodes               nodes.NodeRegistry
		notifier            push.MessageNotifier
	}
)

func NewService(
	notificationsConfig config.NotificationsConfig,
	onChainConfig crypto.OnChainConfiguration,
	storage storage.NotificationsStorage,
	riverRegistry *registries.RiverRegistryContract,
	nodes nodes.NodeRegistry,
	notifier push.MessageNotifier,
) *Service {
	return &Service{
		notificationsConfig,
		onChainConfig,
		storage,
		nil,
		riverRegistry,
		nodes,
		notifier,
	}
}

func (s *Service) Start(ctx context.Context) {
	log := dlog.FromCtx(ctx)

	go func() {
		for {
			log.Info("start streams tracker")
			tracker, err := sync.NewStreamsTracker(
				ctx, s.onChainConfig, s.notificationsConfig.Workers, s.riverRegistry, s.nodes, s.notifier)

			if err == nil {
				tracker.Run(ctx)
			} else {
				log.Error("Unable to start tracking streams", "err", err)
			}

			select {
			case <-time.After(10 * time.Second):
				continue
			case <-ctx.Done():
				return
			}
		}
	}()
}

// SetSettings sets the notification settings, overwriting any existing settings.
func (s *Service) SetSettings(
	ctx context.Context,
	req *connect.Request[protocol.SetSettingsRequest],
) (*connect.Response[protocol.SetSettingsResponse], error) {
	var (
		msg      = req.Msg
		settings = msg.GetSettings()
		userID   = common.BytesToAddress(settings.GetUserId())
	)

	if userID == (common.Address{}) {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid user id")
	}

	// TODO: validate req

	if err := s.storage.SetSettings(ctx, userID, settings); err != nil {
		return nil, AsRiverError(err).Func("SetSettings")
	}

	return connect.NewResponse(&protocol.SetSettingsResponse{}), nil
}

// GetSettings returns user stored notification settings.
func (s *Service) GetSettings(
	ctx context.Context,
	req *connect.Request[protocol.GetSettingsRequest],
) (*connect.Response[protocol.GetSettingsResponse], error) {
	var (
		msg    = req.Msg
		userID = common.BytesToAddress(msg.GetUserId())
	)

	if userID == (common.Address{}) {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid user id")
	}

	settings, err := s.storage.GetSettings(ctx, userID)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&protocol.GetSettingsResponse{
		Settings: settings,
	}), nil
}

func (s *Service) UpdateSpaceSettings(
	ctx context.Context,
	req *connect.Request[protocol.UpdateSpaceSettingsRequest],
) (*connect.Response[protocol.UpdateSpaceSettingsResponse], error) {
	var (
		msg    = req.Msg
		userID = common.BytesToAddress(msg.GetUserId())
		value  = msg.GetValue()
	)

	spaceID, err := shared.StreamIdFromBytes(msg.GetSpaceId())
	if err != nil {
		return nil, AsRiverError(err).Func("UpdateSpaceSettings")
	}

	if err := s.storage.UpdateSpaceSetting(ctx, userID, spaceID, value); err != nil {
		return nil, AsRiverError(err).Func("UpdateSpaceSettings")
	}

	return connect.NewResponse(&protocol.UpdateSpaceSettingsResponse{}), nil
}

func (s *Service) UpdateChannelSettings(
	ctx context.Context,
	req *connect.Request[protocol.UpdateChannelSettingsRequest],
) (*connect.Response[protocol.UpdateChannelSettingsResponse], error) {
	var (
		msg     = req.Msg
		userID  = common.BytesToAddress(msg.GetUserId())
		value   = msg.GetValue()
		spaceID *shared.StreamId
	)

	channelID, err := shared.StreamIdFromBytes(msg.GetChannelId())
	if err != nil {
		return nil, AsRiverError(err).Func("UpdateChannelSettings")
	}

	if len(msg.GetSpaceId()) > 0 {
		if *spaceID, err = shared.StreamIdFromBytes(msg.GetSpaceId()); err != nil {
			return nil, AsRiverError(err).Func("UpdateChannelSettings")
		}
	}

	// space id is only required for streams are part of a space
	if channelID.Type() == shared.STREAM_CHANNEL_BIN && (spaceID == nil || spaceID.Type() != shared.STREAM_SPACE_BIN) {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Missing/invalid space id")
	}

	if err := s.storage.UpdateChannelSetting(ctx, userID, spaceID, channelID, value); err != nil {
		return nil, AsRiverError(err).Func("UpdateChannelSettings")
	}

	return connect.NewResponse(&protocol.UpdateChannelSettingsResponse{}), nil
}

func (s *Service) SubscribeWebPush(
	ctx context.Context,
	req *connect.Request[protocol.SubscribeWebPushRequest],
) (*connect.Response[protocol.SubscribeWebPushResponse], error) {
	var (
		msg          = req.Msg
		userID       = common.BytesToAddress(msg.GetUserId())
		subscription = msg.GetSubscription()
		keys         = subscription.GetKeys()
		webPushSub   = &webpush.Subscription{
			Endpoint: subscription.GetEndpoint(),
			Keys: webpush.Keys{
				Auth:   keys.GetAuth(),
				P256dh: keys.GetP256Dh(),
			},
		}
	)

	if userID == (common.Address{}) {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid user id")
	}

	if err := s.storage.SubscribeWebPush(ctx, userID, webPushSub); err != nil {
		return nil, err
	}

	return connect.NewResponse(&protocol.SubscribeWebPushResponse{}), nil
}

func (s *Service) UnsubscribeWebPush(
	ctx context.Context,
	req *connect.Request[protocol.UnsubscribeWebPushRequest],
) (*connect.Response[protocol.UnsubscribeWebPushResponse], error) {
	var (
		msg          = req.Msg
		userID       = common.BytesToAddress(msg.GetUserId())
		subscription = msg.GetSubscription()
		keys         = subscription.GetKeys()
		webPushSub   = &webpush.Subscription{
			Endpoint: subscription.GetEndpoint(),
			Keys: webpush.Keys{
				Auth:   keys.GetAuth(),
				P256dh: keys.GetP256Dh(),
			},
		}
	)

	if userID == (common.Address{}) {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid user id")
	}

	if err := s.storage.UnsubscribeWebPush(ctx, userID, webPushSub); err != nil {
		return nil, err
	}

	return connect.NewResponse(&protocol.UnsubscribeWebPushResponse{}), nil
}

func (s *Service) SubscribeAPN(
	ctx context.Context,
	req *connect.Request[protocol.SubscribeAPNRequest],
) (*connect.Response[protocol.SubscribeAPNResponse], error) {
	var (
		msg         = req.Msg
		deviceToken = msg.GetDeviceToken()
		userID      = common.BytesToAddress(msg.GetUserId())
	)
	if len(deviceToken) == 0 {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid APN device token")
	}
	if userID == (common.Address{}) {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid user id")
	}

	if err := s.storage.SubscribeAPN(ctx, deviceToken, userID); err != nil {
		return nil, err
	}

	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("SubscribeAPN not implemented"))
}

func (s *Service) UnsubscribeAPN(
	ctx context.Context,
	req *connect.Request[protocol.UnsubscribeAPNRequest],
) (*connect.Response[protocol.UnsubscribeAPNResponse], error) {
	var (
		msg         = req.Msg
		deviceToken = msg.GetDeviceToken()
		userID      = common.BytesToAddress(msg.GetUserId())
	)
	if len(deviceToken) == 0 {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid APN device token")
	}
	if userID == (common.Address{}) {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid user id")
	}

	if err := s.storage.UnsubscribeAPN(ctx, deviceToken, userID); err != nil {
		return nil, err
	}

	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("UnsubscribeAPN not implemented"))
}

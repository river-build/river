package notifications

import (
	"context"
	"time"

	"connectrpc.com/connect"
	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/config"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/nodes"
	notificationssync "github.com/river-build/river/core/node/notifications/sync"
	"github.com/river-build/river/core/node/notifications/types"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/shared"
)

type (
	Service struct {
		notificationsConfig config.NotificationsConfig
		onChainConfig       crypto.OnChainConfiguration
		userPreferences     UserPreferencesStore
		riverRegistry       *registries.RiverRegistryContract
		nodes               nodes.NodeRegistry
		listener            events.StreamEventListener
		streamsTracker      *notificationssync.StreamsTracker
		metrics             infra.MetricsFactory
	}
)

func NewService(
	ctx context.Context,
	notificationsConfig config.NotificationsConfig,
	onChainConfig crypto.OnChainConfiguration,
	userPreferences UserPreferencesStore,
	riverRegistry *registries.RiverRegistryContract,
	nodes nodes.NodeRegistry,
	metrics infra.MetricsFactory,
	listener events.StreamEventListener,
) (*Service, error) {
	tracker, err := notificationssync.NewStreamsTracker(
		ctx,
		onChainConfig,
		notificationsConfig.Workers,
		riverRegistry,
		nodes,
		listener,
		userPreferences,
		metrics,
	)
	if err != nil {
		return nil, err
	}

	return &Service{
		notificationsConfig: notificationsConfig,
		onChainConfig:       onChainConfig,
		userPreferences:     userPreferences,
		riverRegistry:       riverRegistry,
		nodes:               nodes,
		listener:            listener,
		streamsTracker:      tracker,
		metrics:             metrics,
	}, nil
}

func (s *Service) Start(ctx context.Context) {
	log := dlog.FromCtx(ctx)

	go func() {
		for {
			log.Info("Start notification streams tracker")

			s.streamsTracker.Run(ctx)

			select {
			case <-time.After(10 * time.Second):
				continue
			case <-ctx.Done():
				return
			}
		}
	}()
}

// GetSettings returns user stored notification userPreferencesCache.
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

	preferences, err := s.userPreferences.GetUserPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&protocol.GetSettingsResponse{
		UserId:      preferences.UserID[:],
		Space:       preferences.Spaces.Protobuf(),
		DmGlobal:    preferences.DM,
		GdmGlobal:   preferences.GDM,
		DmChannels:  preferences.DMChannels.Protobuf(),
		GdmChannels: preferences.GDMChannels.Protobuf(),
	}), nil
}

// SetSettings sets the notification userPreferencesCache, overwriting any existing userPreferencesCache.
func (s *Service) SetSettings(
	ctx context.Context,
	req *connect.Request[protocol.SetSettingsRequest],
) (*connect.Response[protocol.SetSettingsResponse], error) {
	preferences, err := types.DecodeUserPreferenceFromMsg(req.Msg)
	if err != nil {
		return nil, err
	}

	if err := s.userPreferences.SetUserPreferences(ctx, preferences); err != nil {
		return nil, AsRiverError(err).Func("SetSettings").
			Tag("userID", preferences.UserID)
	}

	return connect.NewResponse(&protocol.SetSettingsResponse{}), nil
}

func (s *Service) SetDmGdmSettings(
	ctx context.Context,
	req *connect.Request[protocol.SetDmGdmSettingsRequest],
) (*connect.Response[protocol.SetDmGdmSettingsResponse], error) {
	var (
		msg    = req.Msg
		userID = common.BytesToAddress(msg.GetUserId())
		dm     = msg.GetDmGlobal()
		gdm    = msg.GetGdmGlobal()
	)

	err := s.userPreferences.SetGlobalDmGdm(ctx, userID, dm, gdm)
	if err != nil {
		return nil, AsRiverError(err).Func("SetDmGdmSettings")
	}

	return connect.NewResponse(&protocol.SetDmGdmSettingsResponse{}), nil
}

func (s *Service) SetSpaceSettings(
	ctx context.Context,
	req *connect.Request[protocol.SetSpaceSettingsRequest],
) (*connect.Response[protocol.SetSpaceSettingsResponse], error) {
	var (
		msg          = req.Msg
		userID       = common.BytesToAddress(msg.GetUserId())
		spaceID, err = shared.StreamIdFromBytes(msg.GetSpaceId())
		value        = msg.GetValue()
	)

	if err != nil {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid spaceId").
			Func("SetSpaceSettings")
	}

	err = s.userPreferences.SetSpaceSettings(ctx, userID, spaceID, value)
	if err != nil {
		return nil, AsRiverError(err).Func("UpdateSpaceSettings")
	}

	return connect.NewResponse(&protocol.SetSpaceSettingsResponse{}), nil
}

func (s *Service) SetDmChannelSetting(
	ctx context.Context,
	req *connect.Request[protocol.SetDmChannelSettingRequest],
) (*connect.Response[protocol.SetDmChannelSettingResponse], error) {
	var (
		msg    = req.Msg
		userID = common.BytesToAddress(msg.GetUserId())
		value  = msg.GetValue()
	)

	channelID, err := shared.StreamIdFromBytes(msg.GetDmChannelId())
	if err != nil {
		return nil, AsRiverError(err).Func("SetSpaceChannelSettings")
	}

	if channelID.Type() != shared.STREAM_DM_CHANNEL_BIN {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "channel must be a DM channel").
			Func("SetGdmChannelSetting")
	}

	if err := s.userPreferences.SetDMChannelSetting(ctx, userID, channelID, value); err != nil {
		return nil, AsRiverError(err).Func("SetDMChannelSetting")
	}

	return connect.NewResponse(&protocol.SetDmChannelSettingResponse{}), nil
}

func (s *Service) SetGdmChannelSetting(
	ctx context.Context,
	req *connect.Request[protocol.SetGdmChannelSettingRequest],
) (*connect.Response[protocol.SetGdmChannelSettingResponse], error) {
	var (
		msg    = req.Msg
		userID = common.BytesToAddress(msg.GetUserId())
		value  = msg.GetValue()
	)

	channelID, err := shared.StreamIdFromBytes(msg.GetGdmChannelId())
	if err != nil {
		return nil, AsRiverError(err).Func("SetGdmChannelSetting")
	}

	if channelID.Type() != shared.STREAM_GDM_CHANNEL_BIN {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "channel must be a GDM channel").
			Func("SetGDMChannelSetting")
	}

	if err := s.userPreferences.SetGDMChannelSetting(ctx, userID, channelID, value); err != nil {
		return nil, AsRiverError(err).Func("SetDMChannelSetting")
	}

	return connect.NewResponse(&protocol.SetGdmChannelSettingResponse{}), nil
}

func (s *Service) SetSpaceChannelSettings(
	ctx context.Context,
	req *connect.Request[protocol.SetSpaceChannelSettingsRequest],
) (*connect.Response[protocol.SetSpaceChannelSettingsResponse], error) {
	var (
		msg    = req.Msg
		userID = common.BytesToAddress(msg.GetUserId())
		value  = msg.GetValue()
	)

	channelID, err := shared.StreamIdFromBytes(msg.GetChannelId())
	if err != nil {
		return nil, AsRiverError(err).Func("SetSpaceChannelSettings")
	}

	if err := s.userPreferences.SetChannelSetting(ctx, userID, channelID, value); err != nil {
		return nil, AsRiverError(err).Func("SetChannelSettings")
	}

	return connect.NewResponse(&protocol.SetSpaceChannelSettingsResponse{}), nil
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

	if err := s.userPreferences.AddWebPushSubscription(ctx, userID, webPushSub); err != nil {
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

	if err := s.userPreferences.RemoveWebPushSubscription(ctx, userID, webPushSub); err != nil {
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
		environment = msg.GetEnvironment()
		userID      = common.BytesToAddress(msg.GetUserId())
	)
	if len(deviceToken) == 0 {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid APN device token")
	}
	if userID == (common.Address{}) {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid user id")
	}

	if err := s.userPreferences.AddAPNSubscription(ctx, userID, deviceToken, environment); err != nil {
		return nil, err
	}

	return connect.NewResponse(&protocol.SubscribeAPNResponse{}), nil
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

	if err := s.userPreferences.RemoveAPNSubscription(ctx, deviceToken, userID); err != nil {
		return nil, err
	}

	return connect.NewResponse(&protocol.UnsubscribeAPNResponse{}), nil
}

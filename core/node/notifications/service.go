package notifications

import (
	"context"
	"errors"
	"github.com/SherClockHolmes/webpush-go"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/notifications/types"
	"github.com/river-build/river/core/node/shared"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/config"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/nodes"
	notificationssync "github.com/river-build/river/core/node/notifications/sync"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
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

func (s *Service) SetChannelSettings(
	ctx context.Context,
	req *connect.Request[protocol.SetChannelSettingsRequest],
) (*connect.Response[protocol.SetChannelSettingsResponse], error) {
	var (
		msg     = req.Msg
		userID  = common.BytesToAddress(msg.GetUserId())
		value   = msg.GetValue()
		spaceID *shared.StreamId
	)

	channelID, err := shared.StreamIdFromBytes(msg.GetChannelId())
	if err != nil {
		return nil, AsRiverError(err).Func("SetChannelSettings")
	}

	if channelID.Type() == shared.STREAM_CHANNEL_BIN {
		spaceIDValue, err := shared.StreamIdFromBytes(msg.GetSpaceId())
		if err != nil {
			return nil, AsRiverError(err).Func("SetChannelSettings")
		}
		spaceID = &spaceIDValue
	}

	if err := s.userPreferences.SetChannelSetting(ctx, userID, spaceID, channelID, value); err != nil {
		return nil, AsRiverError(err).Func("SetChannelSettings")
	}

	return connect.NewResponse(&protocol.SetChannelSettingsResponse{}), nil
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
		userID      = common.BytesToAddress(msg.GetUserId())
	)
	if len(deviceToken) == 0 {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid APN device token")
	}
	if userID == (common.Address{}) {
		return nil, RiverError(protocol.Err_INVALID_ARGUMENT, "Invalid user id")
	}

	if err := s.userPreferences.AddAPNSubscription(ctx, deviceToken, userID); err != nil {
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

	if err := s.userPreferences.RemoveAPNSubscription(ctx, deviceToken, userID); err != nil {
		return nil, err
	}

	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("UnsubscribeAPN not implemented"))
}

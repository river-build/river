package notifications

import (
	"context"
	"errors"
	"time"

	"connectrpc.com/connect"
	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/notifications/push"
	"github.com/river-build/river/core/node/notifications/sync"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
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
	return &Service{notificationsConfig, onChainConfig, storage, nil, riverRegistry, nodes, notifier}
}

func (s *Service) Start(ctx context.Context) {
	log := dlog.FromCtx(ctx)

	go func() {
		for {
			log.Info("start streams tracker")
			tracker, err := sync.NewStreamsTracker(
				ctx, s.onChainConfig, s.notificationsConfig.Workers, s.riverRegistry, s.nodes, s.notifier)
			if err != nil {
				log.Error("Unable to start tracking streams", "err", err)
			}

			tracker.Run(ctx)

			select {
			case <-time.After(10 * time.Second):
				continue
			case <-ctx.Done():
				return
			}
		}
	}()
}

// GetSettings returns user stored notification settings.
func (s *Service) GetSettings(
	ctx context.Context,
	req *connect.Request[protocol.GetSettingsRequest],
) (*connect.Response[protocol.GetSettingsResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("GetSettings not implemented"))
}

// SetSettings sets the notification settings, overwriting any existing settings.
func (s *Service) SetSettings(
	ctx context.Context,
	req *connect.Request[protocol.SetSettingsRequest],
) (*connect.Response[protocol.SetSettingsResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("SetSettingsRequest not implemented"))
}

func (s *Service) SubscribeWebPush(
	ctx context.Context,
	req *connect.Request[protocol.SubscribeWebPushRequest],
) (*connect.Response[protocol.SubscribeWebPushResponse], error) {
	//var (
	//	msg          = req.Msg
	//	userID       = common.BytesToAddress(msg.GetUserId())
	//	subscription = msg.GetSubscription()
	//	keys         = subscription.GetKeys()
	//)
	//
	//webPushSub := webpush.Subscription{
	//	Endpoint: subscription.GetEndpoint(),
	//	Keys: webpush.Keys{
	//		Auth:   keys.GetAuth(),
	//		P256dh: keys.GetP256Dh(),
	//	},
	//}

	//s.storage.

	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("SubscribeWebPush not implemented"))
}

func (s *Service) UnsubscribeWebPush(
	ctx context.Context,
	c *connect.Request[protocol.UnsubscribeWebPushRequest],
) (*connect.Response[protocol.UnsubscribeWebPushResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("UnsubscribeWebPush not implemented"))
}

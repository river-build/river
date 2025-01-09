package push_test

import (
	"context"
	"encoding/hex"
	"os"
	"testing"
	"time"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/common"
	payload2 "github.com/sideshow/apns2/payload"
	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/notifications/push"
	"github.com/river-build/river/core/node/notifications/types"
	"github.com/river-build/river/core/node/protocol"
)

func TestAPNSPushNotification(t *testing.T) {
	t.Parallel()

	var (
		req = require.New(t)
		ctx = context.Background()
		cfg = &config.NotificationsConfig{
			APN: config.APNPushNotificationsConfig{
				AppBundleID: "com.towns.internal",
				Expiration:  30 * time.Minute,
				KeyID:       os.Getenv("TEST_APN_KEY_ID"),
				TeamID:      os.Getenv("TEST_APN_TEAM_ID"),
				AuthKey:     os.Getenv("TEST_APN_AUTH_KEY"),
			},
			Web: config.WebPushNotificationConfig{
				Vapid: config.WebPushVapidNotificationConfig{
					PrivateKey: os.Getenv("TEST_WEB_PUSH_VAPID_PRIV_KEY"),
					PublicKey:  os.Getenv("TEST_WEB_PUSH_VAPID_PUB_KEY"),
					Subject:    "support@towns.com",
				},
			},
		}
		notifier, err  = push.NewMessageNotifier(cfg, infra.NewMetricsFactory(nil, "", ""))
		deviceTokenHex = os.Getenv("TEST_APN_APPLE_DEVICE_TOKEN")
	)

	if cfg.APN.KeyID == "" || cfg.APN.TeamID == "" || cfg.APN.AuthKey == "" || deviceTokenHex == "" {
		t.Skip("Missing required config to run this test")
	}

	req.NoError(err, "instantiate APN push notifications client")

	payload := payload2.NewPayload().Alert("Sry to bother you if this works...")

	deviceToken, err := hex.DecodeString(deviceTokenHex)
	req.NoError(err)

	sub := types.APNPushSubscription{
		DeviceToken: deviceToken,
		LastSeen:    time.Now(),
		Environment: protocol.APNEnvironment_APN_ENVIRONMENT_SANDBOX,
	}

	expired, _, err := notifier.SendApplePushNotification(
		ctx, &sub, common.Hash{1}, payload)
	req.False(expired, "subscription should not be expired")
	req.NoError(err, "send APN notification")
}

func TestWebPushWithVapid(t *testing.T) {
	t.Parallel()

	var (
		req = require.New(t)
		ctx = context.Background()
		cfg = &config.NotificationsConfig{
			APN: config.APNPushNotificationsConfig{
				AppBundleID: "com.towns.internal",
				Expiration:  30 * time.Minute,
				KeyID:       os.Getenv("TEST_APN_KEY_ID"),
				TeamID:      os.Getenv("TEST_APN_TEAM_ID"),
				AuthKey:     os.Getenv("TEST_APN_AUTH_KEY"),
			},
			Web: config.WebPushNotificationConfig{
				Vapid: config.WebPushVapidNotificationConfig{
					PrivateKey: os.Getenv("TEST_WEB_PUSH_VAPID_PRIV_KEY"),
					PublicKey:  os.Getenv("TEST_WEB_PUSH_VAPID_PUB_KEY"),
					Subject:    "support@towns.com",
				},
			},
		}

		// adding token:  with auth:  and notification url:
		// 0xAc8828aD220471984e5Ae5B1243E8B591a58A05F endpoint
		notifier, err = push.NewMessageNotifier(cfg, infra.NewMetricsFactory(nil, "", ""))
		//subscription  = &webpush.Subscription{
		//	Endpoint: "https://web.push.apple.com/QOQETJcYW8H9Gb5NTGsrt7-RjagHc__WlPJtgxbNQXYWVODhPJYnYPEQlSrsmIhSspetY6a2ojDAJ7Lan-Ab3Fn8z4yg8EG31XJ7i16L84Upay8xnYmDbbW9BBvplFll5I6ekuo7YVMFoaGRww8VyaXLhSessF6v8RQo9LVmOxA",
		//	Keys: webpush.Keys{
		//		Auth:   `Kz-DEjmoRURwPQLqqyvgsg`,
		//		P256dh: `BDv80sQKf0iT5H68196MUUG7rFGs_UjCkDqwj28KOhMk9EmgQrrKkuz3gmgdSOuBq3jL0nAtaAtOg5mShZrOABk`,
		//	},
		//}

		subscription = &webpush.Subscription{
			Endpoint: "https://fcm.googleapis.com/fcm/send/ftSKEPOm8L4:APA91bEjJ-OFjH9dc0qyJ0G0BXoUkYYYRyiIgbjqG59DPQZZDu-aCJ388m12BEz4IMBD9CIWtf5GhSD8Y1KBxTQiLJ7Sm-LLD0NwUHQoosaAmzr2LpbyluHzTeWxwVeDOUsSca4nBKnW",
			Keys: webpush.Keys{
				Auth:   `OYxQHvUEFZnhAU-ODg8omA`,
				P256dh: `BAOatU6_ZNvMKjju2MAQUWoqkfeQFOrUSx1ubwI5IthSXxgmwKfCU2f8uv7s4yXyZgFOwycQpDK-7ILX0VknOKE`,
			},
		}
		payload = []byte("Some message")
	)

	if cfg.Web.Vapid.PrivateKey == "" || cfg.Web.Vapid.PublicKey == "" || cfg.Web.Vapid.Subject == "" {
		t.Skip("Missing required config to run this test")
	}

	req.NoError(err, "instantiate Web push notifications client")

	// payload := payload2.NewPayload().Alert("Sry to bother you if this works...")

	expired, err := notifier.SendWebPushNotification(ctx, subscription, common.Hash{1}, payload)
	req.False(expired, "expired")
	req.NoError(err, "send web push notification")
}

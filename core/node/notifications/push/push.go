package push

import (
	"context"
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"net/http"
	"time"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/common"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/river-build/river/core/config"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/notifications/types"
	"github.com/river-build/river/core/node/protocol"
	"github.com/sideshow/apns2"
	payload2 "github.com/sideshow/apns2/payload"
	"github.com/sideshow/apns2/token"
)

type (
	MessageNotifier interface {
		// SendWebPushNotification sends a web push message to the browser using the
		// VAPID protocol to authenticate the message.
		SendWebPushNotification(
			ctx context.Context,
			// subscription object as returned by the browser on enabling subscriptions.
			subscription *webpush.Subscription,
			// event hash
			eventHash common.Hash,
			// payload of the message
			payload []byte,
		) error

		// SendApplePushNotification sends a push notification to the iOS app
		SendApplePushNotification(
			ctx context.Context,
			// sub APN
			sub *types.APNPushSubscription,
			// event hash
			eventHash common.Hash,
			// payload is sent to the APP
			payload *payload2.Payload,
		) error
	}

	MessageNotifications struct {
		apnsAppBundleID string
		apnJwtSignKey   *ecdsa.PrivateKey
		apnKeyID        string
		apnTeamID       string
		apnExpiration   time.Duration

		// WebPush protected with VAPID
		vapidPrivateKey string
		vapidPublicKey  string
		vapidSubject    string

		// metrics
		webPushSend *prometheus.CounterVec
		apnSend     *prometheus.CounterVec
	}

	// MessageNotificationsSimulator implements MessageNotifier but doesn't send
	// the actual notification but only writes a log statement and captures the notification
	// in its internal state. This is intended for development and testing purposes.
	MessageNotificationsSimulator struct {
		WebPushNotificationsByEndpoint map[string][][]byte

		// metrics
		webPushSend *prometheus.CounterVec
		apnSend     *prometheus.CounterVec
	}
)

var (
	_ MessageNotifier = (*MessageNotifications)(nil)
	_ MessageNotifier = (*MessageNotificationsSimulator)(nil)
)

const (
	StatusSuccess = "success"
	StatusFailure = "failure"
)

func NewMessageNotificationsSimulator(metricsFactory infra.MetricsFactory) *MessageNotificationsSimulator {
	webPushSend := metricsFactory.NewCounterVecEx(
		"webpush_send",
		"Number of notifications send over web push",
		"result",
	)

	apnSend := metricsFactory.NewCounterVecEx(
		"apn_send",
		"Number of notifications send over APN",
		"result",
	)

	return &MessageNotificationsSimulator{
		webPushSend:                    webPushSend,
		apnSend:                        apnSend,
		WebPushNotificationsByEndpoint: make(map[string][][]byte),
	}
}

func NewMessageNotifier(
	cfg *config.NotificationsConfig,
	metricsFactory infra.MetricsFactory,
) (*MessageNotifications, error) {
	apnExpiration := 12 * time.Hour // default
	if cfg.APN.Expiration > 0 {
		apnExpiration = cfg.APN.Expiration
	}

	blockPrivateKey, _ := pem.Decode([]byte(cfg.APN.AuthKey))
	if blockPrivateKey == nil {
		return nil, RiverError(protocol.Err_BAD_CONFIG, "Missing or invalid APN auth key").
			Func("NewPushMessageNotifications")
	}

	rawKey, err := x509.ParsePKCS8PrivateKey(blockPrivateKey.Bytes)
	if err != nil {
		return nil, AsRiverError(err).
			Message("Unable to parse APN auth key").
			Func("SendAPNNotification")
	}

	apnJwtSignKey, ok := rawKey.(*ecdsa.PrivateKey)
	if !ok {
		return nil, RiverError(protocol.Err_BAD_CONFIG, "Invalid APN JWT signing key").
			Func("SendAPNNotification")
	}

	webPushSend := metricsFactory.NewCounterVecEx(
		"webpush_send",
		"Number of notifications send over web push",
		"result",
	)

	apnSend := metricsFactory.NewCounterVecEx(
		"apn_send",
		"Number of notifications send over APN",
		"result",
	)

	return &MessageNotifications{
		apnsAppBundleID: cfg.APN.AppBundleID,
		apnExpiration:   apnExpiration,
		apnJwtSignKey:   apnJwtSignKey,
		apnKeyID:        cfg.APN.KeyID,
		apnTeamID:       cfg.APN.TeamID,
		vapidPrivateKey: cfg.Web.Vapid.PrivateKey,
		vapidPublicKey:  cfg.Web.Vapid.PublicKey,
		vapidSubject:    cfg.Web.Vapid.Subject,
		webPushSend:     webPushSend,
		apnSend:         apnSend,
	}, nil
}

func (n *MessageNotifications) SendWebPushNotification(
	ctx context.Context,
	subscription *webpush.Subscription,
	eventHash common.Hash,
	payload []byte,
) error {
	options := &webpush.Options{
		Subscriber:      n.vapidSubject,
		TTL:             12 * 60 * 60, // 12h
		Urgency:         webpush.UrgencyHigh,
		VAPIDPublicKey:  n.vapidPublicKey,
		VAPIDPrivateKey: n.vapidPrivateKey,
	}

	res, err := webpush.SendNotificationWithContext(ctx, payload, subscription, options)
	if err != nil {
		n.webPushSend.With(prometheus.Labels{"result": StatusFailure}).Inc()
		return AsRiverError(err).
			Message("Send notification with WebPush failed").
			Func("SendAPNNotification")
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusCreated {
		n.webPushSend.With(prometheus.Labels{"result": StatusSuccess}).Inc()
		return nil
	}

	n.webPushSend.With(prometheus.Labels{"result": StatusFailure}).Inc()
	return RiverError(protocol.Err_UNAVAILABLE,
		"Send notification with web push vapid failed",
		"statusCode", res.StatusCode,
		"status", res.Status,
	).Func("SendWebNotification")
}

func (n *MessageNotifications) SendApplePushNotification(
	ctx context.Context,
	sub *types.APNPushSubscription,
	eventHash common.Hash,
	payload *payload2.Payload,
) error {
	notification := &apns2.Notification{
		DeviceToken: hex.EncodeToString(sub.DeviceToken),
		Topic:       n.apnsAppBundleID,
		Payload:     payload,
		Priority:    apns2.PriorityHigh,
		PushType:    apns2.PushTypeAlert,
		Expiration:  time.Now().Add(n.apnExpiration),
	}

	token := &token.Token{
		AuthKey: n.apnJwtSignKey,
		KeyID:   n.apnKeyID,
		TeamID:  n.apnTeamID,
	}

	client := apns2.NewTokenClient(token).Production()
	if sub.Environment == protocol.APNEnvironment_APN_ENVIRONMENT_SANDBOX {
		client = client.Development()
	}

	res, err := client.PushWithContext(ctx, notification)
	if err != nil {
		n.apnSend.With(prometheus.Labels{"result": StatusFailure}).Inc()
		return AsRiverError(err).
			Message("Send notification to APNS failed").
			Func("SendAPNNotification")
	}

	if res.Sent() {
		n.apnSend.With(prometheus.Labels{"result": StatusSuccess}).Inc()
		log := dlog.FromCtx(ctx).With("event", eventHash, "apnsID", res.ApnsID)
		// ApnsUniqueID only available on development/sandbox,
		// use it to check in Apple's Delivery Logs to see the status.
		if sub.Environment == protocol.APNEnvironment_APN_ENVIRONMENT_SANDBOX {
			log = log.With("uniqueApnsID", res.ApnsUniqueID)
		}
		log.Info("APN notification sent")

		return nil
	}

	n.apnSend.With(prometheus.Labels{"result": StatusFailure}).Inc()
	return RiverError(protocol.Err_UNAVAILABLE,
		"Send notification to APNS failed",
		"statusCode", res.StatusCode,
		"apnsID", res.ApnsID,
		"reason", res.Reason,
		"deviceToken", sub.DeviceToken,
	).Func("SendAPNNotification")
}

func (n *MessageNotificationsSimulator) SendWebPushNotification(
	ctx context.Context,
	subscription *webpush.Subscription,
	eventHash common.Hash,
	payload []byte,
) error {
	log := dlog.FromCtx(ctx)
	log.Info("SendWebPushNotification",
		"keys.p256dh", subscription.Keys.P256dh,
		"keys.auth", subscription.Keys.Auth,
		"payload", payload)

	n.WebPushNotificationsByEndpoint[subscription.Endpoint] = append(
		n.WebPushNotificationsByEndpoint[subscription.Endpoint], payload)

	n.webPushSend.With(prometheus.Labels{"result": StatusSuccess}).Inc()

	return nil
}

func (n *MessageNotificationsSimulator) SendApplePushNotification(
	ctx context.Context,
	sub *types.APNPushSubscription,
	eventHash common.Hash,
	payload *payload2.Payload,
) error {
	log := dlog.FromCtx(ctx)
	log.Debug("SendApplePushNotification",
		"deviceToken", sub.DeviceToken,
		"env", sub.Environment,
		"payload", payload)

	n.apnSend.With(prometheus.Labels{"result": StatusSuccess}).Inc()

	return nil
}

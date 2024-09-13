package push

import (
	"context"
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/pem"
	"net/http"
	"time"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/river-build/river/core/config"
	. "github.com/river-build/river/core/node/base"
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
			// payload of the message
			payload []byte,
		) error

		// SendApplePushNotification sends a push notification to the iOS app
		SendApplePushNotification(
			ctx context.Context,
			// deviceToken as derive by the device for the APP
			deviceToken string,
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
		apnAuthKey      token.Token

		// WebPush protected with VAPID
		vapidPrivateKey string
		vapidPublicKey  string
		vapidSubject    string
	}

	// MessageNotificationsSimulator implements MessageNotifier but doesn't send
	// the actual notification but only writes a log statement and captures the notification
	// in its internal state. This is intended for development and testing purposes.
	MessageNotificationsSimulator struct {
		WebPushNotificationsByEndpoint map[string][][]byte
	}
)

var (
	_ MessageNotifier = (*MessageNotifications)(nil)
	_ MessageNotifier = (*MessageNotificationsSimulator)(nil)
)

func NewMessageNotificationsSimulator() *MessageNotificationsSimulator {
	return &MessageNotificationsSimulator{}
}

func NewMessageNotifier(cfg *config.NotificationsConfig) (*MessageNotifications, error) {
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

	return &MessageNotifications{
		apnsAppBundleID: cfg.APN.AppBundleID,
		apnExpiration:   apnExpiration,
		apnJwtSignKey:   apnJwtSignKey,
		apnKeyID:        cfg.APN.KeyID,
		apnTeamID:       cfg.APN.TeamID,
		vapidPrivateKey: cfg.Web.Vapid.PrivateKey,
		vapidPublicKey:  cfg.Web.Vapid.PublicKey,
		vapidSubject:    cfg.Web.Vapid.Subject,
	}, nil
}

func (n *MessageNotifications) SendWebPushNotification(
	ctx context.Context,
	subscription *webpush.Subscription,
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
		return AsRiverError(err).
			Message("Send notification with WebPush failed").
			Func("SendAPNNotification")
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusCreated {
		return nil
	}

	return RiverError(protocol.Err_UNAVAILABLE,
		"Send notification with web push vapid failed",
		"statusCode", res.StatusCode,
		"status", res.Status,
	).Func("SendWebNotification")
}

func (n *MessageNotifications) SendApplePushNotification(
	ctx context.Context,
	deviceToken string,
	payload *payload2.Payload,
) error {
	notification := &apns2.Notification{
		DeviceToken: deviceToken,
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

	client := apns2.NewTokenClient(token)
	res, err := client.PushWithContext(ctx, notification)
	if err != nil {
		return AsRiverError(err).
			Message("Send notification to APNS failed").
			Func("SendAPNNotification")
	}

	if res.Sent() {
		return nil
	}

	return RiverError(protocol.Err_UNAVAILABLE,
		"Send notification to APNS failed",
		"statusCode", res.StatusCode,
		"apnsID", res.ApnsID,
		"reason", res.Reason,
	).Func("SendAPNNotification")
}

func (n *MessageNotificationsSimulator) SendWebPushNotification(
	_ context.Context,
	subscription *webpush.Subscription,
	payload []byte,
) error {
	n.WebPushNotificationsByEndpoint[subscription.Endpoint] = append(
		n.WebPushNotificationsByEndpoint[subscription.Endpoint], payload)

	return nil
}

func (n *MessageNotificationsSimulator) SendApplePushNotification(
	_ context.Context,
	deviceToken string,
	payload *payload2.Payload,
) error {

	return nil
}

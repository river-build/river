package storage

import (
	"context"
	"database/sql/driver"
	"embed"
	"encoding/hex"
	"errors"
	"fmt"
	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/common"
	"github.com/jackc/pgx/v5"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/notifications/types"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
)

type (
	UserID common.Address

	PostgresNotificationStore struct {
		PostgresEventStore

		exitSignal chan error
	}

	NotificationStore interface {
		GetUserPreferences(
			ctx context.Context,
			userID common.Address,
		) (*types.UserPreferences, error)

		SetUserPreferences(
			ctx context.Context,
			preferences *types.UserPreferences,
		) error

		SetGlobalDmGdm(
			ctx context.Context,
			userID common.Address,
			dm DmChannelSettingValue,
			gdm GdmChannelSettingValue,
		) error

		SetSpaceSettings(
			ctx context.Context,
			userID common.Address,
			spaceID shared.StreamId,
			value SpaceChannelSettingValue,
		) error

		SetChannelSetting(
			ctx context.Context,
			userID common.Address,
			spaceID *shared.StreamId,
			channelID shared.StreamId,
			value SpaceChannelSettingValue,
		) error

		GetWebPushSubscriptions(
			ctx context.Context,
			userID common.Address,
		) ([]*webpush.Subscription, error)

		// AddWebPushSubscription does an upsert for the given userID and webPushSubscription.
		// This is an upsert because a browser can be shared among multiple users and the active userID needs to
		// be correlated with the web push sub.
		AddWebPushSubscription(
			ctx context.Context,
			userID common.Address,
			webPushSubscription *webpush.Subscription,
		) error

		// RemoveWebPushSubscription deleted a web push subscription.
		RemoveWebPushSubscription(
			ctx context.Context,
			userID common.Address,
			webPushSubscription *webpush.Subscription,
		) error

		GetAPNSubscriptions(
			ctx context.Context,
			userID common.Address,
		) ([][]byte, error)

		AddAPNSubscription(
			ctx context.Context,
			userID common.Address,
			deviceToken []byte,
			environment APNEnvironment,
		) error

		RemoveAPNSubscription(ctx context.Context,
			deviceToken []byte,
			userID common.Address,
		) error
	}
)

var _ NotificationStore = (*PostgresNotificationStore)(nil)

//go:embed notification_migrations/*.sql
var notificationMigrationsDir embed.FS

func (uid UserID) Value() (driver.Value, error) {
	return hex.EncodeToString(uid[:]), nil
}

// NewPostgresNotificationStore instantiates a new PostgreSQL persistent storage for the notification service.
func NewPostgresNotificationStore(
	ctx context.Context,
	poolInfo *PgxPoolInfo,
	exitSignal chan error,
	metrics infra.MetricsFactory,
) (*PostgresNotificationStore, error) {
	store := &PostgresNotificationStore{
		exitSignal: exitSignal,
	}

	if err := store.PostgresEventStore.init(
		ctx,
		poolInfo,
		metrics,
		notificationMigrationsDir,
		"notification_migrations",
	); err != nil {
		return nil, AsRiverError(err).Func("NewPostgresNotificationStore")
	}

	return store, nil
}

// Close removes instance record from singlenodekey table, releases the listener connection, and
// closes the postgres connection pool
func (s *PostgresNotificationStore) Close(ctx context.Context) {
	s.PostgresEventStore.Close(ctx)
}

func (s *PostgresNotificationStore) SetUserPreferences(
	ctx context.Context,
	preferences *types.UserPreferences,
) error {
	return s.txRunner(
		ctx,
		"SetUserPreferences",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.setUserPreferencesTx(ctx, tx, preferences)
		},
		nil,
		"userID", preferences.UserID,
	)
}

func (s *PostgresNotificationStore) setUserPreferencesTx(
	ctx context.Context,
	tx pgx.Tx,
	preferences *types.UserPreferences,
) error {
	batch := &pgx.Batch{}

	userID := UserID(preferences.UserID)

	batch.Queue(`DELETE FROM spaces WHERE user_id = $1`, userID)
	batch.Queue(`DELETE FROM channels WHERE user_id = $1`, userID)

	batch.Queue(`INSERT INTO userpreferences (user_id, dm, gdm) VALUES ($1,$2,$3) ON CONFLICT (user_id) DO UPDATE SET dm = $2, gdm = $3`, userID, int16(preferences.DM), int16(preferences.GDM))

	for spaceID, space := range preferences.Spaces {
		batch.Queue(`INSERT INTO spaces (user_id, space_id, setting) VALUES ($1,$2,$3)`, userID, spaceID, int16(space.Setting))
		for channelID, pref := range space.Channels {
			batch.Queue(`INSERT INTO channels (user_id, channel_id, setting) VALUES ($1,$2,$3)`, userID, channelID, int16(pref))
		}
	}

	for channelID, pref := range preferences.DMChannels {
		batch.Queue(`INSERT INTO channels (user_id, channel_id, setting) VALUES ($1,$2,$3)`, userID, channelID, int16(pref))
	}

	for channelID, pref := range preferences.GDMChannels {
		batch.Queue(`INSERT INTO channels (user_id, channel_id, setting) VALUES ($1,$2,$3)`, userID, channelID, int16(pref))
	}

	br := tx.SendBatch(ctx, batch)

	_, _ = br.Exec()
	err := br.Close()

	if err != nil {
		return err // returns the cause why br.Exec failed
	}

	return nil
}

func (s *PostgresNotificationStore) SetGlobalDmGdm(
	ctx context.Context,
	userID common.Address,
	dm DmChannelSettingValue,
	gdm GdmChannelSettingValue,
) error {
	return s.txRunner(
		ctx,
		"SetGlobalDmGdm",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.setGlobalDmGdmTx(ctx, tx, UserID(userID), dm, gdm)
		},
		nil,
		"userID", userID,
	)
}

func (s *PostgresNotificationStore) setGlobalDmGdmTx(
	ctx context.Context,
	tx pgx.Tx,
	userID UserID,
	dm DmChannelSettingValue,
	gdm GdmChannelSettingValue,
) error {
	_, err := tx.Exec(
		ctx,
		`INSERT INTO userpreferences (user_id, dm, gdm) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET dm=$2, gdm = $3`,
		userID,
		int16(dm),
		int16(gdm),
	)

	return err
}

func (s *PostgresNotificationStore) SetSpaceSettings(
	ctx context.Context,
	userID common.Address,
	spaceID shared.StreamId,
	value SpaceChannelSettingValue,
) error {
	return s.txRunner(
		ctx,
		"SetSpaceSettings",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.setSpaceSettingsTx(ctx, tx, UserID(userID), spaceID, value)
		},
		nil,
		"userID", userID,
	)
}

func (s *PostgresNotificationStore) setSpaceSettingsTx(
	ctx context.Context,
	tx pgx.Tx,
	userID UserID,
	spaceID shared.StreamId,
	value SpaceChannelSettingValue,
) error {

	_, err := tx.Exec(
		ctx,
		`INSERT INTO spaces (user_id, space_id, setting) VALUES ($1, $2, $3) ON CONFLICT (user_id, space_id) DO UPDATE SET setting = $3`,
		userID,
		spaceID,
		int16(value),
	)

	return err
}

func (s *PostgresNotificationStore) SetChannelSetting(
	ctx context.Context,
	userID common.Address,
	spaceID *shared.StreamId,
	channelID shared.StreamId,
	value SpaceChannelSettingValue,
) error {
	return s.txRunner(
		ctx,
		"SetChannelSetting",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.setChannelSettingTx(ctx, tx, UserID(userID), spaceID, channelID, value)
		},
		nil,
		"userID", userID,
		"channel", channelID,
	)
}

func (s *PostgresNotificationStore) setChannelSettingTx(
	ctx context.Context,
	tx pgx.Tx,
	userID UserID,
	spaceID *shared.StreamId,
	channelID shared.StreamId,
	value SpaceChannelSettingValue,
) error {
	_, err := tx.Exec(
		ctx,
		`INSERT INTO channels (user_id, channel_id, setting) VALUES ($1, $2, $3) ON CONFLICT (user_id, channel_id) DO UPDATE SET setting = $3`,
		userID,
		channelID,
		int16(value),
	)

	return err
}

func (s *PostgresNotificationStore) GetUserPreferences(
	ctx context.Context,
	userID common.Address,
) (*types.UserPreferences, error) {
	var result *types.UserPreferences

	err := s.txRunner(
		ctx,
		"GetUserPreferences",
		pgx.ReadOnly,
		func(ctx context.Context, tx pgx.Tx) error {
			pref, err := s.getUserPreferencesTx(ctx, tx, userID)
			if err != nil {
				return err
			}
			result = pref
			return nil
		},
		nil,
	)

	if err != nil {
		return nil, err
	}

	if result == nil {
		return nil, RiverError(Err_NOT_FOUND, "User settings not found").Tag("user", userID)
	}

	return result, nil
}

func (s *PostgresNotificationStore) getUserPreferencesTx(
	ctx context.Context,
	tx pgx.Tx,
	userID common.Address,
) (*types.UserPreferences, error) {
	userPref := &types.UserPreferences{
		UserID:      userID,
		Spaces:      make(types.SpacesMap),
		DMChannels:  make(types.DMChannelsMap),
		GDMChannels: make(types.GDMChannelsMap),
	}

	row := tx.QueryRow(ctx, "SELECT dm, gdm FROM userpreferences where user_id = $1", UserID(userID))

	err := row.Scan(&userPref.DM, &userPref.GDM)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			userPref.DM = DmChannelSettingValue_DM_MESSAGES_YES
			userPref.GDM = GdmChannelSettingValue_GDM_ONLY_MENTIONS_REPLIES_REACTIONS
		} else {
			return nil, err
		}
	}

	spaceRows, err := tx.Query(
		ctx,
		`SELECT space_id, setting FROM spaces where user_id = $1`,
		UserID(userID),
	)
	if err != nil {
		return nil, err
	}
	defer spaceRows.Close()

	for spaceRows.Next() {
		var spaceID shared.StreamId
		space := &types.SpacePreferences{
			Setting:  SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_ONLY_MENTIONS_REPLIES_REACTIONS,
			Channels: make(types.SpaceChannelsMap),
		}

		if err := spaceRows.Scan(&spaceID, &space.Setting); err != nil {
			return nil, err
		}

		userPref.Spaces[spaceID] = space
	}

	channelRows, err := tx.Query(
		ctx,
		`SELECT channel_id, setting FROM channels where user_id = $1`,
		UserID(userID),
	)
	if err != nil {
		return nil, err
	}
	defer channelRows.Close()

	for channelRows.Next() {
		var (
			channelIDRaw []byte
			setting      SpaceChannelSettingValue
		)

		if err := channelRows.Scan(&channelIDRaw, &setting); err != nil {
			return nil, err
		}

		channelID, _ := shared.StreamIdFromString(string(channelIDRaw))

		if channelID.Type() == shared.STREAM_CHANNEL_BIN {
			spaceID := channelID.SpaceID()
			fmt.Printf("%s) load space %s\n", userID, spaceID)
			space, found := userPref.Spaces[spaceID]
			if !found {
				space = &types.SpacePreferences{
					Setting:  SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_ONLY_MENTIONS_REPLIES_REACTIONS,
					Channels: make(types.SpaceChannelsMap),
				}
				userPref.Spaces[spaceID] = space
			}
			space.Channels[channelID] = setting
		} else if channelID.Type() == shared.STREAM_DM_CHANNEL_BIN {
			userPref.DMChannels[channelID] = DmChannelSettingValue(setting)
		} else if channelID.Type() == shared.STREAM_GDM_CHANNEL_BIN {
			userPref.GDMChannels[channelID] = GdmChannelSettingValue(setting)
		}
	}

	userPref.Subscriptions.APNSubscriptionDeviceTokens, err = s.getAPNSubscriptions(ctx, tx, UserID(userID))
	if err != nil {
		return nil, err
	}
	userPref.Subscriptions.WebPush, err = s.getWebPushSubscriptions(ctx, tx, UserID(userID))
	if err != nil {
		return nil, err
	}

	return userPref, nil
}

func (s *PostgresNotificationStore) GetWebPushSubscriptions(
	ctx context.Context,
	userID common.Address,
) ([]*webpush.Subscription, error) {
	var (
		err  error
		subs []*webpush.Subscription
	)

	err = s.txRunner(
		ctx,
		"GetWebPushSubscriptions",
		pgx.ReadOnly,
		func(ctx context.Context, tx pgx.Tx) error {
			subs, err = s.getWebPushSubscriptions(ctx, tx, UserID(userID))
			return err
		},
		nil,
	)

	return subs, err
}

func (s *PostgresNotificationStore) getWebPushSubscriptions(
	ctx context.Context,
	tx pgx.Tx,
	userID UserID,
) ([]*webpush.Subscription, error) {
	var subs []*webpush.Subscription
	rows, err := tx.Query(
		ctx,
		"select key_auth, key_p256dh, endpoint from webpushsubscriptions where user_id=$1",
		userID,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return subs, nil
		}
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var sub webpush.Subscription
		err = rows.Scan(&sub.Keys.Auth, &sub.Keys.P256dh, &sub.Endpoint)
		if err != nil {
			return nil, err
		}

		subs = append(subs, &sub)
	}

	return subs, nil
}

// AddWebPushSubscription does an upsert for the given userID and webPushSubscription.
// This is an upsert because a browser can be shared among multiple users and the active userID needs to
// be correlated with the web push sub.
func (s *PostgresNotificationStore) AddWebPushSubscription(
	ctx context.Context,
	userID common.Address,
	webPushSubscription *webpush.Subscription,
) error {
	return s.txRunner(
		ctx,
		"AddWebPushSubscription",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.addWebPushSubscription(ctx, tx, UserID(userID), webPushSubscription)
		},
		nil,
		"userID", userID,
	)
}

func (s *PostgresNotificationStore) addWebPushSubscription(
	ctx context.Context,
	tx pgx.Tx,
	userID UserID,
	webPushSubscription *webpush.Subscription,
) error {
	_, err := tx.Exec(
		ctx,
		`INSERT INTO webpushsubscriptions (key_auth, key_p256dh, endpoint, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT (key_auth, key_p256dh) DO UPDATE SET endpoint=$3, user_id = $4`,
		webPushSubscription.Keys.Auth,
		webPushSubscription.Keys.P256dh,
		webPushSubscription.Endpoint,
		userID,
	)

	return err
}

// RemoveWebPushSubscription deletes a web push subscription.
func (s *PostgresNotificationStore) RemoveWebPushSubscription(
	ctx context.Context,
	userID common.Address,
	webPushSubscription *webpush.Subscription,
) error {
	return s.txRunner(
		ctx,
		"RemoveWebPushSubscription",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.removeWebPushSubscription(ctx, tx, webPushSubscription)
		},
		nil,
		"userID", userID,
	)
}

func (s *PostgresNotificationStore) removeWebPushSubscription(
	ctx context.Context,
	tx pgx.Tx,
	webPushSubscription *webpush.Subscription,
) error {
	_, err := tx.Exec(
		ctx,
		`DELETE FROM webpushsubscriptions where key_auth=$1 AND key_p256dh=$2`,
		webPushSubscription.Keys.Auth,
		webPushSubscription.Keys.P256dh,
	)

	return err
}

func (s *PostgresNotificationStore) GetAPNSubscriptions(
	ctx context.Context,
	userID common.Address,
) ([][]byte, error) {
	var (
		err          error
		deviceTokens [][]byte
	)

	err = s.txRunner(
		ctx,
		"GetAPNSubscriptions",
		pgx.ReadOnly,
		func(ctx context.Context, tx pgx.Tx) error {
			deviceTokens, err = s.getAPNSubscriptions(ctx, tx, UserID(userID))
			return err
		},
		nil,
	)

	return deviceTokens, err
}

func (s *PostgresNotificationStore) getAPNSubscriptions(
	ctx context.Context,
	tx pgx.Tx,
	userID UserID,
) ([][]byte, error) {
	var deviceTokens [][]byte
	rows, err := tx.Query(ctx, "select device_token, environment from apnpushsubscriptions where user_id=$1", userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return deviceTokens, nil
		}
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			deviceToken []byte
			environment APNEnvironment
		)
		err = rows.Scan(&deviceToken, &environment)
		if err != nil {
			return nil, err
		}

		deviceTokens = append(deviceTokens, deviceToken)
	}

	return deviceTokens, nil
}

func (s *PostgresNotificationStore) AddAPNSubscription(
	ctx context.Context,
	userID common.Address,
	deviceToken []byte,
	environment APNEnvironment,
) error {
	return s.txRunner(
		ctx,
		"AddAPNSubscription",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.addAPNSubscription(ctx, tx, deviceToken, environment, UserID(userID))
		},
		nil,
		"userID", userID,
	)
}

func (s *PostgresNotificationStore) addAPNSubscription(
	ctx context.Context,
	tx pgx.Tx,
	deviceToken []byte,
	environment APNEnvironment,
	userID UserID,
) error {
	_, err := tx.Exec(
		ctx,
		`INSERT INTO apnpushsubscriptions (device_token, environment, user_id) VALUES ($1, $2, $3) ON CONFLICT (device_token) DO UPDATE SET environment = $2, user_id = $3`,
		deviceToken,
		int16(environment),
		userID,
	)

	return err
}

func (s *PostgresNotificationStore) RemoveAPNSubscription(ctx context.Context,
	deviceToken []byte,
	userID common.Address,
) error {
	return s.txRunner(
		ctx,
		"RemoveAPNSubscription",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.removeAPNSubscription(ctx, tx, deviceToken)
		},
		nil,
		"userID", userID,
	)
}

func (s *PostgresNotificationStore) removeAPNSubscription(
	ctx context.Context,
	tx pgx.Tx,
	deviceToken []byte,
) error {
	_, err := tx.Exec(
		ctx,
		`DELETE FROM apnpushsubscriptions where device_token=$1`,
		deviceToken,
	)

	return err
}

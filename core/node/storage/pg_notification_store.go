package storage

import (
	"context"
	"embed"
	"errors"
	"github.com/SherClockHolmes/webpush-go"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/jackc/pgx/v5"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/notifications/types"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
)

type (
	PostgresNotificationStore struct {
		PostgresEventStore

		exitSignal        chan error
		nodeUUID          string
		cleanupListenFunc func()
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
			deviceToken []byte,
			userID common.Address,
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

// NewPostgresNotificationStore instantiates a new PostgreSQL persistent storage for the notification service.
func NewPostgresNotificationStore(
	ctx context.Context,
	poolInfo *PgxPoolInfo,
	instanceId string,
	exitSignal chan error,
	metrics infra.MetricsFactory,
) (*PostgresNotificationStore, error) {
	store := &PostgresNotificationStore{
		nodeUUID:   instanceId,
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

	if err := store.initStorage(ctx); err != nil {
		return nil, AsRiverError(err).Func("NewPostgresNotificationStore")
	}

	cancelCtx, cancel := context.WithCancel(ctx)
	store.cleanupListenFunc = cancel
	go store.listenForNewNodes(cancelCtx)

	return store, nil
}

func (s *PostgresNotificationStore) initStorage(ctx context.Context) error {
	err := s.txRunner(
		ctx,
		"listOtherInstances",
		pgx.ReadOnly,
		s.listOtherInstancesTx,
		nil,
	)
	if err != nil {
		return err
	}

	return s.txRunner(
		ctx,
		"initializeSingleNodeKey",
		pgx.ReadWrite,
		s.initializeSingleNodeKeyTx,
		nil,
	)
}

// Call with a cancellable context and pgx should terminate when the context is
// cancelled. Call after storage has been initialized in order to not receive a
// notification when this node updates the table.
func (s *PostgresNotificationStore) listenForNewNodes(ctx context.Context) {
	conn := s.acquireListeningConnection(ctx)
	if conn == nil {
		return
	}
	defer conn.Release()

	for {
		notification, err := conn.Conn().WaitForNotification(ctx)

		// Cancellation indicates a valid exit.
		if err == context.Canceled {
			return
		}

		// Unexpected.
		if err != nil {
			// Ok to call Release multiple times
			conn.Release()
			conn = s.acquireListeningConnection(ctx)
			if conn == nil {
				return
			}
			defer conn.Release()
			continue
		}

		// Listen only for changes to our schema.
		if notification.Payload == s.schemaName {
			err = RiverError(Err_RESOURCE_EXHAUSTED, "No longer a current node, shutting down").
				Func("listenForNewNodes").
				Tag("schema", s.schemaName).
				LogWarn(dlog.FromCtx(ctx))

			// In the event of detecting node conflict, send the error to the main thread to shut down.
			s.exitSignal <- err
			return
		}
	}
}

func (s *PostgresNotificationStore) listOtherInstancesTx(ctx context.Context, tx pgx.Tx) error {
	log := dlog.FromCtx(ctx)

	rows, err := tx.Query(ctx, "SELECT uuid, storage_connection_time, info FROM singlenodekey")
	if err != nil {
		return err
	}
	defer rows.Close()

	found := false
	for rows.Next() {
		var storedUUID string
		var storedTimestamp time.Time
		var storedInfo string
		err := rows.Scan(&storedUUID, &storedTimestamp, &storedInfo)
		if err != nil {
			return err
		}
		log.Info(
			"Found UUID during startup",
			"uuid",
			storedUUID,
			"timestamp",
			storedTimestamp,
			"storedInfo",
			storedInfo,
		)
		found = true
	}

	if found {
		delay := s.config.StartupDelay
		if delay == 0 {
			delay = 2 * time.Second
		} else if delay <= time.Millisecond {
			delay = 0
		}
		if delay > 0 {
			log.Info("singlenodekey is not empty; Delaying startup to let other instance exit", "delay", delay)
			time.Sleep(delay)
		}
	}

	return nil
}

func (s *PostgresNotificationStore) initializeSingleNodeKeyTx(ctx context.Context, tx pgx.Tx) error {
	_, err := tx.Exec(ctx, "DELETE FROM singlenodekey")
	if err != nil {
		return err
	}

	_, err = tx.Exec(
		ctx,
		"INSERT INTO singlenodekey (uuid, storage_connection_time, info) VALUES ($1, $2, $3)",
		s.nodeUUID,
		time.Now(),
		getCurrentNodeProcessInfo(s.schemaName),
	)
	if err != nil {
		return err
	}

	return nil
}

// Close removes instance record from singlenodekey table, releases the listener connection, and
// closes the postgres connection pool
func (s *PostgresNotificationStore) Close(ctx context.Context) {
	// Cancel the notify listening func to release the listener connection before closing the pool.
	s.cleanupListenFunc()

	s.PostgresEventStore.Close(ctx)
}

// txRunnerWithUUIDCheck conditionally run the transaction only if a check against the
// singlenodekey table shows that this is still the only node writing to the database.
func (s *PostgresNotificationStore) txRunnerWithUUIDCheck(
	ctx context.Context,
	name string,
	accessMode pgx.TxAccessMode,
	txFn func(context.Context, pgx.Tx) error,
	opts *txRunnerOpts,
	tags ...any,
) error {
	return s.txRunner(
		ctx,
		name,
		accessMode,
		func(ctx context.Context, txn pgx.Tx) error {
			if err := s.compareUUID(ctx, txn); err != nil {
				return err
			}
			return txFn(ctx, txn)
		},
		opts,
		tags...,
	)
}

func (s *PostgresNotificationStore) compareUUID(ctx context.Context, tx pgx.Tx) error {
	log := dlog.FromCtx(ctx)

	rows, err := tx.Query(ctx, "SELECT uuid FROM singlenodekey")
	if err != nil {
		return err
	}
	defer rows.Close()

	var allIds []string
	for rows.Next() {
		var id string
		err = rows.Scan(&id)
		if err != nil {
			return err
		}
		allIds = append(allIds, id)
	}

	if len(allIds) == 1 && allIds[0] == s.nodeUUID {
		return nil
	}

	err = RiverError(Err_RESOURCE_EXHAUSTED, "No longer a current node, shutting down").
		Func("pg.compareUUID").
		Tag("currentUUID", s.nodeUUID).
		Tag("schema", s.schemaName).
		Tag("newUUIDs", allIds).
		LogError(log)
	s.exitSignal <- err
	return err
}

func (s *PostgresNotificationStore) SetUserPreferences(
	ctx context.Context,
	preferences *types.UserPreferences,
) error {
	return s.txRunnerWithUUIDCheck(
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

	batch.Queue(`DELETE FROM spaces WHERE user_id = $1`, preferences.UserID)
	batch.Queue(`DELETE FROM channels WHERE user_id = $1`, preferences.UserID)

	batch.Queue(`INSERT INTO userpreferences (user_id, dm, gdm) VALUES ($1,$2,$3) ON CONFLICT (user_id) DO UPDATE SET dm = $2, gdm = $3`, preferences.UserID, int16(preferences.DM), int16(preferences.GDM))

	for spaceID, space := range preferences.Spaces {
		batch.Queue(`INSERT INTO spaces (user_id, space_id, setting) VALUES ($1,$2,$3)`, preferences.UserID, spaceID, int16(space.Setting))
		for channelID, pref := range space.Channels {
			batch.Queue(`INSERT INTO channels (user_id, channel_id, space_id, setting) VALUES ($1,$2,$3,$4)`, preferences.UserID, channelID, spaceID, int16(pref))
		}
	}

	for channelID, pref := range preferences.DMChannels {
		batch.Queue(`INSERT INTO channels (user_id, channel_id, setting) VALUES ($1,$2,$3)`, preferences.UserID, channelID, int16(pref))
	}

	for channelID, pref := range preferences.GDMChannels {
		batch.Queue(`INSERT INTO channels (user_id, channel_id, setting) VALUES ($1,$2,$3)`, preferences.UserID, channelID, int16(pref))
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
	return s.txRunnerWithUUIDCheck(
		ctx,
		"SetGlobalDmGdm",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.setGlobalDmGdmTx(ctx, tx, userID, dm, gdm)
		},
		nil,
		"userID", userID,
	)
}

func (s *PostgresNotificationStore) setGlobalDmGdmTx(
	ctx context.Context,
	tx pgx.Tx,
	userID common.Address,
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
	return s.txRunnerWithUUIDCheck(
		ctx,
		"SetSpaceSettings",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.setSpaceSettingsTx(ctx, tx, userID, spaceID, value)
		},
		nil,
		"userID", userID,
	)
}

func (s *PostgresNotificationStore) setSpaceSettingsTx(
	ctx context.Context,
	tx pgx.Tx,
	userID common.Address,
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
	return s.txRunnerWithUUIDCheck(
		ctx,
		"SetChannelSetting",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.setChannelSettingTx(ctx, tx, userID, spaceID, channelID, value)
		},
		nil,
		"userID", userID,
		"channel", channelID,
	)
}

func (s *PostgresNotificationStore) setChannelSettingTx(
	ctx context.Context,
	tx pgx.Tx,
	userID common.Address,
	spaceID *shared.StreamId,
	channelID shared.StreamId,
	value SpaceChannelSettingValue,
) error {
	_, err := tx.Exec(
		ctx,
		`INSERT INTO channels (user_id, channel_id, space_id, setting) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, channel_id) DO UPDATE SET setting = $3`,
		userID,
		channelID,
		spaceID,
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

	row := tx.QueryRow(ctx, "SELECT dm, gdm FROM userpreferences where user_id = $1", userID)

	err := row.Scan(&userPref.DM, &userPref.GDM)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	spaceRows, err := tx.Query(
		ctx,
		`SELECT space_id, setting FROM spaces where user_id = $1`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer spaceRows.Close()

	for spaceRows.Next() {
		var spaceIDRaw []byte
		space := &types.SpacePreferences{
			Setting:  SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_ONLY_MENTIONS_REPLIES_REACTIONS,
			Channels: make(types.SpaceChannelsMap),
		}

		if err := spaceRows.Scan(&spaceIDRaw, &space.Setting); err != nil {
			return nil, err
		}

		spaceID, _ := shared.StreamIdFromString(string(spaceIDRaw))
		userPref.Spaces[spaceID] = space
	}

	channelRows, err := tx.Query(
		ctx,
		`SELECT channel_id, space_id, setting FROM channels where user_id = $1`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer channelRows.Close()

	for channelRows.Next() {
		var (
			channelIDRaw []byte
			spaceIDRaw   []byte
			setting      SpaceChannelSettingValue
		)

		if err := channelRows.Scan(&channelIDRaw, &spaceIDRaw, &setting); err != nil {
			return nil, err
		}

		channelID, _ := shared.StreamIdFromString(string(channelIDRaw))
		spaceID, _ := shared.StreamIdFromString(string(spaceIDRaw))

		if channelID.Type() == shared.STREAM_CHANNEL_BIN {
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

	err = s.txRunnerWithUUIDCheck(
		ctx,
		"GetWebPushSubscriptions",
		pgx.ReadOnly,
		func(ctx context.Context, tx pgx.Tx) error {
			subs, err = s.getWebPushSubscriptions(ctx, tx, userID)
			return err
		},
		nil,
	)

	return subs, err
}

func (s *PostgresNotificationStore) getWebPushSubscriptions(
	ctx context.Context,
	tx pgx.Tx,
	userID common.Address,
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
	return s.txRunnerWithUUIDCheck(
		ctx,
		"AddWebPushSubscription",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.addWebPushSubscription(ctx, tx, userID, webPushSubscription)
		},
		nil,
		"userID", userID,
	)

	return nil
}

func (s *PostgresNotificationStore) addWebPushSubscription(
	ctx context.Context,
	tx pgx.Tx,
	userID common.Address,
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
	return s.txRunnerWithUUIDCheck(
		ctx,
		"RemoveWebPushSubscription",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.removeWebPushSubscription(ctx, tx, webPushSubscription)
		},
		nil,
		"userID", userID,
	)

	return nil
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

	err = s.txRunnerWithUUIDCheck(
		ctx,
		"GetAPNSubscriptions",
		pgx.ReadOnly,
		func(ctx context.Context, tx pgx.Tx) error {
			deviceTokens, err = s.getAPNSubscriptions(ctx, tx, userID)
			return err
		},
		nil,
	)

	return deviceTokens, err
}

func (s *PostgresNotificationStore) getAPNSubscriptions(
	ctx context.Context,
	tx pgx.Tx,
	userID common.Address,
) ([][]byte, error) {
	var deviceTokens [][]byte
	rows, err := tx.Query(ctx, "select device_token from apnpushsubscriptions where user_id=$1", userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return deviceTokens, nil
		}
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var deviceToken []byte
		err = rows.Scan(&deviceToken)
		if err != nil {
			return nil, err
		}

		deviceTokens = append(deviceTokens, deviceToken)
	}

	return deviceTokens, nil
}

func (s *PostgresNotificationStore) AddAPNSubscription(
	ctx context.Context,
	deviceToken []byte,
	userID common.Address,
) error {
	return s.txRunnerWithUUIDCheck(
		ctx,
		"AddAPNSubscription",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.addAPNSubscription(ctx, tx, deviceToken, userID)
		},
		nil,
		"userID", userID,
	)

	return nil
}

func (s *PostgresNotificationStore) addAPNSubscription(
	ctx context.Context,
	tx pgx.Tx,
	deviceToken []byte,
	userID common.Address,
) error {
	_, err := tx.Exec(
		ctx,
		`INSERT INTO apnpushsubscriptions (device_token, user_id) VALUES ($1, $2) ON CONFLICT (device_token) DO UPDATE SET user_id = $2`,
		deviceToken,
		userID,
	)

	return err
}

func (s *PostgresNotificationStore) RemoveAPNSubscription(ctx context.Context,
	deviceToken []byte,
	userID common.Address,
) error {
	return s.txRunnerWithUUIDCheck(
		ctx,
		"RemoveAPNSubscription",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.removeAPNSubscription(ctx, tx, deviceToken)
		},
		nil,
		"userID", userID,
	)

	return nil
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

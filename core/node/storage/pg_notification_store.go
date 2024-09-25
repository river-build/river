package storage

import (
	"context"
	"embed"
	"errors"
	"time"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/common"
	"github.com/jackc/pgx/v5"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/infra"
	. "github.com/river-build/river/core/node/protocol"
	"google.golang.org/protobuf/proto"
)

type (
	PostgresNotificationStore struct {
		PostgresEventStore

		exitSignal        chan error
		nodeUUID          string
		cleanupListenFunc func()
	}

	NotificationStore interface {
		SetSettings(
			ctx context.Context,
			userID common.Address,
			settings *Settings,
		) error

		GetSettings(
			ctx context.Context,
			userID common.Address,
		) (*Settings, error)

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

func (s *PostgresNotificationStore) SetSettings(
	ctx context.Context,
	userID common.Address,
	settings *Settings,
) error {
	encoded, err := proto.Marshal(settings)
	if err != nil {
		return AsRiverError(err, Err_INTERNAL).
			Message("Unable to proto serialize Settings").
			Func("SetSettings")
	}

	return s.txRunnerWithUUIDCheck(
		ctx,
		"SetSettings",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.setSettingsTx(ctx, tx, userID, encoded)
		},
		nil,
		"userID", userID,
	)
}

func (s *PostgresNotificationStore) setSettingsTx(
	ctx context.Context,
	tx pgx.Tx,
	userID common.Address,
	settings []byte,
) error {
	_, err := tx.Exec(
		ctx,
		`INSERT INTO usersettings (user_id, settings) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET settings = $2`,
		userID,
		settings,
	)

	return err
}

func (s *PostgresNotificationStore) GetSettings(
	ctx context.Context,
	userID common.Address,
) (*Settings, error) {
	var (
		settings Settings
		found    = false
	)
	err := s.txRunner(
		ctx,
		"GetSettings",
		pgx.ReadOnly,
		func(ctx context.Context, tx pgx.Tx) error {
			raw, err := s.getSettingsTx(ctx, tx, userID)
			if err != nil {
				return err
			}
			if len(raw) == 0 {
				return nil
			}
			found = true
			return proto.Unmarshal(raw, &settings)
		},
		nil,
	)
	if err != nil {
		return nil, err
	}

	if !found {
		return nil, RiverError(Err_NOT_FOUND, "settings not found", "userId", userID).
			Func("GetSettings")
	}

	return &settings, nil
}

func (s *PostgresNotificationStore) getSettingsTx(
	ctx context.Context,
	tx pgx.Tx,
	userID common.Address,
) ([]byte, error) {
	var settings []byte
	row := tx.QueryRow(ctx, "SELECT settings FROM usersettings where user_id = $1", userID)

	err := row.Scan(&settings)
	if err == nil || errors.Is(err, pgx.ErrNoRows) {
		return settings, nil
	}

	return nil, err
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

package storage

import (
	"context"
	"embed"
	"encoding/json"
	"errors"

	"github.com/ethereum/go-ethereum/common"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/infra"
	"golang.org/x/sync/semaphore"
)

type PostgresNotificationStore struct {
	config            *config.DatabaseConfig
	pool              *pgxpool.Pool
	schemaName        string
	nodeUUID          string
	exitSignal        chan error
	dbUrl             string
	migrationDir      embed.FS
	cleanupListenFunc func()

	regularConnections   *semaphore.Weighted
	streamingConnections *semaphore.Weighted

	txCounter  *infra.StatusCounterVec
	txDuration *prometheus.HistogramVec
}

var _ NotificationsStorage = (*PostgresNotificationStore)(nil)

func NewPostgresNotificationsStore(
	ctx context.Context,
	poolInfo *PgxPoolInfo,
	instanceId string,
	exitSignal chan error,
	metrics infra.MetricsFactory,
) (*PostgresNotificationStore, error) {
	//store, err := newPostgresEventStore(
	//	ctx,
	//	poolInfo,
	//	instanceId,
	//	exitSignal,
	//	metrics,
	//	migrationsDir,
	//)
	//err := errors.New("Postgres notifications storage is not implemented")
	//if err != nil {
	//	return nil, AsRiverError(err).Func("NewPostgresNotificationsStore")
	//}

	return nil, nil
}

// Close removes instance record from singlenodekey table and closes the connection pool
func (s *PostgresNotificationStore) Close(ctx context.Context) {
	//_ = s.CleanupStorage(ctx)
	//// Cancel the notify listening func to release the listener connection before closing the pool.
	//s.cleanupListenFunc()
	//
	//s.pool.Close()
}

//func (s *PostgresNotificationStore) CleanupStorage(ctx context.Context) error {
//	return s.txRunner(
//		ctx,
//		"CleanupStorage",
//		pgx.ReadWrite,
//		s.cleanupStorageTx,
//		&txRunnerOpts{disableCompareUUID: true},
//	)
//}
//
//func (s *PostgresNotificationStore) txRunner(
//	ctx context.Context,
//	name string,
//	accessMode pgx.TxAccessMode,
//	txFn func(context.Context, pgx.Tx) error,
//	opts *txRunnerOpts,
//	tags ...any,
//) error {
//	log := dlog.FromCtx(ctx).With(append(tags, "name", name, "currentUUID", s.nodeUUID, "dbSchema", s.schemaName)...)
//
//	if accessMode == pgx.ReadWrite {
//		// For write transactions context should not be cancelled if a client connection drops. Cancellations due to lost client connections can cause
//		// operations on the PostgresEventStore to fail even if transactions commit, leading to a corruption in cached state.
//		ctx = context.WithoutCancel(ctx)
//	}
//
//	defer prometheus.NewTimer(s.txDuration.WithLabelValues(name)).ObserveDuration()
//
//	var backoff backoffTracker
//	for {
//		err := s.txRunnerInner(ctx, accessMode, txFn, opts)
//		if err != nil {
//			pass := false
//
//			if pgErr, ok := err.(*pgconn.PgError); ok {
//				if pgErr.Code == pgerrcode.SerializationFailure {
//					backoffErr := backoff.wait(ctx)
//					if backoffErr != nil {
//						return AsRiverError(backoffErr).Func(name).Message("Timed out waiting for backoff")
//					}
//					log.Warn(
//						"pg.txRunner: retrying transaction due to serialization failure",
//						"pgErr", pgErr,
//					)
//					s.txCounter.WithLabelValues(name, "retry").Inc()
//					continue
//				}
//				log.Warn("pg.txRunner: transaction failed", "pgErr", pgErr)
//			} else {
//				level := slog.LevelWarn
//				if opts != nil && opts.skipLoggingNotFound && AsRiverError(err).Code == Err_NOT_FOUND {
//					// Count "not found" as succeess if error is potentially expected
//					pass = true
//					level = slog.LevelDebug
//				}
//				log.Log(ctx, level, "pg.txRunner: transaction failed", "err", err)
//			}
//
//			if pass {
//				s.txCounter.IncPass(name)
//			} else {
//				s.txCounter.IncFail(name)
//			}
//
//			return WrapRiverError(
//				Err_DB_OPERATION_FAILURE,
//				err,
//			).Func("pg.txRunner").
//				Message("transaction failed").
//				Tag("name", name).
//				Tags(tags...)
//		}
//
//		log.Debug("pg.txRunner: transaction succeeded")
//		s.txCounter.IncPass(name)
//		return nil
//	}
//}
//
//func (s *PostgresNotificationStore) txRunnerInner(
//	ctx context.Context,
//	accessMode pgx.TxAccessMode,
//	txFn func(context.Context, pgx.Tx) error,
//	opts *txRunnerOpts,
//) error {
//	// Acquire rights to use a connection. We split the pool ourselves into two parts: one for connections that stream results
//	// back, and one for regular connections. This is to prevent a streaming connections from consuming the regular pool.
//	var err error
//	var release func()
//	if opts == nil || !opts.streaming {
//		release, err = s.acquireRegularConnection(ctx)
//	} else {
//		release, err = s.acquireStreamingConnection(ctx)
//	}
//	if err != nil {
//		return AsRiverError(err, Err_DB_OPERATION_FAILURE).
//			Func("pg.txRunnerInner").
//			Message("failed to acquire connection before running transaction")
//	}
//	defer release()
//
//	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable, AccessMode: accessMode})
//	if err != nil {
//		return err
//	}
//	defer rollbackTx(ctx, tx)
//
//	if opts == nil || !opts.disableCompareUUID {
//		err = s.compareUUID(ctx, tx)
//		if err != nil {
//			return err
//		}
//	}
//
//	err = txFn(ctx, tx)
//	if err != nil {
//		return err
//	}
//
//	err = tx.Commit(ctx)
//	if err != nil {
//		return err
//	}
//	return nil
//}

func (s *PostgresNotificationStore) SetSettings(ctx context.Context, userID common.Address, settings json.RawMessage) error {
	return errors.New("Postgres notifications storage is not implemented")
}

func (s *PostgresNotificationStore) GetSettings(ctx context.Context, userID common.Address) (json.RawMessage, error) {
	return nil, errors.New("Postgres notifications storage is not implemented")
}

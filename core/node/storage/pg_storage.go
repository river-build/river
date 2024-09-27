package storage

import (
	"context"
	"database/sql"
	"embed"
	"encoding/hex"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/exaring/otelpgx"
	"github.com/prometheus/client_golang/prometheus"
	"go.opentelemetry.io/otel/trace"

	"github.com/river-build/river/core/config"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/infra"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"

	"github.com/river-build/river/core/node/dlog"

	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/sha3"
	"golang.org/x/sync/semaphore"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

type PostgresEventStore struct {
	config       *config.DatabaseConfig
	pool         *pgxpool.Pool
	schemaName   string
	dbUrl        string
	migrationDir embed.FS

	regularConnections   *semaphore.Weighted
	streamingConnections *semaphore.Weighted

	txCounter  *infra.StatusCounterVec
	txDuration *prometheus.HistogramVec
}

// var _ StreamStorage = (*PostgresEventStore)(nil)

const (
	PG_REPORT_INTERVAL = 3 * time.Minute
)

type txRunnerOpts struct {
	streaming           bool
	skipLoggingNotFound bool
}

func rollbackTx(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func (s *PostgresEventStore) acquireRegularConnection(ctx context.Context) (func(), error) {
	// Return error if context is already done.
	if ctx.Err() != nil {
		return nil, ctx.Err()
	}

	if err := s.regularConnections.Acquire(ctx, 1); err != nil {
		return nil, err
	}

	release := func() {
		s.regularConnections.Release(1)
	}

	// semaphore acquire can sometimes return a valid result for an expired context, so go ahead
	// and check again here.
	if ctx.Err() != nil {
		release()
		return nil, ctx.Err()
	}

	return release, nil
}

func (s *PostgresEventStore) acquireStreamingConnection(ctx context.Context) (func(), error) {
	// Return error if context is already done.
	if ctx.Err() != nil {
		return nil, ctx.Err()
	}

	if err := s.streamingConnections.Acquire(ctx, 1); err != nil {
		return nil, err
	}

	release := func() {
		s.streamingConnections.Release(1)
	}

	// semaphore acquire can sometimes return a valid result for an expired context, so go ahead
	// and check again here.
	if ctx.Err() != nil {
		release()
		return nil, ctx.Err()
	}

	return release, nil
}

func (s *PostgresEventStore) txRunnerInner(
	ctx context.Context,
	accessMode pgx.TxAccessMode,
	txFn func(context.Context, pgx.Tx) error,
	opts *txRunnerOpts,
) error {
	// Acquire rights to use a connection. We split the pool ourselves into two parts: one for connections that stream results
	// back, and one for regular connections. This is to prevent a streaming connections from consuming the regular pool.
	var err error
	var release func()
	if opts == nil || !opts.streaming {
		release, err = s.acquireRegularConnection(ctx)
	} else {
		release, err = s.acquireStreamingConnection(ctx)
	}
	if err != nil {
		return AsRiverError(err, Err_DB_OPERATION_FAILURE).
			Func("pg.txRunnerInner").
			Message("failed to acquire connection before running transaction")
	}
	defer release()

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable, AccessMode: accessMode})
	if err != nil {
		return err
	}
	defer rollbackTx(ctx, tx)

	err = txFn(ctx, tx)
	if err != nil {
		return err
	}

	err = tx.Commit(ctx)
	if err != nil {
		return err
	}
	return nil
}

type backoffTracker struct {
	last time.Duration
}

// Retries first attempt immediately, next waits for 50ms, then multipled by 1.5 each time.
func (b *backoffTracker) wait(ctx context.Context) error {
	if b.last == 0 {
		b.last = 50 * time.Millisecond
		return nil
	}
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(b.last):
		b.last = b.last * 3 / 2
		return nil
	}
}

func (s *PostgresEventStore) txRunner(
	ctx context.Context,
	name string,
	accessMode pgx.TxAccessMode,
	txFn func(context.Context, pgx.Tx) error,
	opts *txRunnerOpts,
	tags ...any,
) error {
	log := dlog.FromCtx(ctx).With(append(tags, "name", name, "dbSchema", s.schemaName)...)

	if accessMode == pgx.ReadWrite {
		// For write transactions context should not be cancelled if a client connection drops. Cancellations due to lost client connections can cause
		// operations on the PostgresEventStore to fail even if transactions commit, leading to a corruption in cached state.
		ctx = context.WithoutCancel(ctx)
	}

	defer prometheus.NewTimer(s.txDuration.WithLabelValues(name)).ObserveDuration()

	var backoff backoffTracker
	for {
		err := s.txRunnerInner(ctx, accessMode, txFn, opts)
		if err != nil {
			pass := false

			if pgErr, ok := err.(*pgconn.PgError); ok {
				if pgErr.Code == pgerrcode.SerializationFailure {
					backoffErr := backoff.wait(ctx)
					if backoffErr != nil {
						return AsRiverError(backoffErr).Func(name).Message("Timed out waiting for backoff")
					}
					log.Warn(
						"pg.txRunner: retrying transaction due to serialization failure",
						"pgErr", pgErr,
					)
					s.txCounter.WithLabelValues(name, "retry").Inc()
					continue
				}
				log.Warn("pg.txRunner: transaction failed", "pgErr", pgErr)
			} else {
				level := slog.LevelWarn
				if opts != nil && opts.skipLoggingNotFound && AsRiverError(err).Code == Err_NOT_FOUND {
					// Count "not found" as succeess if error is potentially expected
					pass = true
					level = slog.LevelDebug
				}
				log.Log(ctx, level, "pg.txRunner: transaction failed", "err", err)
			}

			if pass {
				s.txCounter.IncPass(name)
			} else {
				s.txCounter.IncFail(name)
			}

			return WrapRiverError(
				Err_DB_OPERATION_FAILURE,
				err,
			).Func("pg.txRunner").
				Message("transaction failed").
				Tag("name", name).
				Tags(tags...)
		}

		log.Debug("pg.txRunner: transaction succeeded")
		s.txCounter.IncPass(name)
		return nil
	}
}

type PgxPoolInfo struct {
	Pool   *pgxpool.Pool
	Url    string
	Schema string
	Config *config.DatabaseConfig
}

func createAndValidatePgxPool(
	ctx context.Context,
	cfg *config.DatabaseConfig,
	databaseSchemaName string,
	tracerProvider trace.TracerProvider,
) (*PgxPoolInfo, error) {
	databaseUrl := cfg.GetUrl()

	poolConf, err := pgxpool.ParseConfig(databaseUrl)
	if err != nil {
		return nil, err
	}

	// In general, it should be possible to add database schema name into database url as a parameter search_path (&search_path=database_schema_name)
	// For some reason it doesn't work so have to put it into config explicitly
	poolConf.ConnConfig.RuntimeParams["search_path"] = databaseSchemaName

	poolConf.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	if tracerProvider != nil {
		poolConf.ConnConfig.Tracer = otelpgx.NewTracer(
			otelpgx.WithTracerProvider(tracerProvider),
			otelpgx.WithDisableQuerySpanNamePrefix(),
			otelpgx.WithTrimSQLInSpanName(),
		)
	}

	pool, err := pgxpool.NewWithConfig(ctx, poolConf)
	if err != nil {
		return nil, err
	}

	err = pool.Ping(ctx)
	if err != nil {
		return nil, err
	}

	return &PgxPoolInfo{
		Pool:   pool,
		Url:    databaseUrl,
		Schema: databaseSchemaName,
		Config: cfg,
	}, nil
}

func CreateAndValidatePgxPool(
	ctx context.Context,
	cfg *config.DatabaseConfig,
	databaseSchemaName string,
	tracerProvider trace.TracerProvider,
) (*PgxPoolInfo, error) {
	r, err := createAndValidatePgxPool(ctx, cfg, databaseSchemaName, tracerProvider)
	if err != nil {
		return nil, AsRiverError(err, Err_DB_OPERATION_FAILURE).Func("CreateAndValidatePgxPool")
	}
	return r, nil
}

func NewPostgresEventStore(
	ctx context.Context,
	poolInfo *PgxPoolInfo,
	instanceId string,
	metrics infra.MetricsFactory,
) (*PostgresEventStore, error) {
	store := &PostgresEventStore{}
	if err := store.init(ctx, poolInfo, metrics, migrationsDir); err != nil {
		return nil, AsRiverError(err).Func("NewPostgresEventStore")
	}
	return store, nil
}

type PostgresStatusResult struct {
	TotalConns              int32         `json:"total_conns"`
	AcquiredConns           int32         `json:"acquired_conns"`
	IdleConns               int32         `json:"idle_conns"`
	ConstructingConns       int32         `json:"constructing_conns"`
	MaxConns                int32         `json:"max_conns"`
	NewConnsCount           int64         `json:"new_conns_count"`
	AcquireCount            int64         `json:"acquire_count"`
	EmptyAcquireCount       int64         `json:"empty_acquire_count"`
	CanceledAcquireCount    int64         `json:"canceled_acquire_count"`
	AcquireDuration         time.Duration `json:"acquire_duration"`
	MaxLifetimeDestroyCount int64         `json:"max_lifetime_destroy_count"`
	MaxIdleDestroyCount     int64         `json:"max_idle_destroy_count"`
	Version                 string        `json:"version"`
	SystemId                string        `json:"system_id"`
}

func PreparePostgresStatus(ctx context.Context, pool PgxPoolInfo) PostgresStatusResult {
	poolStat := pool.Pool.Stat()
	// Query to get PostgreSQL version
	var version string
	err := pool.Pool.QueryRow(ctx, "SELECT version()").Scan(&version)
	if err != nil {
		version = fmt.Sprintf("Error: %v", err)
		dlog.FromCtx(ctx).Error("failed to get PostgreSQL version", "err", err)
	}

	var systemId string
	err = pool.Pool.QueryRow(ctx, "SELECT system_identifier FROM pg_control_system()").Scan(&systemId)
	if err != nil {
		systemId = fmt.Sprintf("Error: %v", err)
	}

	return PostgresStatusResult{
		TotalConns:              poolStat.TotalConns(),
		AcquiredConns:           poolStat.AcquiredConns(),
		IdleConns:               poolStat.IdleConns(),
		ConstructingConns:       poolStat.ConstructingConns(),
		MaxConns:                poolStat.MaxConns(),
		NewConnsCount:           poolStat.NewConnsCount(),
		AcquireCount:            poolStat.AcquireCount(),
		EmptyAcquireCount:       poolStat.EmptyAcquireCount(),
		CanceledAcquireCount:    poolStat.CanceledAcquireCount(),
		AcquireDuration:         poolStat.AcquireDuration(),
		MaxLifetimeDestroyCount: poolStat.MaxLifetimeDestroyCount(),
		MaxIdleDestroyCount:     poolStat.MaxIdleDestroyCount(),
		Version:                 version,
		SystemId:                systemId,
	}
}

func SetupPostgresMetrics(ctx context.Context, pool PgxPoolInfo, factory infra.MetricsFactory) {
	// Create a function to get the latest PostgreSQL status
	getStatus := func() PostgresStatusResult {
		return PreparePostgresStatus(ctx, pool)
	}

	// Metrics for numeric values
	numericMetrics := []struct {
		name     string
		help     string
		getValue func(PostgresStatusResult) float64
	}{
		{
			"postgres_total_conns",
			"Total number of connections in the pool",
			func(s PostgresStatusResult) float64 { return float64(s.TotalConns) },
		},
		{
			"postgres_acquired_conns",
			"Number of currently acquired connections",
			func(s PostgresStatusResult) float64 { return float64(s.AcquiredConns) },
		},
		{
			"postgres_idle_conns",
			"Number of idle connections",
			func(s PostgresStatusResult) float64 { return float64(s.IdleConns) },
		},
		{
			"postgres_constructing_conns",
			"Number of connections with construction in progress",
			func(s PostgresStatusResult) float64 { return float64(s.ConstructingConns) },
		},
		{
			"postgres_max_conns",
			"Maximum number of connections allowed",
			func(s PostgresStatusResult) float64 { return float64(s.MaxConns) },
		},
		{
			"postgres_new_conns_count",
			"Total number of new connections opened",
			func(s PostgresStatusResult) float64 { return float64(s.NewConnsCount) },
		},
		{
			"postgres_acquire_count",
			"Total number of successful connection acquisitions",
			func(s PostgresStatusResult) float64 { return float64(s.AcquireCount) },
		},
		{
			"postgres_empty_acquire_count",
			"Total number of successful acquires that waited for a connection",
			func(s PostgresStatusResult) float64 { return float64(s.EmptyAcquireCount) },
		},
		{
			"postgres_canceled_acquire_count",
			"Total number of acquires canceled by context",
			func(s PostgresStatusResult) float64 { return float64(s.CanceledAcquireCount) },
		},
		{
			"postgres_acquire_duration_seconds",
			"Duration of connection acquisitions",
			func(s PostgresStatusResult) float64 { return s.AcquireDuration.Seconds() },
		},
		{
			"postgres_max_lifetime_destroy_count",
			"Total number of connections destroyed due to MaxConnLifetime",
			func(s PostgresStatusResult) float64 { return float64(s.MaxLifetimeDestroyCount) },
		},
		{
			"postgres_max_idle_destroy_count",
			"Total number of connections destroyed due to MaxConnIdleTime",
			func(s PostgresStatusResult) float64 { return float64(s.MaxIdleDestroyCount) },
		},
	}

	for _, metric := range numericMetrics {
		factory.NewGaugeFunc(
			prometheus.GaugeOpts{
				Name: metric.name,
				Help: metric.help,
			},
			func(getValue func(PostgresStatusResult) float64) func() float64 {
				return func() float64 {
					return getValue(getStatus())
				}
			}(metric.getValue),
		)
	}

	// Metrics for version, system ID, and ES count
	versionGauge := factory.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "postgres_version_info",
			Help: "PostgreSQL version information",
		},
		[]string{"version"},
	)

	systemIDGauge := factory.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "postgres_system_id_info",
			Help: "PostgreSQL system identifier information",
		},
		[]string{"system_id"},
	)

	// Function to update version, system ID, and ES count
	var (
		lastVersion  string
		lastSystemID string
		mu           sync.Mutex
	)

	updateMetrics := func() {
		status := getStatus()
		mu.Lock()
		defer mu.Unlock()

		if status.Version != lastVersion {
			versionGauge.Reset()
			versionGauge.WithLabelValues(status.Version).Set(1)
			lastVersion = status.Version
		}

		if status.SystemId != lastSystemID {
			systemIDGauge.Reset()
			systemIDGauge.WithLabelValues(status.SystemId).Set(1)
			lastSystemID = status.SystemId
		}
	}

	// Initial update
	updateMetrics()

	// Setup periodic updates
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				updateMetrics()
			}
		}
	}()
}

// Disallow allocating more than 30% of connections for streaming connections.
var MaxStreamingConnectionsRatio float32 = 0.3

func (s *PostgresEventStore) init(
	ctx context.Context,
	poolInfo *PgxPoolInfo,
	metrics infra.MetricsFactory,
	migrations embed.FS,
) error {
	log := dlog.FromCtx(ctx)

	streamingConnectionRatio := poolInfo.Config.StreamingConnectionsRatio
	// Bounds check the streaming connection ratio
	// TODO: when we add streaming calls, we should make the minimum larger, perhaps 5%.
	if streamingConnectionRatio < 0 {
		log.Info(
			"Invalid streaming connection ratio, setting to 0",
			"streamingConnectionRatio",
			streamingConnectionRatio,
		)
		streamingConnectionRatio = 0
	}
	// Limit the ratio of available connections reserved for streaming to 30%
	if streamingConnectionRatio > MaxStreamingConnectionsRatio {
		log.Info(
			"Invalid streaming connection ratio, setting to maximum of 30%",
			"streamingConnectionRatio",
			streamingConnectionRatio,
		)
		streamingConnectionRatio = MaxStreamingConnectionsRatio
	}

	var totalReservableConns int64 = int64(poolInfo.Pool.Config().MaxConns) - 1 // subtract extra connection for the listeneer
	var numRegularConnections int64 = int64(float32(totalReservableConns) * (1 - streamingConnectionRatio))
	var numStreamingConnections int64 = totalReservableConns - numRegularConnections

	// Ensure there is at least one connection set aside for streaming queries even though we're not using them at
	// this time.
	if numStreamingConnections < 1 {
		numStreamingConnections += 1
		numRegularConnections -= 1
	}
	SetupPostgresMetrics(ctx, *poolInfo, metrics)

	s.config = poolInfo.Config
	s.pool = poolInfo.Pool
	s.schemaName = poolInfo.Schema
	s.dbUrl = poolInfo.Url
	s.migrationDir = migrations
	s.regularConnections = semaphore.NewWeighted(numRegularConnections)
	s.streamingConnections = semaphore.NewWeighted(numStreamingConnections)
	s.txCounter = metrics.NewStatusCounterVecEx("dbtx_status", "PG transaction status", "name")
	s.txDuration = metrics.NewHistogramVecEx(
		"dbtx_duration_seconds",
		"PG transaction duration",
		infra.DefaultDurationBucketsSeconds,
		"name",
	)

	err := s.InitStorage(ctx)
	if err != nil {
		return err
	}

	// TODO: publish these as metrics
	// stats thread
	// go func() {
	// 	for {
	// 		timer := time.NewTimer(PG_REPORT_INTERVAL)
	// 		select {
	// 		case <-ctx.Done():
	// 			timer.Stop()
	// 			return
	// 		case <-timer.C:
	// 			stats := pool.Stat()
	// 			log.Debug("PG pool stats",
	// 				"acquireCount", stats.AcquireCount(),
	// 				"acquiredConns", stats.AcquiredConns(),
	// 				"idleConns", stats.IdleConns(),
	// 				"totalConns", stats.TotalConns(),
	// 			)
	// 		}
	// 	}
	// }()

	return nil
}

func newPostgresEventStore(
	ctx context.Context,
	poolInfo *PgxPoolInfo,
	metrics infra.MetricsFactory,
	migrations embed.FS,
) (*PostgresEventStore, error) {
	store := &PostgresEventStore{}
	if err := store.init(ctx, poolInfo, metrics, migrations); err != nil {
		return nil, err
	}
	return store, nil
}

// Close closes the connection pool
func (s *PostgresEventStore) Close(ctx context.Context) {
	s.pool.Close()
}

func (s *PostgresEventStore) InitStorage(ctx context.Context) error {
	err := s.initStorage(ctx)
	if err != nil {
		return AsRiverError(err).Func("InitStorage").Tag("schemaName", s.schemaName)
	}

	return nil
}

func (s *PostgresEventStore) createSchemaTx(ctx context.Context, tx pgx.Tx) error {
	log := dlog.FromCtx(ctx)

	// Create schema iff not exists
	var schemaExists bool
	err := tx.QueryRow(
		ctx,
		"SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = $1)",
		s.schemaName).Scan(&schemaExists)
	if err != nil {
		return err
	}

	if !schemaExists {
		createSchemaQuery := fmt.Sprintf("CREATE SCHEMA \"%s\"", s.schemaName)
		_, err := tx.Exec(ctx, createSchemaQuery)
		if err != nil {
			return err
		}
		log.Info("DB Schema created", "schema", s.schemaName)
	} else {
		if config.UseDetailedLog(ctx) {
			log.Info("DB Schema already exists", "schema", s.schemaName)
		}
	}
	return nil
}

func getSSLMode(dbURL string) string {
	if strings.Contains(dbURL, "sslmode=") {
		startIndex := strings.Index(dbURL, "sslmode=") + len("sslmode=")
		endIndex := strings.Index(dbURL[startIndex:], "&")
		if endIndex == -1 {
			endIndex = len(dbURL)
		} else {
			endIndex += startIndex
		}
		return dbURL[startIndex:endIndex]
	}
	return "disable"
}

func (s *PostgresEventStore) runMigrations(ctx context.Context) error {
	// Run migrations
	iofsMigrationsDir, err := iofs.New(s.migrationDir, "migrations")
	if err != nil {
		return WrapRiverError(Err_DB_OPERATION_FAILURE, err).Message("Error loading migrations")
	}

	dbUrlWithSchema := strings.Split(s.dbUrl, "?")[0] + fmt.Sprintf(
		"?sslmode=%s&search_path=%v,public",
		getSSLMode(s.dbUrl),
		s.schemaName,
	)
	migration, err := migrate.NewWithSourceInstance("iofs", iofsMigrationsDir, dbUrlWithSchema)
	if err != nil {
		return WrapRiverError(Err_DB_OPERATION_FAILURE, err).Message("Error creating migration instance")
	}

	// Get the current migration version before running Up()
	beforeVersion, _, err := migration.Version()
	if err != nil && err != migrate.ErrNilVersion {
		return WrapRiverError(
			Err_DB_OPERATION_FAILURE,
			err,
		).Message("Error fetching migration version before running migrations")
	}

	if err = migration.Up(); err != nil && err != migrate.ErrNoChange {
		return WrapRiverError(Err_DB_OPERATION_FAILURE, err).Message("Error running migrations")
	}

	// Get the migration version after running Up()
	afterVersion, _, err := migration.Version()
	if err != nil {
		return WrapRiverError(
			Err_DB_OPERATION_FAILURE,
			err,
		).Message("Error fetching migration version after running migrations")
	}

	// Trigger a full vacuum if we're upgrading to 5 to reclaim disk space
	if beforeVersion < 5 && afterVersion == 5 {
		// Run VACUUM FULL on the relevant tables
		if err = s.vacuumTables(ctx, dbUrlWithSchema); err != nil {
			return err
		}
	}

	return nil
}

// vacuumTables runs VACUUM FULL on the list of tables
func (s *PostgresEventStore) vacuumTables(ctx context.Context, dbUrlWithSchema string) error {
	log := dlog.FromCtx(ctx)

	db, err := sql.Open("postgres", dbUrlWithSchema)
	if err != nil {
		return err
	}
	defer db.Close()

	// Skipping miniblocks table as it can be very large and VACUUM FULL can take a long time
	tables := []string{"miniblock_candidates", "es", "minipools"}

	for _, table := range tables {
		query := fmt.Sprintf("VACUUM FULL %s;", table)
		if _, err := db.Exec(query); err != nil {
			return WrapRiverError(
				Err_DB_OPERATION_FAILURE,
				err,
			).Message("Error running VACUUM FULL").
				Tag("table", table)
		}
		log.Info("Successfully vacuumed table", "table", table)
	}

	return nil
}

// acquireListeningConnection returns a connection that listens for changes to the schema, or
// a nil connection if the context is cancelled. In the event of failure to acquire a connection
// or listen, it will retry indefinitely until success.
func (s *PostgresEventStore) acquireListeningConnection(ctx context.Context) *pgxpool.Conn {
	var err error
	var conn *pgxpool.Conn
	log := dlog.FromCtx(ctx)
	for {
		conn, err = s.pool.Acquire(ctx)
		if err == nil {
			_, err = conn.Exec(ctx, "listen singlenodekey")
			if err == nil {
				log.Debug("Listening connection acquired")
				return conn
			} else {
				conn.Release()
			}
		}
		if err == context.Canceled {
			return nil
		}
		log.Debug("Failed to acquire listening connection, retrying", "error", err)

		// In the event of networking issues, wait a small period of time for recovery.
		time.Sleep(100 * time.Millisecond)
	}
}

func (s *PostgresEventStore) initStorage(ctx context.Context) error {
	err := s.txRunner(
		ctx,
		"createSchema",
		pgx.ReadWrite,
		s.createSchemaTx,
		&txRunnerOpts{},
	)
	if err != nil {
		return err
	}

	err = s.runMigrations(ctx)
	if err != nil {
		return err
	}

	return nil
}

func createTableSuffix(streamId StreamId) string {
	sum := sha3.Sum224([]byte(streamId.String()))
	return hex.EncodeToString(sum[:])
}

func getCurrentNodeProcessInfo(currentSchemaName string) string {
	currentHostname, err := os.Hostname()
	if err != nil {
		currentHostname = "unknown"
	}
	currentPID := os.Getpid()
	return fmt.Sprintf("hostname=%s, pid=%d, schema=%s", currentHostname, currentPID, currentSchemaName)
}

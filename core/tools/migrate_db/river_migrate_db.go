package main

import (
	"context"
	"encoding/hex"
	"errors"
	"fmt"
	"os"

	"github.com/gammazero/workerpool"
	"github.com/golang-migrate/migrate/v4"
	pgxmigrate "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"golang.org/x/crypto/sha3"

	"github.com/river-build/river/core/node/storage"
)

func wrapError(message string, err error) error {
	return fmt.Errorf("%s: %w", message, err)
}

func getPartitionName(table string, streamId string) string {
	sum := sha3.Sum224([]byte(streamId))
	return fmt.Sprintf("%s_%s", table, hex.EncodeToString(sum[:]))[0:63]
}

type dbInfo struct {
	url    string
	schema string
}

func getDbPool(
	ctx context.Context,
	db dbInfo,
	password string,
	requireSchema bool,
) (*pgxpool.Pool, error) {
	if db.url == "" {
		return nil, errors.New("database URL is not set")
	}
	if requireSchema && db.schema == "" {
		return nil, errors.New("schema is not set")
	}

	cfg, err := pgxpool.ParseConfig(db.url)
	if err != nil {
		return nil, err
	}

	if password != "" {
		cfg.ConnConfig.Password = password
	}

	if db.schema != "" {
		cfg.ConnConfig.RuntimeParams["search_path"] = db.schema
	}

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, err
	}

	return pool, nil
}

func getSourceDbPool(ctx context.Context, requireSchema bool) (*pgxpool.Pool, *dbInfo, error) {
	var info dbInfo
	info.url = viper.GetString("RIVER_DB_SOURCE_URL")
	if info.url == "" {
		return nil, nil, errors.New("source database URL is not set: --source_db or RIVER_DB_SOURCE")
	}
	password := viper.GetString("RIVER_DB_SOURCE_PASSWORD")
	info.schema = viper.GetString("RIVER_DB_SCHEMA")

	pool, err := getDbPool(ctx, info, password, requireSchema)
	if err != nil {
		return nil, nil, wrapError("Failed to initialize source database pool", err)
	}

	return pool, &info, nil
}

func getTargetDbPool(ctx context.Context, requireSchema bool) (*pgxpool.Pool, *dbInfo, error) {
	var info dbInfo
	info.url = viper.GetString("RIVER_DB_TARGET_URL")
	if info.url == "" {
		return nil, nil, errors.New("target database URL is not set: --target_db or RIVER_DB_TARGET")
	}
	password := viper.GetString("RIVER_DB_TARGET_PASSWORD")
	info.schema = viper.GetString("RIVER_DB_SCHEMA")
	schemaOverwrite := viper.GetString("RIVER_DB_SCHEMA_TARGET_OVERWRITE")
	if schemaOverwrite != "" {
		info.schema = schemaOverwrite
	}

	pool, err := getDbPool(ctx, info, password, requireSchema)
	if err != nil {
		return nil, nil, wrapError("Failed to initialize target database pool", err)
	}

	return pool, &info, nil
}

func testDbConnection(ctx context.Context, pool *pgxpool.Pool, info *dbInfo) error {
	var version string
	err := pool.QueryRow(ctx, "SELECT version()").Scan(&version)
	if err != nil {
		return wrapError("Failed to get database version", err)
	}

	fmt.Println("Database version:", version)

	if info.schema != "" {
		var streamCount int
		err = pool.QueryRow(ctx, "SELECT count(*) FROM es").Scan(&streamCount)
		if err != nil {
			return wrapError("Failed to count streams (wrong schema?)", err)
		}

		fmt.Println("Stream count:", streamCount)
	}

	return nil
}

var rootCmd = &cobra.Command{
	Use:          "river_migrate_db",
	SilenceUsage: true,
}

func init() {
	rootCmd.PersistentFlags().StringP("db_source", "s", "", "Source database URL")
	_ = viper.BindPFlag("RIVER_DB_SOURCE_URL", rootCmd.PersistentFlags().Lookup("db_source"))

	rootCmd.PersistentFlags().StringP("db_target", "t", "", "Target database URL")
	_ = viper.BindPFlag("RIVER_DB_TARGET_URL", rootCmd.PersistentFlags().Lookup("db_target"))

	viper.SetDefault("RIVER_DB_SOURCE_PASSWORD", "")
	viper.SetDefault("RIVER_DB_TARGET_PASSWORD", "")

	rootCmd.PersistentFlags().StringP("schema", "i", "", "Schema name (i.e. instance hex id preffixed with 's0x')")
	_ = viper.BindPFlag("RIVER_DB_SCHEMA", rootCmd.PersistentFlags().Lookup("schema"))

	rootCmd.PersistentFlags().StringP("schema_target_overwrite", "o", "", "Advanced: restore into different schema")
	_ = viper.BindPFlag("RIVER_DB_SCHEMA_TARGET_OVERWRITE", rootCmd.PersistentFlags().Lookup("schema_target_overwrite"))

	rootCmd.PersistentFlags().IntP("num_workers", "n", 4, "Number of parallel workers to use for target db operations")
	_ = viper.BindPFlag("RIVER_DB_NUM_WORKERS", rootCmd.PersistentFlags().Lookup("num_workers"))

	rootCmd.PersistentFlags().IntP("tx_size", "x", 10, "Number of streams to process in a single transaction")
	_ = viper.BindPFlag("RIVER_DB_TX_SIZE", rootCmd.PersistentFlags().Lookup("tx_size"))
}

var sourceCmd = &cobra.Command{
	Use:   "source",
	Short: "Validate source database settings",
}

func init() {
	rootCmd.AddCommand(sourceCmd)
}

var sourceTestCmd = &cobra.Command{
	Use:   "test",
	Short: "Test source database connection",
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := cmd.Context()
		pool, info, err := getSourceDbPool(ctx, true)
		if err != nil {
			return err
		}

		fmt.Println("Testing source database connection")
		return testDbConnection(ctx, pool, info)
	},
}

func init() {
	sourceCmd.AddCommand(sourceTestCmd)
}

var (
	sourceListCmdCount bool
	sourceListCmd      = &cobra.Command{
		Use:   "list",
		Short: "List source database schemas",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := cmd.Context()
			pool, _, err := getSourceDbPool(ctx, false)
			if err != nil {
				return err
			}

			rows, err := pool.Query(ctx, "SELECT schema_name FROM information_schema.schemata")
			if err != nil {
				return err
			}
			defer rows.Close()

			for rows.Next() {
				var schema string
				err = rows.Scan(&schema)
				if err != nil {
					return err
				}
				if !sourceListCmdCount {
					fmt.Println(schema)
				} else {
					streamCount := -1
					_ = pool.QueryRow(ctx, fmt.Sprintf("SELECT count(*) FROM %s.es", schema)).Scan(&streamCount)
					fmt.Println(schema, streamCount)
				}
			}

			return nil
		},
	}
)

func init() {
	sourceListCmd.Flags().BoolVar(&sourceListCmdCount, "count", false, "Count streams for each schema")
	sourceCmd.AddCommand(sourceListCmd)
}

var sourceListPCmd = &cobra.Command{
	Use:   "list_partitions",
	Short: "List source database partitions",
	RunE: func(cmd *cobra.Command, args []string) error {
		pool, _, err := getSourceDbPool(cmd.Context(), true)
		if err != nil {
			return err
		}

		return printPartitions(cmd.Context(), pool)
	},
}

func init() {
	sourceCmd.AddCommand(sourceListPCmd)
}

var targetCmd = &cobra.Command{
	Use:   "target",
	Short: "Init or validate target database",
}

func init() {
	rootCmd.AddCommand(targetCmd)
}

var targetTestCmd = &cobra.Command{
	Use:   "test",
	Short: "Test target database connection",
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := cmd.Context()
		pool, info, err := getTargetDbPool(ctx, false)
		if err != nil {
			return err
		}

		fmt.Println("Testing target database connection")
		return testDbConnection(ctx, pool, info)
	},
}

func init() {
	targetCmd.AddCommand(targetTestCmd)
}

var targetCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create target database schema",
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := cmd.Context()
		pool, info, err := getTargetDbPool(ctx, false)
		if err != nil {
			return err
		}

		_, err = pool.Exec(ctx, fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS \"%s\"", info.schema))
		return err
	},
}

func init() {
	targetCmd.AddCommand(targetCreateCmd)
}

var targetInitCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize target database",
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := cmd.Context()

		iofsMigrationsDir, err := iofs.New(storage.GetRiverNodeDbMigrationSchemaFS(), "migrations")
		if err != nil {
			return wrapError("Failed to load migrations", err)
		}

		pool, info, err := getTargetDbPool(ctx, true)
		if err != nil {
			return wrapError("Failed to initialize target database pool", err)
		}

		pgxDriver, err := pgxmigrate.WithInstance(
			stdlib.OpenDBFromPool(pool),
			&pgxmigrate.Config{
				SchemaName: info.schema,
			})
		if err != nil {
			return wrapError("Failed to initialize target database migration driver", err)
		}

		migration, err := migrate.NewWithInstance("iofs", iofsMigrationsDir, "pgx", pgxDriver)
		if err != nil {
			return wrapError("Failed to initialize target database migration", err)
		}

		err = migration.Up()
		if err != nil {
			if err != migrate.ErrNoChange {
				return wrapError("Error running migrations", err)
			} else {
				fmt.Println("WARN: schema already initialized")
			}
		}

		return nil
	},
}

func init() {
	targetCmd.AddCommand(targetInitCmd)
}

func queryPartitions(ctx context.Context, pool *pgxpool.Pool, table string) ([]string, error) {
	rows, _ := pool.Query(
		ctx,
		"SELECT inhrelid::regclass AS child FROM   pg_catalog.pg_inherits WHERE  inhparent = $1::regclass",
		table,
	)
	parts, err := pgx.CollectRows(rows, pgx.RowTo[string])
	if err != nil {
		return nil, wrapError("Failed to query partitions for "+table, err)
	}
	return parts, nil
}

func getMissingPartitionsSql(
	ctx context.Context,
	stream_ids []string,
	pool *pgxpool.Pool,
	table string,
) ([]string, error) {
	var ret []string
	parts, err := queryPartitions(ctx, pool, table)
	if err != nil {
		return nil, err
	}
	pp := map[string]bool{}
	for _, p := range parts {
		pp[p] = true
	}
	for _, id := range stream_ids {
		partName := getPartitionName(table, id)
		if !pp[partName] {
			ret = append(
				ret,
				fmt.Sprintf(
					"CREATE TABLE IF NOT EXISTS %s PARTITION OF %s FOR VALUES IN ('%s')",
					partName,
					table,
					id,
				),
			)
		}
	}
	return ret, nil
}

func chunk(slice []string, size int) [][]string {
	var ret [][]string
	for i := 0; i < len(slice); i += size {
		ret = append(ret, slice[i:min(len(slice), i+size)])
	}
	return ret
}

func rollbackTx(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func executeSqlInTx(ctx context.Context, pool *pgxpool.Pool, sql []string) error {
	tx, err := pool.BeginTx(ctx, pgx.TxOptions{
		IsoLevel:   pgx.ReadCommitted,
		AccessMode: pgx.ReadWrite,
	})
	if err != nil {
		return wrapError("Failed to begin transaction", err)
	}
	defer rollbackTx(ctx, tx)

	for _, s := range sql {
		_, err = tx.Exec(ctx, s)
		if err != nil {
			return wrapError("Failed to execute SQL", err)
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return wrapError("Failed to commit transaction", err)
	}

	return nil
}

func getStreamIds(ctx context.Context, pool *pgxpool.Pool) ([]string, error) {
	rows, _ := pool.Query(ctx, "SELECT stream_id FROM es")
	stream_ids, err := pgx.CollectRows(rows, pgx.RowTo[string])
	if err != nil {
		return nil, wrapError("Failed to read es table", err)
	}
	return stream_ids, nil
}

func createPartitions(
	ctx context.Context,
	sourcePool *pgxpool.Pool,
	targetPool *pgxpool.Pool,
) error {
	stream_ids, err := getStreamIds(ctx, sourcePool)
	if err != nil {
		return wrapError("Failed to get stream ids from source", err)
	}

	mp_sql, err := getMissingPartitionsSql(ctx, stream_ids, targetPool, "minipools")
	if err != nil {
		return wrapError("Failed to get missing minipools partitions", err)
	}

	mb_sql, err := getMissingPartitionsSql(ctx, stream_ids, targetPool, "miniblocks")
	if err != nil {
		return wrapError("Failed to get missing miniblocks partitions", err)
	}

	cand_sql, err := getMissingPartitionsSql(ctx, stream_ids, targetPool, "miniblock_candidates")
	if err != nil {
		return wrapError("Failed to get missing miniblock_candidates partitions", err)
	}

	sql := append(mp_sql, mb_sql...)
	sql = append(sql, cand_sql...)

	if len(sql) == 0 {
		fmt.Println("All partitions already exist")
		return nil
	}
	fmt.Println("Creating partitions:", len(sql))

	numWorkers := viper.GetInt("RIVER_DB_NUM_WORKERS")
	txSize := viper.GetInt("RIVER_DB_TX_SIZE")
	if txSize <= 0 {
		txSize = 1
	}

	workerPool := workerpool.New(numWorkers)

	workItems := chunk(sql, txSize)

	for _, workItem := range workItems {
		workerPool.Submit(func() {
			err := executeSqlInTx(ctx, targetPool, workItem)
			if err != nil {
				fmt.Println("ERROR:", err)
				os.Exit(1)
			}
		})
	}

	workerPool.StopWait()

	return nil
}

var targetPartitionCmd = &cobra.Command{
	Use:   "partition",
	Short: "Create partitions matching source in target database",
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := cmd.Context()
		sourcePool, sourceInfo, err := getSourceDbPool(ctx, true)
		if err != nil {
			return err
		}
		err = testDbConnection(ctx, sourcePool, sourceInfo)
		if err != nil {
			return err
		}

		targetPool, targetInfo, err := getTargetDbPool(ctx, true)
		if err != nil {
			return err
		}
		err = testDbConnection(ctx, targetPool, targetInfo)
		if err != nil {
			return err
		}

		return createPartitions(ctx, sourcePool, targetPool)
	},
}

func init() {
	targetCmd.AddCommand(targetPartitionCmd)
}

func printPartitions(ctx context.Context, pool *pgxpool.Pool) error {
	parts, err := queryPartitions(ctx, pool, "minipools")
	if err != nil {
		return wrapError("Failed to query partitions for minipools", err)
	}
	for _, p := range parts {
		fmt.Println(p)
	}

	parts, err = queryPartitions(ctx, pool, "miniblocks")
	if err != nil {
		return wrapError("Failed to query partitions for miniblocks", err)
	}
	for _, p := range parts {
		fmt.Println(p)
	}

	parts, err = queryPartitions(ctx, pool, "miniblock_candidates")
	if err != nil {
		return wrapError("Failed to query partitions for miniblock_candidates", err)
	}
	for _, p := range parts {
		fmt.Println(p)
	}
	return nil
}

var targetListPCmd = &cobra.Command{
	Use:   "list_partitions",
	Short: "List target database partitions",
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := cmd.Context()
		pool, _, err := getTargetDbPool(ctx, true)
		if err != nil {
			return err
		}

		return printPartitions(ctx, pool)
	},
}

func init() {
	targetCmd.AddCommand(targetListPCmd)
}

func copyPart(ctx context.Context, source *pgxpool.Conn, tx pgx.Tx, streamId string, table string, force bool) error {
	partition := getPartitionName(table, streamId)

	rows, err := source.Query(
		ctx,
		fmt.Sprintf("SELECT * FROM %s WHERE stream_id = $1", partition),
		streamId,
	)
	if err != nil {
		return fmt.Errorf("ERROR: Failed to query %s for stream %s: %w", partition, streamId, err)
	}
	defer rows.Close()

	if force {
		_, err = tx.Exec(ctx, fmt.Sprintf("DELETE FROM %s WHERE stream_id = $1", partition), streamId)
		if err != nil {
			return fmt.Errorf("failed to delete from %s for stream %s: %w", partition, streamId, err)
		}
	}

	columnNames := []string{}
	for _, desc := range rows.FieldDescriptions() {
		columnNames = append(columnNames, desc.Name)
	}

	_, err = tx.CopyFrom(ctx, pgx.Identifier{partition}, columnNames, rows)
	if err != nil {
		return fmt.Errorf("failed to copy from %s for stream %s: %w", partition, streamId, err)
	}
	return nil
}

func copyStream(ctx context.Context, source *pgxpool.Conn, tx pgx.Tx, streamId string, force bool) error {
	var latestSnapshotMiniblock int64
	err := source.QueryRow(ctx, "SELECT latest_snapshot_miniblock FROM es WHERE stream_id = $1", streamId).
		Scan(&latestSnapshotMiniblock)
	if err != nil {
		return wrapError("Failed to read latest snapshot miniblock for stream "+streamId, err)
	}

	_, err = tx.Exec(
		ctx,
		`INSERT INTO es (stream_id, latest_snapshot_miniblock) 
        VALUES ($1, $2)
        ON CONFLICT (stream_id) 
        DO UPDATE SET latest_snapshot_miniblock = $2`,
		streamId,
		latestSnapshotMiniblock,
	)
	if err != nil {
		return wrapError("Failed to insert into es for stream "+streamId, err)
	}

	err = copyPart(ctx, source, tx, streamId, "minipools", force)
	if err != nil {
		return err
	}
	err = copyPart(ctx, source, tx, streamId, "miniblocks", force)
	if err != nil {
		return err
	}
	err = copyPart(ctx, source, tx, streamId, "miniblock_candidates", force)
	if err != nil {
		return err
	}
	return nil
}

func copyStreams(
	ctx context.Context,
	source *pgxpool.Pool,
	target *pgxpool.Pool,
	streamIds []string,
	force bool,
) error {
	sourceConn, err := source.Acquire(ctx)
	if err != nil {
		return wrapError("Failed to acquire source connection", err)
	}
	defer sourceConn.Release()

	tx, err := target.BeginTx(ctx, pgx.TxOptions{
		IsoLevel:   pgx.ReadCommitted,
		AccessMode: pgx.ReadWrite,
	})
	if err != nil {
		return wrapError("Failed to begin transaction", err)
	}
	defer rollbackTx(ctx, tx)

	for _, id := range streamIds {
		err = copyStream(ctx, sourceConn, tx, id, force)
		if err != nil {
			return wrapError("Failed to copy stream "+id, err)
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return wrapError("Failed to commit transaction", err)
	}

	for _, s := range streamIds {
		fmt.Println("Copied stream", s)
	}

	return nil
}

func copyData(ctx context.Context, source *pgxpool.Pool, target *pgxpool.Pool, force bool) error {
	sourceStreamIds, err := getStreamIds(ctx, source)
	if err != nil {
		return wrapError("Failed to get stream ids from source", err)
	}

	existingStreamIds, err := getStreamIds(ctx, target)
	if err != nil {
		return wrapError("Failed to get stream ids from target", err)
	}

	existingStreamIdsMap := map[string]bool{}
	for _, id := range existingStreamIds {
		existingStreamIdsMap[id] = true
	}

	newStreamIds := []string{}
	if !force {
		for _, id := range sourceStreamIds {
			if !existingStreamIdsMap[id] {
				newStreamIds = append(newStreamIds, id)
			}
		}
	} else {
		newStreamIds = sourceStreamIds
	}

	fmt.Println("Streams to copy:", len(newStreamIds))

	numWorkers := viper.GetInt("RIVER_DB_NUM_WORKERS")
	txSize := viper.GetInt("RIVER_DB_TX_SIZE")
	if txSize <= 0 {
		txSize = 1
	}

	workerPool := workerpool.New(numWorkers)

	workItems := chunk(newStreamIds, txSize)

	for _, workItem := range workItems {
		workerPool.Submit(func() {
			err := copyStreams(ctx, source, target, workItem, force)
			if err != nil {
				fmt.Println("ERROR:", err)
				os.Exit(1)
			}
		})
	}

	workerPool.StopWait()

	return nil
}

var (
	copyCmdForce bool
	copyCmd      = &cobra.Command{
		Use:   "copy",
		Short: "Copy data from source to target database",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := cmd.Context()
			sourcePool, sourceInfo, err := getSourceDbPool(ctx, true)
			if err != nil {
				return err
			}
			err = testDbConnection(ctx, sourcePool, sourceInfo)
			if err != nil {
				return err
			}

			targetPool, targetInfo, err := getTargetDbPool(ctx, true)
			if err != nil {
				return err
			}
			err = testDbConnection(ctx, targetPool, targetInfo)
			if err != nil {
				return err
			}

			err = createPartitions(ctx, sourcePool, targetPool)
			if err != nil {
				return err
			}

			return copyData(ctx, sourcePool, targetPool, copyCmdForce)
		},
	}
)

func init() {
	rootCmd.AddCommand(copyCmd)
	copyCmd.Flags().BoolVar(&copyCmdForce, "force", false, "Force copy even if target already has data")
}

func main() {
	viper.AutomaticEnv()
	viper.SetConfigName("river_migrate_db")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	err := viper.ReadInConfig()
	if err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			fmt.Println("WARN: Config not loaded:", err)
		} else {
			fmt.Println("ERROR: Config not loaded:", err)
			os.Exit(1)
		}
	}

	err = rootCmd.ExecuteContext(context.Background())
	if err != nil {
		os.Exit(1)
	}
}

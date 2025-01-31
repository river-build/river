package storage

import (
	"context"
	"embed"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/ethereum/go-ethereum/common"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/protocol"
)

type (
	PostgresBotRegistryStore struct {
		PostgresEventStore

		exitSignal chan error
	}

	BotInfo struct {
		Bot     common.Address
		Owner   common.Address
		Webhook string
	}

	BotRegistryStore interface {
		CreateBot(
			ctx context.Context,
			owner common.Address,
			bot common.Address,
			webhook string,
		) error
		GetBotInfo(
			ctx context.Context,
			bot common.Address,
		) (*BotInfo, error)
	}
)

// WrappedAddress automatically serializes and deserializes addresses into and out of
// pg.
type WrappedAddress struct {
	address common.Address
}

func (wa WrappedAddress) TextValue() (pgtype.Text, error) {
	return pgtype.Text{
		String: hex.EncodeToString(wa.address[:]),
		Valid:  true,
	}, nil
}

func (wa *WrappedAddress) ScanText(v pgtype.Text) error {
	if !v.Valid {
		*wa = WrappedAddress{}
		return nil
	}
	*wa = WrappedAddress{common.HexToAddress(v.String)}
	return nil
}

var _ BotRegistryStore = (*PostgresBotRegistryStore)(nil)

//go:embed bot_registry_migrations/*.sql
var botRegistryDir embed.FS

func DbSchemaNameForBotRegistryService(riverChainId uint64) string {
	return fmt.Sprintf("b_%d", riverChainId)
}

// NewPostgresBotRegistryStore instantiates a new PostgreSQL persistent storage for the bot registry service.
func NewPostgresBotRegistryStore(
	ctx context.Context,
	poolInfo *PgxPoolInfo,
	exitSignal chan error,
	metrics infra.MetricsFactory,
) (*PostgresBotRegistryStore, error) {
	store := &PostgresBotRegistryStore{
		exitSignal: exitSignal,
	}

	if err := store.PostgresEventStore.init(
		ctx,
		poolInfo,
		metrics,
		nil,
		&botRegistryDir,
		"bot_registry_migrations",
	); err != nil {
		return nil, AsRiverError(err).Func("NewPostgresBotRegistryStore")
	}

	if err := store.initStorage(ctx); err != nil {
		return nil, AsRiverError(err).Func("NewPostgresBotRegistryStore")
	}

	return store, nil
}

func (s *PostgresBotRegistryStore) CreateBot(
	ctx context.Context,
	owner common.Address,
	bot common.Address,
	webhook string,
) error {
	return s.txRunner(
		ctx,
		"CreateBot",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.createBot(ctx, owner, bot, webhook, tx)
		},
		nil,
		"bot_address", bot,
		"owner_address", owner,
		"webhook", webhook,
	)
}

func (s *PostgresBotRegistryStore) createBot(
	ctx context.Context,
	owner common.Address,
	bot common.Address,
	webhook string,
	txn pgx.Tx,
) error {
	if _, err := txn.Exec(
		ctx,
		"insert into bot_registry (bot_id, bot_owner_id, webhook) values ($1, $2, $3);",
		WrappedAddress{bot},
		WrappedAddress{owner},
		webhook,
	); err != nil {
		if isPgError(err, pgerrcode.UniqueViolation) {
			return WrapRiverError(protocol.Err_ALREADY_EXISTS, err).Message("Bot already exists")
		} else {
			return WrapRiverError(protocol.Err_DB_OPERATION_FAILURE, err).Message("Unable to create bot record")
		}
	}
	return nil
}

func (s *PostgresBotRegistryStore) GetBotInfo(
	ctx context.Context,
	bot common.Address,
) (
	botInfo *BotInfo,
	err error,
) {
	err = s.txRunner(
		ctx,
		"GetBotInfo",
		pgx.ReadOnly,
		func(ctx context.Context, tx pgx.Tx) error {
			var err error
			botInfo, err = s.getBotInfo(ctx, tx, bot)
			return err
		},
		nil,
		"bot_address", bot,
	)
	if err != nil {
		return nil, err
	}
	return botInfo, nil
}

func (s *PostgresBotRegistryStore) getBotInfo(
	ctx context.Context,
	tx pgx.Tx,
	botAddr common.Address,
) (
	*BotInfo,
	error,
) {
	var owner, bot WrappedAddress
	bot.address = botAddr
	var botInfo BotInfo
	if err := tx.QueryRow(ctx, "select bot_id, bot_owner_id, webhook from bot_registry where bot_id = $1", bot).
		Scan(&bot, &owner, &botInfo.Webhook); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, RiverError(protocol.Err_NOT_FOUND, "Bot does not exist")
		} else {
			return nil, WrapRiverError(protocol.Err_DB_OPERATION_FAILURE, err).
				Message("failed to find bot in registry")
		}
	} else {
		botInfo.Bot = common.BytesToAddress(bot.address[:])
		botInfo.Owner = common.BytesToAddress(owner.address[:])
	}
	return &botInfo, nil
}

// Close removes instance record from singlenodekey table, releases the listener
// connection, and closes the postgres connection pool
func (s *PostgresBotRegistryStore) Close(ctx context.Context) {
	s.PostgresEventStore.Close(ctx)
}

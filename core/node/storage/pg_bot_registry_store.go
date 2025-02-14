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

	. "github.com/towns-protocol/towns/core/node/base"
	"github.com/towns-protocol/towns/core/node/infra"
	"github.com/towns-protocol/towns/core/node/protocol"
)

type (
	PostgresBotRegistryStore struct {
		PostgresEventStore

		exitSignal chan error
	}

	BotInfo struct {
		Bot        common.Address
		Owner      common.Address
		WebhookUrl string
	}

	BotRegistryStore interface {
		CreateBot(
			ctx context.Context,
			owner common.Address,
			bot common.Address,
			sharedSecret [32]byte,
		) error

		RegisterWebhook(
			ctx context.Context,
			bot common.Address,
			webhook string,
		) error

		GetBotInfo(
			ctx context.Context,
			bot common.Address,
		) (*BotInfo, error)
	}
)

// PGAddress is a type alias for addresses that automatically serializes and deserializes
// 20-byte addresses into and out of pg fixed-length character sequences.
type PGAddress common.Address

func (pa PGAddress) TextValue() (pgtype.Text, error) {
	return pgtype.Text{
		String: hex.EncodeToString(pa[:]),
		Valid:  true,
	}, nil
}

func (pa *PGAddress) ScanText(v pgtype.Text) error {
	if !v.Valid {
		*pa = PGAddress{}
		return nil
	}
	*pa = (PGAddress(common.HexToAddress(v.String)))
	return nil
}

// PGSecret is a type alias for addresses that automatically serializes and deserializes
// 32-byte shared secrets into and out of pg fixed-length character sequences.
type PGSecret [32]byte

func (pa PGSecret) TextValue() (pgtype.Text, error) {
	return pgtype.Text{
		String: hex.EncodeToString(pa[:]),
		Valid:  true,
	}, nil
}

func (pa *PGSecret) ScanText(v pgtype.Text) error {
	if !v.Valid {
		*pa = PGSecret{}
		return nil
	}
	bytes, err := hex.DecodeString(v.String)
	if err != nil {
		return err
	}
	if len(bytes) != 32 {
		return fmt.Errorf("Expected hex-encoded db string to decode into 32 bytes")
	}
	*pa = (PGSecret(bytes))
	return nil
}

var _ BotRegistryStore = (*PostgresBotRegistryStore)(nil)

//go:embed bot_registry_migrations/*.sql
var botRegistryDir embed.FS

func DbSchemaNameForBotRegistryService(botServiceId string) string {
	return fmt.Sprintf("bot_%s", hex.EncodeToString([]byte(botServiceId)))
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
	encryptedSharedSecret [32]byte,
) error {
	return s.txRunner(
		ctx,
		"CreateBot",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.createBot(ctx, owner, bot, encryptedSharedSecret, tx)
		},
		nil,
		"botAddress", bot,
		"ownerAddress", owner,
	)
}

func (s *PostgresBotRegistryStore) createBot(
	ctx context.Context,
	owner common.Address,
	bot common.Address,
	encryptedSharedSecret [32]byte,
	txn pgx.Tx,
) error {
	if _, err := txn.Exec(
		ctx,
		"insert into bot_registry (bot_id, bot_owner_id, encrypted_shared_secret) values ($1, $2, $3);",
		PGAddress(bot),
		PGAddress(owner),
		PGSecret(encryptedSharedSecret),
	); err != nil {
		if isPgError(err, pgerrcode.UniqueViolation) {
			return WrapRiverError(protocol.Err_ALREADY_EXISTS, err).Message("Bot already exists")
		} else {
			return WrapRiverError(protocol.Err_DB_OPERATION_FAILURE, err).Message("Unable to create bot record")
		}
	}
	return nil
}

func (s *PostgresBotRegistryStore) RegisterWebhook(
	ctx context.Context,
	bot common.Address,
	webhook string,
) error {
	return s.txRunner(
		ctx,
		"RegisterWebhook",
		pgx.ReadWrite,
		func(ctx context.Context, tx pgx.Tx) error {
			return s.registerWebhook(ctx, bot, webhook, tx)
		},
		nil,
		"botAddress", bot,
		"webhook", webhook,
	)
}

func (s *PostgresBotRegistryStore) registerWebhook(
	ctx context.Context,
	bot common.Address,
	webhook string,
	txn pgx.Tx,
) error {
	tag, err := txn.Exec(
		ctx,
		`UPDATE bot_registry SET webhook = $2 WHERE bot_id = $1`,
		PGAddress(bot),
		webhook,
	)
	if err != nil {
		return AsRiverError(err, protocol.Err_DB_OPERATION_FAILURE).Message("error updating bot webhook")
	}

	if tag.RowsAffected() < 1 {
		return RiverError(protocol.Err_NOT_FOUND, "bot was not found in registry")
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
		"botAddress", bot,
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
	var owner, bot PGAddress
	bot = PGAddress(botAddr)
	var botInfo BotInfo
	if err := tx.QueryRow(ctx, "select bot_id, bot_owner_id, COALESCE(webhook, '') from bot_registry where bot_id = $1", bot).
		Scan(&bot, &owner, &botInfo.WebhookUrl); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, RiverError(protocol.Err_NOT_FOUND, "bot does not exist")
		} else {
			return nil, WrapRiverError(protocol.Err_DB_OPERATION_FAILURE, err).
				Message("failed to find bot in registry")
		}
	} else {
		botInfo.Bot = common.BytesToAddress(bot[:])
		botInfo.Owner = common.BytesToAddress(owner[:])
	}
	return &botInfo, nil
}

// Close removes instance record from singlenodekey table, releases the listener
// connection, and closes the postgres connection pool
func (s *PostgresBotRegistryStore) Close(ctx context.Context) {
	s.PostgresEventStore.Close(ctx)
}

package storage

import (
	"context"
	"embed"
	"fmt"

	"github.com/ethereum/go-ethereum/common"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/infra"
)

type (
	PostgresBotRegistryStore struct {
		PostgresEventStore

		exitSignal chan error
	}

	BotRegistryStore interface {
		CreateBot(
			owner common.Address,
			bot common.Address,
			webhook string,
		) error
	}
)

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
	owner common.Address,
	bot common.Address,
	webhook string,
) error {
	return nil
}

// Close removes instance record from singlenodekey table, releases the listener
// connection, and closes the postgres connection pool
func (s *PostgresBotRegistryStore) Close(ctx context.Context) {
	s.PostgresEventStore.Close(ctx)
}

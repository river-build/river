package storage

import (
	"context"

	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/testutils/dbtestutils"
)

type TestNotificationStore struct {
	Storage     *PostgresNotificationStore
	ExitChannel chan error
	Close       func()
}

func NewTestNotificationStore(ctx context.Context) *TestNotificationStore {
	dbCfg, schema, schemaDeleter, err := dbtestutils.ConfigureDB(ctx)
	if err != nil {
		panic(err)
	}

	pool, err := CreateAndValidatePgxPool(ctx, dbCfg, schema, nil)
	if err != nil {
		panic(err)
	}

	exitChan := make(chan error, 1)
	streamStorage, err := NewPostgresNotificationStore(
		ctx,
		pool,
		exitChan,
		infra.NewMetricsFactory(nil, "", ""),
	)
	if err != nil {
		panic(err)
	}

	return &TestNotificationStore{
		Storage:     streamStorage,
		ExitChannel: exitChan,
		Close: func() {
			streamStorage.Close(ctx)
			schemaDeleter()
		},
	}
}

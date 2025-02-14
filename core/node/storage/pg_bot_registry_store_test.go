package storage

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/require"

	"github.com/towns-protocol/towns/core/config"
	"github.com/towns-protocol/towns/core/node/base"
	"github.com/towns-protocol/towns/core/node/base/test"
	"github.com/towns-protocol/towns/core/node/infra"
	"github.com/towns-protocol/towns/core/node/protocol"
	"github.com/towns-protocol/towns/core/node/testutils/dbtestutils"
)

var (
	testSecretHexString  = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
	testSecretHexString2 = "202122232425262728292a2b2c2d2e2f101112131415161718191a1b1c1d1e1f"
)

type testBotRegistryStoreParams struct {
	ctx                context.Context
	pgBotRegistryStore *PostgresBotRegistryStore
	schema             string
	config             *config.DatabaseConfig
	closer             func()
	// For retaining schema and manually closing the store, use
	// the following two cleanup functions to manually delete the
	// schema and cancel the test context.
	schemaDeleter func()
	ctxCloser     func()
	exitSignal    chan error
}

func setupBotRegistryStorageTest(t *testing.T) *testBotRegistryStoreParams {
	require := require.New(t)
	ctx, ctxCloser := test.NewTestContext()

	dbCfg, dbSchemaName, dbCloser, err := dbtestutils.ConfigureDbWithPrefix(ctx, "b_")
	require.NoError(err, "Error configuring db for test")

	dbCfg.StartupDelay = 2 * time.Millisecond
	dbCfg.Extra = strings.Replace(dbCfg.Extra, "pool_max_conns=1000", "pool_max_conns=10", 1)

	pool, err := CreateAndValidatePgxPool(
		ctx,
		dbCfg,
		dbSchemaName,
		nil,
	)
	require.NoError(err, "Error creating pgx pool for test")

	exitSignal := make(chan error, 1)
	store, err := NewPostgresBotRegistryStore(
		ctx,
		pool,
		exitSignal,
		infra.NewMetricsFactory(nil, "", ""),
	)
	require.NoError(err, "Error creating new postgres stream store")

	params := &testBotRegistryStoreParams{
		ctx:                ctx,
		pgBotRegistryStore: store,
		schema:             dbSchemaName,
		config:             dbCfg,
		exitSignal:         exitSignal,
		closer: sync.OnceFunc(func() {
			store.Close(ctx)
			// dbCloser()
			ctxCloser()
		}),
		schemaDeleter: dbCloser,
		ctxCloser:     ctxCloser,
	}

	return params
}

func TestBotRegistryStorage_RegisterWebhook(t *testing.T) {
	params := setupBotRegistryStorageTest(t)
	t.Cleanup(params.closer)

	require := require.New(t)
	store := params.pgBotRegistryStore

	var owner, bot, unregisteredBot common.Address
	_, err := rand.Read(owner[:])
	require.NoError(err)
	_, err = rand.Read(bot[:])
	require.NoError(err)

	_, err = rand.Read(unregisteredBot[:])
	require.NoError(err)

	secretBytes, err := hex.DecodeString(testSecretHexString)
	require.NoError(err)
	secret := [32]byte(secretBytes)

	err = store.CreateBot(params.ctx, owner, bot, secret)
	require.NoError(err)

	info, err := store.GetBotInfo(params.ctx, bot)
	require.NoError(err)
	require.Equal(bot, info.Bot)
	require.Equal(owner, info.Owner)
	require.Equal("", info.WebhookUrl)

	webhook := "https://webhook.com/callme"
	webhook2 := "http://api.org/textme"
	err = store.RegisterWebhook(params.ctx, bot, webhook)
	require.NoError(err)

	info, err = store.GetBotInfo(params.ctx, bot)
	require.NoError(err)
	require.Equal(bot, info.Bot)
	require.Equal(owner, info.Owner)
	require.Equal(webhook, info.WebhookUrl)

	err = store.RegisterWebhook(params.ctx, bot, webhook2)
	require.NoError(err)

	info, err = store.GetBotInfo(params.ctx, bot)
	require.NoError(err)
	require.Equal(bot, info.Bot)
	require.Equal(owner, info.Owner)
	require.Equal(webhook2, info.WebhookUrl)

	err = store.RegisterWebhook(params.ctx, unregisteredBot, webhook)
	require.ErrorContains(err, "bot was not found in registry")
}

func TestBotRegistryStorage(t *testing.T) {
	params := setupBotRegistryStorageTest(t)
	t.Cleanup(params.closer)

	require := require.New(t)
	store := params.pgBotRegistryStore

	// Generate random addresses
	var owner, owner2, bot, bot2, bot3 common.Address
	_, err := rand.Read(owner[:])
	require.NoError(err)
	_, err = rand.Read(owner2[:])
	require.NoError(err)
	_, err = rand.Read(bot[:])
	require.NoError(err)
	_, err = rand.Read(bot2[:])
	require.NoError(err)
	_, err = rand.Read(bot3[:])
	require.NoError(err)

	secretBytes, err := hex.DecodeString(testSecretHexString)
	require.NoError(err)
	secret := [32]byte(secretBytes)

	secretBytes2, err := hex.DecodeString(testSecretHexString2)
	require.NoError(err)
	secret2 := [32]byte(secretBytes2)

	err = store.CreateBot(params.ctx, owner, bot, secret)
	require.NoError(err)

	err = store.CreateBot(params.ctx, owner2, bot, secret)
	require.ErrorContains(err, "Bot already exists")
	require.True(base.IsRiverErrorCode(err, protocol.Err_ALREADY_EXISTS))

	// Fine to have multiple bots per owner
	err = store.CreateBot(params.ctx, owner, bot2, secret2)
	require.NoError(err)

	info, err := store.GetBotInfo(params.ctx, bot)
	require.NoError(err)
	require.Equal(bot, info.Bot)
	require.Equal(owner, info.Owner)
	require.Equal("", info.WebhookUrl)

	info, err = store.GetBotInfo(params.ctx, bot2)
	require.NoError(err)
	require.Equal(bot2, info.Bot)
	require.Equal(owner, info.Owner)
	require.Equal("", info.WebhookUrl)

	info, err = store.GetBotInfo(params.ctx, bot3)
	require.Nil(info)
	require.ErrorContains(err, "bot does not exist")
	require.True(base.IsRiverErrorCode(err, protocol.Err_NOT_FOUND))
}

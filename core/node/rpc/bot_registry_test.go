package rpc

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"testing"

	"connectrpc.com/connect"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/node/authentication"
	"github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/logging"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	"github.com/river-build/river/core/node/storage"
	"github.com/river-build/river/core/node/testutils/dbtestutils"
	"github.com/river-build/river/core/node/testutils/testcert"
)

func authenticateBS[T any](
	ctx context.Context,
	req *require.Assertions,
	authClient protocolconnect.AuthenticationServiceClient,
	primaryWallet *crypto.Wallet,
	request *connect.Request[T],
) {
	authentication.Authenticate(
		ctx,
		"BS_AUTH:",
		req,
		authClient,
		primaryWallet,
		request,
	)
}

func initBotRegistryService(
	ctx context.Context,
	tester *serviceTester,
) (botRegistry *Service) {
	bc := tester.btc.NewWalletAndBlockchain(tester.ctx)
	listener, _ := makeTestListener(tester.t)

	var key [32]byte
	_, err := rand.Read(key[:])
	tester.require.NoError(err)

	config := tester.getConfig()
	config.BotRegistry.BotRegistryId = base.GenShortNanoid()

	config.BotRegistry.Authentication.SessionToken.Key.Algorithm = "HS256"
	config.BotRegistry.Authentication.SessionToken.Key.Key = hex.EncodeToString(key[:])

	ctx = logging.CtxWithLog(ctx, logging.FromCtx(ctx).With("service", "bot-registry"))
	botRegistry, err = StartServerInBotRegistryMode(
		ctx,
		config,
		&ServerStartOpts{
			RiverChain:      bc,
			Listener:        listener,
			HttpClientMaker: testcert.GetHttp2LocalhostTLSClient,
		},
	)
	tester.require.NoError(err)

	// Clean up schema
	tester.cleanup(func() {
		err := dbtestutils.DeleteTestSchema(
			context.Background(),
			tester.dbUrl,
			storage.DbSchemaNameForBotRegistryService(config.BotRegistry.BotRegistryId),
		)
		tester.require.NoError(err)
	})
	tester.cleanup(botRegistry.Close)

	return botRegistry
}

// invalidAddressBytes is a slice of bytes that cannot be parsed into an address, because
// it is too long. Valid addresses are 20 bytes.
var invalidAddressBytes = bytes.Repeat([]byte("a"), 21)

func safeNewWallet(ctx context.Context, require *require.Assertions) *crypto.Wallet {
	wallet, err := crypto.NewWallet(ctx)
	require.NoError(err)
	return wallet
}

func TestBotRegistry_RegisterWebhookAuthentication(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	service := initBotRegistryService(tester.ctx, tester)

	var unregisteredBot common.Address
	_, err := rand.Read(unregisteredBot[:])
	tester.require.NoError(err)

	botWallet := safeNewWallet(tester.ctx, tester.require)
	ownerWallet := safeNewWallet(tester.ctx, tester.require)
	// bot2Wallet := safeNewWallet(tester.ctx, tester.require)
	// owner2Wallet := safeNewWallet(tester.ctx, tester.require)
	// bot3Wallet := safeNewWallet(tester.ctx, tester.require)
	// owner3Wallet := safeNewWallet(tester.ctx, tester.require)
	// unrelatedWallet := safeNewWallet(tester.ctx, tester.require)

	httpClient, _ := testcert.GetHttp2LocalhostTLSClient(tester.ctx, tester.getConfig())

	serviceAddr := "https://" + service.listener.Addr().String()
	t.Log(serviceAddr)
	authClient := protocolconnect.NewAuthenticationServiceClient(
		httpClient, serviceAddr,
	)

	// Unauthenticated request should fail
	resp, err := service.BotRegistryService.RegisterWebhook(
		tester.ctx,
		&connect.Request[protocol.RegisterWebhookRequest]{
			Msg: &protocol.RegisterWebhookRequest{
				BotId:      botWallet.Address[:],
				BotOwnerId: ownerWallet.Address[:],
				WebhookUrl: "localhost:1234/abc",
			},
		},
	)

	tester.require.ErrorContains(
		err,
		"Requests to RegisterWebhook must be authenticated by either the bot or bot owner wallets",
	)
	tester.require.True(base.IsRiverErrorCode(err, protocol.Err_UNAUTHENTICATED))
	tester.require.Nil(resp)

	authenticateBS(tester.ctx, tester.require, authClient, botWallet, &connect.Request[protocol.RegisterWebhookRequest]{
		Msg: &protocol.RegisterWebhookRequest{
			BotId:      botWallet.Address[:],
			BotOwnerId: ownerWallet.Address[:],
			WebhookUrl: "localhost:1234/abc",
		},
	})
}

func TestBotRegistry(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	service := initBotRegistryService(tester.ctx, tester)

	var unregisteredBot common.Address
	_, err := rand.Read(unregisteredBot[:])
	tester.require.NoError(err)

	botWallet, err := crypto.NewWallet(tester.ctx)
	tester.require.NoError(err)
	ownerWallet, err := crypto.NewWallet(tester.ctx)
	tester.require.NoError(err)

	resp, err := service.BotRegistryService.RegisterWebhook(
		tester.ctx,
		&connect.Request[protocol.RegisterWebhookRequest]{
			Msg: &protocol.RegisterWebhookRequest{
				BotId:      botWallet.Address[:],
				BotOwnerId: ownerWallet.Address[:],
				WebhookUrl: "localhost:1234/abc",
			},
		},
	)

	tester.require.NoError(err)
	tester.require.NotNil(resp)

	resp, err = service.BotRegistryService.RegisterWebhook(
		tester.ctx,
		&connect.Request[protocol.RegisterWebhookRequest]{
			Msg: &protocol.RegisterWebhookRequest{
				BotId:      invalidAddressBytes[:],
				BotOwnerId: ownerWallet.Address[:],
				WebhookUrl: "localhost:1234/abc",
			},
		},
	)
	tester.require.Nil(resp)
	tester.require.ErrorContains(err, "Invalid bot id")
	tester.require.True(base.IsRiverErrorCode(err, protocol.Err_BAD_ADDRESS))

	status, err := service.BotRegistryService.GetStatus(
		tester.ctx,
		&connect.Request[protocol.GetStatusRequest]{
			Msg: &protocol.GetStatusRequest{
				BotId: botWallet.Address[:],
			},
		},
	)
	tester.require.NoError(err)
	tester.require.NotNil(status)
	tester.require.True(status.Msg.IsRegistered)

	status, err = service.BotRegistryService.GetStatus(
		tester.ctx,
		&connect.Request[protocol.GetStatusRequest]{
			Msg: &protocol.GetStatusRequest{
				BotId: unregisteredBot[:],
			},
		},
	)
	tester.require.NoError(err)
	tester.require.NotNil(status)
	tester.require.False(status.Msg.IsRegistered)
}

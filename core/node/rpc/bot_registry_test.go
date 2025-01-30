package rpc

import (
	"context"
	"testing"

	"connectrpc.com/connect"

	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/testutils/testcert"
)

func initBotRegistryService(
	ctx context.Context,
	tester *serviceTester,
) (botRegistry *Service, url string) {
	bc := tester.btc.NewWalletAndBlockchain(tester.ctx)
	listener, url := makeTestListener(tester.t)
	botRegistry, err := StartServerInBotRegistryMode(
		ctx,
		tester.getConfig(),
		&ServerStartOpts{
			RiverChain:      bc,
			Listener:        listener,
			HttpClientMaker: testcert.GetHttp2LocalhostTLSClient,
		},
	)
	tester.require.NoError(err)
	tester.cleanup(botRegistry.Close)

	return botRegistry, url
}

func TestBotRegistry(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	service, _ := initBotRegistryService(tester.ctx, tester)

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
}

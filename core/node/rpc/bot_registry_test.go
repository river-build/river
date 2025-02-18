package rpc

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"sync"
	"testing"
	"time"

	mapset "github.com/deckarep/golang-set/v2"

	"connectrpc.com/connect"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/towns-protocol/towns/core/node/authentication"
	"github.com/towns-protocol/towns/core/node/base"
	"github.com/towns-protocol/towns/core/node/bot_registry"
	"github.com/towns-protocol/towns/core/node/crypto"
	"github.com/towns-protocol/towns/core/node/events"
	"github.com/towns-protocol/towns/core/node/logging"
	"github.com/towns-protocol/towns/core/node/protocol"
	"github.com/towns-protocol/towns/core/node/protocol/protocolconnect"
	. "github.com/towns-protocol/towns/core/node/shared"
	"github.com/towns-protocol/towns/core/node/storage"
	"github.com/towns-protocol/towns/core/node/testutils"
	"github.com/towns-protocol/towns/core/node/testutils/dbtestutils"
	"github.com/towns-protocol/towns/core/node/testutils/testcert"
	"github.com/towns-protocol/towns/core/node/track_streams"
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

type messageEventRecord struct {
	streamId       StreamId
	parentStreamId *StreamId
	bots           mapset.Set[string]
	event          *events.ParsedEvent
}

type MockStreamEventListener struct {
	mu                  sync.Mutex
	messageEventRecords []messageEventRecord
}

func (m *MockStreamEventListener) OnMessageEvent(
	ctx context.Context,
	streamId StreamId,
	parentStreamId *StreamId, // nil for dms and gdms
	bots mapset.Set[string],
	event *events.ParsedEvent,
) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.messageEventRecords = append(m.messageEventRecords, messageEventRecord{
		streamId,
		parentStreamId,
		bots,
		event,
	})
}

func (m *MockStreamEventListener) MessageEventRecords() []messageEventRecord {
	m.mu.Lock()
	defer m.mu.Unlock()

	return m.messageEventRecords
}

var _ track_streams.StreamEventListener = (*MockStreamEventListener)(nil)

func initBotRegistryService(
	ctx context.Context,
	tester *serviceTester,
) (botRegistry *Service, streamEventListener *MockStreamEventListener) {
	bc := tester.btc.NewWalletAndBlockchain(tester.ctx)
	listener, _ := makeTestListener(tester.t)

	config := tester.getConfig()
	config.BotRegistry.BotRegistryId = base.GenShortNanoid()

	var key [32]byte
	_, err := rand.Read(key[:])
	tester.require.NoError(err)
	config.BotRegistry.SharedSecretDataEncryptionKey = hex.EncodeToString(key[:])

	_, err = rand.Read(key[:])
	tester.require.NoError(err)
	config.BotRegistry.Authentication.SessionToken.Key.Algorithm = "HS256"
	config.BotRegistry.Authentication.SessionToken.Key.Key = hex.EncodeToString(key[:])

	// Allow loopback webhooks for local testing
	config.BotRegistry.AllowLoopbackWebhooks = true

	ctx = logging.CtxWithLog(ctx, logging.FromCtx(ctx).With("service", "bot-registry"))
	streamEventListener = &MockStreamEventListener{}
	botRegistry, err = StartServerInBotRegistryMode(
		ctx,
		config,
		&ServerStartOpts{
			RiverChain:          bc,
			Listener:            listener,
			HttpClientMaker:     testcert.GetHttp2LocalhostTLSClient,
			StreamEventListener: streamEventListener,
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

	return botRegistry, streamEventListener
}

func TestBotRegistry_ForwardsChannelEvents(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	_, listener := initBotRegistryService(tester.ctx, tester)

	wallet := safeNewWallet(tester.ctx, tester.require)

	require := tester.require
	client := tester.testClient(0)

	resuser, _, err := createUser(tester.ctx, wallet, client, nil)
	require.NoError(err)
	require.NotNil(resuser)

	_, _, err = createUserMetadataStream(tester.ctx, wallet, client, nil)
	require.NoError(err)

	spaceId := testutils.FakeStreamId(STREAM_SPACE_BIN)
	space, _, err := createSpace(tester.ctx, wallet, client, spaceId, nil)
	require.NoError(err)
	require.NotNil(space)

	channelId := StreamId{STREAM_CHANNEL_BIN}
	copy(channelId[1:21], spaceId[1:21])
	_, err = rand.Read(channelId[21:])
	require.NoError(err)

	channel, _, err := createChannel(tester.ctx, wallet, client, spaceId, channelId, nil)
	require.NoError(err)
	require.NotNil(channel)

	testMessageText := "abc"
	event, err := events.MakeEnvelopeWithPayloadAndTags(
		wallet,
		events.Make_ChannelPayload_Message(testMessageText),
		&MiniblockRef{
			Num:  channel.GetMinipoolGen() - 1,
			Hash: common.Hash(channel.GetPrevMiniblockHash()),
		},
		nil,
	)
	tester.require.NoError(err)

	_, err = client.AddEvent(tester.ctx, connect.NewRequest(&protocol.AddEventRequest{
		StreamId: channelId[:],
		Event:    event,
		Optional: false,
	}))
	tester.require.NoError(err)

	tester.require.EventuallyWithT(func(c *assert.CollectT) {
		records := listener.MessageEventRecords()
		assert.GreaterOrEqual(c, len(records), 1, "No messages were forwarded")
		found := false
		for _, record := range records {
			assert.Equal(c, channelId, record.streamId, "Forwarded message from wrong stream")
			assert.Equal(
				c,
				spaceId,
				*record.parentStreamId,
				"SpaceId incorrectly populated for forwarded message %v",
				record,
			)

			channelPayload := record.event.GetChannelMessage()
			if channelPayload != nil && channelPayload.Message.Ciphertext == testMessageText {
				found = true
			}
		}
		assert.True(c, found, "Message not found %v", records)
	}, 10*time.Second, 100*time.Millisecond, "Bot registry service did not forward channel event")
}

// invalidAddressBytes is a slice of bytes that cannot be parsed into an address, because
// it is too long. Valid addresses are 20 bytes.
var invalidAddressBytes = bytes.Repeat([]byte("a"), 21)

func safeNewWallet(ctx context.Context, require *require.Assertions) *crypto.Wallet {
	wallet, err := crypto.NewWallet(ctx)
	require.NoError(err)
	return wallet
}

func TestBotRegistry_RegisterWebhook(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	service, _ := initBotRegistryService(tester.ctx, tester)

	httpClient, _ := testcert.GetHttp2LocalhostTLSClient(tester.ctx, tester.getConfig())
	serviceAddr := "https://" + service.listener.Addr().String()
	authClient := protocolconnect.NewAuthenticationServiceClient(
		httpClient, serviceAddr,
	)
	botRegistryClient := protocolconnect.NewBotRegistryServiceClient(
		httpClient, serviceAddr,
	)

	// unregisteredBotWallet := safeNewWallet(tester.ctx, tester.require)
	botWallet := safeNewWallet(tester.ctx, tester.require)
	ownerWallet := safeNewWallet(tester.ctx, tester.require)

	req := &connect.Request[protocol.RegisterRequest]{
		Msg: &protocol.RegisterRequest{
			BotId:      botWallet.Address[:],
			BotOwnerId: ownerWallet.Address[:],
		},
	}
	authenticateBS(tester.ctx, tester.require, authClient, ownerWallet, req)
	resp, err := botRegistryClient.Register(
		tester.ctx,
		req,
	)

	tester.require.NotNil(resp)
	tester.require.Len(resp.Msg.Hs256SharedSecret, 32, "Shared secret length should be 32 bytes")
	tester.require.NoError(err)

	botServer := bot_registry.NewTestBotServer(t, botWallet, resp.Msg.GetHs256SharedSecret())
	defer botServer.Close()

	go func() {
		if err := botServer.Serve(tester.ctx); err != nil {
			t.Errorf("Error starting bot service: %v", err)
		}
	}()

	tests := map[string]struct {
		botId                []byte
		authenticatingWallet *crypto.Wallet
		webhookUrl           string
		expectedErr          string
	}{
		"Success (bot wallet signer)": {
			botId:                botWallet.Address[:],
			authenticatingWallet: botWallet,
			webhookUrl:           botServer.Url(),
		},
		// "Success (owner wallet signer)": {
		// 	botId:                botWallet.Address[:],
		// 	authenticatingWallet: ownerWallet,
		// 	webhookUrl:           botServer.Url(),
		// },
		// "Unregistered bot": {
		// 	botId:                unregisteredBotWallet.Address[:],
		// 	authenticatingWallet: unregisteredBotWallet,
		// 	webhookUrl:           "http://www.test.com/callme",
		// 	expectedErr:          "bot does not exist",
		// },
		// "Missing authentication": {
		// 	botId:       botWallet.Address[:],
		// 	webhookUrl:  "http://www.test.com/callme",
		// 	expectedErr: "missing session token",
		// },
		// "Unauthorized user": {
		// 	botId:                botWallet.Address[:],
		// 	authenticatingWallet: unregisteredBotWallet,
		// 	webhookUrl:           "http://www.test.com/callme",
		// 	expectedErr:          "authenticated user must be either bot or owner",
		// },
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			req := &connect.Request[protocol.RegisterWebhookRequest]{
				Msg: &protocol.RegisterWebhookRequest{
					BotId:      tc.botId,
					WebhookUrl: tc.webhookUrl,
				},
			}

			// Unauthenticated request should fail
			if tc.authenticatingWallet != nil {
				authenticateBS(tester.ctx, tester.require, authClient, tc.authenticatingWallet, req)
			}

			resp, err := botRegistryClient.RegisterWebhook(
				tester.ctx,
				req,
			)
			if tc.expectedErr == "" {
				tester.require.NoError(err)
				tester.require.NotNil(resp)
			} else {
				tester.require.Nil(resp)
				tester.require.ErrorContains(err, tc.expectedErr)
			}
		})
	}
}

func TestBotRegistry_Status(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	service, _ := initBotRegistryService(tester.ctx, tester)

	httpClient, _ := testcert.GetHttp2LocalhostTLSClient(tester.ctx, tester.getConfig())
	serviceAddr := "https://" + service.listener.Addr().String()
	authClient := protocolconnect.NewAuthenticationServiceClient(
		httpClient, serviceAddr,
	)
	botRegistryClient := protocolconnect.NewBotRegistryServiceClient(
		httpClient, serviceAddr,
	)

	var unregisteredBot common.Address
	_, err := rand.Read(unregisteredBot[:])
	tester.require.NoError(err)

	botWallet, err := crypto.NewWallet(tester.ctx)
	tester.require.NoError(err)

	ownerWallet, err := crypto.NewWallet(tester.ctx)
	tester.require.NoError(err)

	req := &connect.Request[protocol.RegisterRequest]{
		Msg: &protocol.RegisterRequest{
			BotId:      botWallet.Address[:],
			BotOwnerId: ownerWallet.Address[:],
		},
	}
	authenticateBS(tester.ctx, tester.require, authClient, ownerWallet, req)
	resp, err := botRegistryClient.Register(
		tester.ctx,
		req,
	)

	tester.require.NotNil(resp)
	tester.require.NoError(err)
	statusTests := map[string]struct {
		botId                []byte
		expectedIsRegistered bool
	}{
		"Registered bot": {
			botId:                botWallet.Address[:],
			expectedIsRegistered: true,
		},
		"Unregistered bot": {
			botId:                unregisteredBot[:],
			expectedIsRegistered: false,
		},
	}

	for name, tc := range statusTests {
		t.Run(name, func(t *testing.T) {
			status, err := botRegistryClient.GetStatus(
				tester.ctx,
				&connect.Request[protocol.GetStatusRequest]{
					Msg: &protocol.GetStatusRequest{
						BotId: tc.botId,
					},
				},
			)
			tester.require.NoError(err)
			tester.require.NotNil(status)
			tester.require.Equal(tc.expectedIsRegistered, status.Msg.IsRegistered)
		})
	}
}

func TestBotRegistry_Register(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	service, _ := initBotRegistryService(tester.ctx, tester)

	httpClient, _ := testcert.GetHttp2LocalhostTLSClient(tester.ctx, tester.getConfig())
	serviceAddr := "https://" + service.listener.Addr().String()
	authClient := protocolconnect.NewAuthenticationServiceClient(
		httpClient, serviceAddr,
	)
	botRegistryClient := protocolconnect.NewBotRegistryServiceClient(
		httpClient, serviceAddr,
	)

	var unregisteredBot common.Address
	_, err := rand.Read(unregisteredBot[:])
	tester.require.NoError(err)

	botWallet := safeNewWallet(tester.ctx, tester.require)
	ownerWallet := safeNewWallet(tester.ctx, tester.require)

	tests := map[string]struct {
		botId                []byte
		ownerId              []byte
		authenticatingWallet *crypto.Wallet
		expectedErr          string
	}{
		"Success": {
			botId:                botWallet.Address[:],
			ownerId:              ownerWallet.Address[:],
			authenticatingWallet: ownerWallet,
		},
		"Invalid bot id": {
			botId:                invalidAddressBytes,
			ownerId:              ownerWallet.Address[:],
			authenticatingWallet: ownerWallet,
			expectedErr:          "invalid bot id",
		},
		"Invalid owner id": {
			botId:                botWallet.Address[:],
			ownerId:              invalidAddressBytes,
			authenticatingWallet: ownerWallet,
			expectedErr:          "invalid owner id",
		},
		"Invalid authorization": {
			botId:                botWallet.Address[:],
			ownerId:              ownerWallet.Address[:],
			authenticatingWallet: botWallet,
			expectedErr:          "authenticated user must be bot owner",
		},
		"Missing authorization": {
			botId:       botWallet.Address[:],
			ownerId:     ownerWallet.Address[:],
			expectedErr: "missing session token",
		},
	}
	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			req := &connect.Request[protocol.RegisterRequest]{
				Msg: &protocol.RegisterRequest{
					BotId:      tc.botId,
					BotOwnerId: tc.ownerId,
				},
			}

			if tc.authenticatingWallet != nil {
				authenticateBS(tester.ctx, tester.require, authClient, tc.authenticatingWallet, req)
			}

			resp, err := botRegistryClient.Register(
				tester.ctx,
				req,
			)

			if tc.expectedErr == "" {
				tester.require.NotNil(resp)
				tester.require.Len(resp.Msg.GetHs256SharedSecret(), 32)
				tester.require.NoError(err)
			} else {
				tester.require.Nil(resp)
				tester.require.ErrorContains(err, tc.expectedErr)
			}
		})
	}
}

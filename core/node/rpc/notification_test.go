package rpc

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net"
	"net/http"
	"sync"
	"testing"
	"time"

	"connectrpc.com/connect"
	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/common"
	"github.com/google/go-cmp/cmp"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/testutils"
	payload2 "github.com/sideshow/apns2/payload"
	"github.com/stretchr/testify/require"
)

// TestNotifications is designed in such a way that all tests are run in parallel
// and share the same set of nodes and notification service.
func TestNotifications(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	ctx, cancel := context.WithCancel(tester.ctx)
	defer cancel()

	t.Run("SpaceChannelNotifications", func(t *testing.T) {
		testSpaceChannelNotifications(t, ctx, tester)
	})

	t.Run("DMNotifications", func(t *testing.T) {
		t.Skip() // TODO
	})

	t.Run("GDMNotifications", func(t *testing.T) {
		t.Skip() // TODO
	})
}

func testSpaceChannelNotifications(
	t *testing.T,
	ctx context.Context,
	tester *serviceTester,
) {
	notificationService, notifications := initNotificationService(ctx, tester)
	notificationClient := protocolconnect.NewNotificationServiceClient(
		http.DefaultClient, "http://"+notificationService.listener.Addr().String())

	t.Run("TestPlainMessage", func(t *testing.T) {
		test := setupSpaceChannelNotificationTest(ctx, tester, notificationClient)
		testGDMPlainMessage(ctx, test, notifications)
	})

	t.Run("TestAtChannelTag", func(t *testing.T) {
		test := setupSpaceChannelNotificationTest(ctx, tester, notificationClient)
		testGDMAtChannelTag(ctx, test, notifications)
	})

	t.Run("TestMentionsTag", func(t *testing.T) {
		test := setupSpaceChannelNotificationTest(ctx, tester, notificationClient)
		testGDMMentionTag(ctx, test, notifications)
	})
}

// testGDMPlainMessage tests GDM message that isn't a reply, reaction nor includes a mention
func testGDMPlainMessage(
	ctx context.Context,
	test *spaceChannelNotificationsTestContext,
	nc *notificationCapture,
) {

}

func testGDMAtChannelTag(
	ctx context.Context,
	test *spaceChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	// subscribe for notifications only on the first couple of wallets on both web and apn
	expectedUsersToReceiveNotification := make(map[common.Address]int)
	for _, wallet := range test.members[:10] {
		test.subscribeWebPush(ctx, wallet.Address)
		test.subscribeApnPush(ctx, wallet.Address)
		expectedUsersToReceiveNotification[wallet.Address] = 1
	}

	// user disables all notifications for this channel
	test.setSpaceChannelSetting(
		ctx, test.members[1].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	delete(expectedUsersToReceiveNotification, test.members[1].Address)

	// user disables all notification on the space level
	test.setSpaceSetting(
		ctx, test.members[2].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	delete(expectedUsersToReceiveNotification, test.members[2].Address)

	// user wants to receive notifications for all messages for this channel
	test.setSpaceChannelSetting(
		ctx, test.members[3].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
	expectedUsersToReceiveNotification[test.members[3].Address] = 1

	// user wants to receive notifications for all messages on the space level
	test.setSpaceSetting(
		ctx, test.members[4].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
	expectedUsersToReceiveNotification[test.members[4].Address] = 1

	// user wants to receive notifications for messages that are either a reply/reaction on his own messages
	// or when he is mentioned on the channel level. Because this is the default the space setting is overwritten
	// to no messages to ensure that the channel setting overwrites the space default.
	test.setSpaceSetting(ctx, test.members[5].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	test.setSpaceChannelSetting(
		ctx, test.members[5].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_ONLY_MENTIONS_REPLIES_REACTIONS)
	expectedUsersToReceiveNotification[test.members[5].Address] = 1

	// send a message and ensure that all expected notification are captured
	sender := test.members[0] // no notification for your own messages
	delete(expectedUsersToReceiveNotification, sender.Address)
	event := test.sendMessageWithTags(
		ctx, test.members[0], "hi!", &Tags{
			GroupMentionTypes: []GroupMentionType{GroupMentionType_GROUP_MENTION_TYPE_AT_CHANNEL},
		})
	eventHash := common.BytesToHash(event.Hash)

	test.req.Eventuallyf(func() bool {
		nc.WebPushNotificationsMu.Lock()
		defer nc.WebPushNotificationsMu.Unlock()

		nc.ApnPushNotificationsMu.Lock()
		defer nc.ApnPushNotificationsMu.Unlock()

		webNotifications := nc.WebPushNotifications[eventHash]
		apnNotifications := nc.ApnPushNotifications[eventHash]

		return cmp.Equal(webNotifications, expectedUsersToReceiveNotification) &&
			cmp.Equal(apnNotifications, expectedUsersToReceiveNotification)
	}, 20*time.Second, 1000*time.Millisecond, "Didn't receive all notifications")

	// Wait a bit to ensure that no more notifications come in
	test.req.Never(func() bool {
		nc.WebPushNotificationsMu.Lock()
		webCount := len(nc.WebPushNotifications[eventHash])
		nc.WebPushNotificationsMu.Unlock()

		nc.ApnPushNotificationsMu.Lock()
		apnCount := len(nc.ApnPushNotifications[eventHash])
		nc.ApnPushNotificationsMu.Unlock()

		return webCount != len(expectedUsersToReceiveNotification) ||
			apnCount != len(expectedUsersToReceiveNotification)
	}, 5*time.Second, 1000*time.Millisecond, "Received too unexpected notifications")
}

func testGDMMentionTag(
	ctx context.Context,
	test *spaceChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	// subscribe for notifications only on the first couple of wallets on both web and apn
	expectedUsersToReceiveNotification := make(map[common.Address]struct{})
	var mentionedUsers [][]byte

	for _, wallet := range test.members[:10] {
		test.subscribeWebPush(ctx, wallet.Address)
		test.subscribeApnPush(ctx, wallet.Address)
		expectedUsersToReceiveNotification[wallet.Address] = struct{}{}
		mentionedUsers = append(mentionedUsers, wallet.Address[:])
	}

	// user disables all notifications for this channel
	test.setSpaceChannelSetting(
		ctx, test.members[1].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	delete(expectedUsersToReceiveNotification, test.members[1].Address)

	// user disables all notification on the space level
	test.setSpaceSetting(
		ctx, test.members[2].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	delete(expectedUsersToReceiveNotification, test.members[2].Address)

	// user wants to receive notifications for all messages for this channel
	test.setSpaceChannelSetting(
		ctx, test.members[3].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
	expectedUsersToReceiveNotification[test.members[3].Address] = struct{}{}

	// user wants to receive notifications for all messages on the space level
	test.setSpaceSetting(
		ctx, test.members[4].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
	expectedUsersToReceiveNotification[test.members[4].Address] = struct{}{}

	// user wants to receive notifications for messages that are either a reply/reaction on his own messages
	// or when he is mentioned on the channel level. Because this is the default the space setting is overwritten
	// to no messages to ensure that the channel setting overwrites the space default.
	test.setSpaceSetting(ctx, test.members[5].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	test.setSpaceChannelSetting(
		ctx, test.members[5].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_ONLY_MENTIONS_REPLIES_REACTIONS)
	expectedUsersToReceiveNotification[test.members[5].Address] = struct{}{}

	// send a message and ensure that all expected notification are captured
	sender := test.members[0] // no notification for your own messages
	delete(expectedUsersToReceiveNotification, sender.Address)
	event := test.sendMessageWithTags(
		ctx, test.members[0], "hi!", &Tags{
			MentionedUserAddresses: mentionedUsers,
		})
	eventHash := common.BytesToHash(event.Hash)

	test.req.Eventuallyf(func() bool {
		nc.WebPushNotificationsMu.Lock()
		webCount := len(nc.WebPushNotifications[eventHash])
		nc.WebPushNotificationsMu.Unlock()

		nc.ApnPushNotificationsMu.Lock()
		apnCount := len(nc.ApnPushNotifications[eventHash])
		nc.ApnPushNotificationsMu.Unlock()

		return webCount == len(expectedUsersToReceiveNotification) ||
			apnCount == len(expectedUsersToReceiveNotification)
	}, 20*time.Second, 100*time.Millisecond, "Didn't receive all notifications")

	// Wait a bit to ensure that no more notifications come in
	test.req.Never(func() bool {
		nc.WebPushNotificationsMu.Lock()
		webCount := len(nc.WebPushNotifications[eventHash])
		nc.WebPushNotificationsMu.Unlock()

		nc.ApnPushNotificationsMu.Lock()
		apnCount := len(nc.ApnPushNotifications[eventHash])
		nc.ApnPushNotificationsMu.Unlock()

		return webCount != len(expectedUsersToReceiveNotification) ||
			apnCount != len(expectedUsersToReceiveNotification)
	}, 5*time.Second, 100*time.Millisecond, "Received too unexpected notifications")
}

func initNotificationService(ctx context.Context, tester *serviceTester) (*Service, *notificationCapture) {
	listener, err := net.Listen("tcp", "localhost:0")
	tester.require.NoError(err)

	nc := &notificationCapture{
		WebPushNotifications: make(map[common.Hash]map[common.Address]int),
		ApnPushNotifications: make(map[common.Hash]map[common.Address]int),
	}

	service, err := StartServerInNotificationMode(ctx, tester.getConfig(), tester.btc.DeployerBlockchain, listener, nc)
	tester.require.NoError(err)

	return service, nc
}

func setupSpaceChannelNotificationTest(
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
) *spaceChannelNotificationsTestContext {
	testCtx := &spaceChannelNotificationsTestContext{
		req:                tester.require,
		streamClient:       tester.testClient(0),
		notificationClient: notificationClient,
	}

	wallet, _ := crypto.NewWallet(ctx)
	testCtx.members = []*crypto.Wallet{wallet}

	ctx = tester.ctx
	require := tester.require
	client := testCtx.streamClient

	resuser, _, err := createUser(ctx, wallet, client, nil)
	require.NoError(err)
	require.NotNil(resuser)

	_, _, err = createUserMetadataStream(ctx, wallet, client, nil)
	require.NoError(err)

	testCtx.spaceID = testutils.FakeStreamId(STREAM_SPACE_BIN)
	space, _, err := createSpace(ctx, wallet, client, testCtx.spaceID, nil)
	require.NoError(err)
	require.NotNil(space)

	channelID := StreamId{STREAM_CHANNEL_BIN}
	copy(channelID[1:21], testCtx.spaceID[1:21])
	rand.Read(channelID[21:])
	testCtx.channelID = channelID
	channel, _, err := createChannel(ctx, wallet, client, testCtx.spaceID, testCtx.channelID, nil)
	require.NoError(err)
	require.NotNil(channel)

	// create users that join the channel
	for i := 0; i < 25; i++ {
		wallet, err := crypto.NewWallet(ctx)
		require.NoError(err)

		syncCookie, _, err := createUser(ctx, wallet, client, nil)
		require.NoError(err, "error creating user")
		require.NotNil(syncCookie)

		_, _, err = createUserMetadataStream(ctx, wallet, client, nil)
		require.NoError(err)

		addUserToChannel(require, ctx, client, syncCookie, wallet, testCtx.spaceID, testCtx.channelID)

		testCtx.members = append(testCtx.members, wallet)
	}

	_, newMbNum, err := makeMiniblock(ctx, client, testCtx.channelID, true, 0)
	require.NoError(err)
	require.Greater(newMbNum, int64(0))

	return testCtx
}

type spaceChannelNotificationsTestContext struct {
	req                *require.Assertions
	members            []*crypto.Wallet
	spaceID            StreamId
	channelID          StreamId
	streamClient       protocolconnect.StreamServiceClient
	notificationClient protocolconnect.NotificationServiceClient
}

func (tc *spaceChannelNotificationsTestContext) sendMessageWithTags(
	ctx context.Context,
	from *crypto.Wallet,
	messageContent string,
	tags *Tags,
) *Envelope {
	resp, err := tc.streamClient.GetLastMiniblockHash(ctx, connect.NewRequest(
		&GetLastMiniblockHashRequest{
			StreamId: tc.channelID[:],
		}))
	tc.req.NoError(err)

	event, err := events.MakeEnvelopeWithPayloadAndTags(
		from,
		events.Make_ChannelPayload_Message(messageContent),
		resp.Msg.GetHash(),
		tags,
	)
	tc.req.NoError(err)

	_, err = tc.streamClient.AddEvent(ctx, connect.NewRequest(&AddEventRequest{
		StreamId: tc.channelID[:],
		Event:    event,
		Optional: false,
	}))

	tc.req.NoError(err)

	return event
}

func (tc *spaceChannelNotificationsTestContext) subscribeWebPush(
	ctx context.Context,
	userID common.Address,
) {
	h := sha256.New()
	h.Write(userID[:])
	p256Dh := hex.EncodeToString(h.Sum(nil))
	h.Write(userID[:])
	auth := hex.EncodeToString(h.Sum(nil))

	_, err := tc.notificationClient.SubscribeWebPush(ctx, connect.NewRequest(&SubscribeWebPushRequest{
		Subscription: &WebPushSubscriptionObject{
			Endpoint: userID.String(), // (ab)used to determine who received a notification
			Keys: &WebPushSubscriptionObjectKeys{
				P256Dh: p256Dh,
				Auth:   auth,
			},
		},
		UserId: userID[:],
	}))

	tc.req.NoError(err, "SubscribeWebPush failed")
}

func (tc *spaceChannelNotificationsTestContext) subscribeApnPush(
	ctx context.Context,
	userID common.Address,
) {
	_, err := tc.notificationClient.SubscribeAPN(ctx, connect.NewRequest(&SubscribeAPNRequest{
		DeviceToken: userID[:], // (ab)used to determine who received a notification
		UserId:      userID[:],
	}))

	tc.req.NoError(err, "SubscribeAPN failed")
}

func (tc *spaceChannelNotificationsTestContext) setSpaceChannelSetting(
	ctx context.Context,
	userID common.Address,
	setting SpaceChannelSettingValue,
) {
	_, err := tc.notificationClient.SetChannelSettings(ctx, connect.NewRequest(&SetChannelSettingsRequest{
		UserId:    userID[:],
		ChannelId: tc.channelID[:],
		SpaceId:   tc.spaceID[:],
		Value:     setting,
	}))

	tc.req.NoError(err, "SetChannelSettings failed")
}

func (tc *spaceChannelNotificationsTestContext) setSpaceSetting(
	ctx context.Context,
	userID common.Address,
	setting SpaceChannelSettingValue,
) {
	_, err := tc.notificationClient.SetSpaceSettings(ctx, connect.NewRequest(&SetSpaceSettingsRequest{
		UserId:  userID[:],
		SpaceId: tc.spaceID[:],
		Value:   setting,
	}))

	tc.req.NoError(err, "SetSpaceSettings failed")
}

type notificationCapture struct {
	WebPushNotificationsMu sync.Mutex
	WebPushNotifications   map[common.Hash]map[common.Address]int // event hash -> key=endpoint:count
	ApnPushNotificationsMu sync.Mutex
	ApnPushNotifications   map[common.Hash]map[common.Address]int // event hash -> key=device_token:count
}

func (nc *notificationCapture) SendWebPushNotification(
	_ context.Context,
	subscription *webpush.Subscription,
	eventHash common.Hash,
	_ []byte,
) error {
	nc.WebPushNotificationsMu.Lock()
	defer nc.WebPushNotificationsMu.Unlock()

	events, found := nc.WebPushNotifications[eventHash]
	if !found {
		events = make(map[common.Address]int)
	}
	// for testing purposes the users address is included in the endpoint
	events[common.HexToAddress(subscription.Endpoint)]++
	nc.WebPushNotifications[eventHash] = events

	return nil
}

func (nc *notificationCapture) SendApplePushNotification(
	_ context.Context,
	deviceToken string,
	eventHash common.Hash,
	_ *payload2.Payload,
) error {
	nc.ApnPushNotificationsMu.Lock()
	defer nc.ApnPushNotificationsMu.Unlock()

	events, found := nc.ApnPushNotifications[eventHash]
	if !found {
		events = make(map[common.Address]int)
	}

	// for test purposes the users address is the device token
	events[common.HexToAddress(deviceToken)]++
	nc.ApnPushNotifications[eventHash] = events

	return nil
}

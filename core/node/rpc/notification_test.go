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
// and share the same set of nodes, notification service and client.
func TestNotifications(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	ctx, cancel := context.WithCancel(tester.ctx)
	defer cancel()

	notificationService, notifications := initNotificationService(ctx, tester)
	notificationClient := protocolconnect.NewNotificationServiceClient(
		http.DefaultClient, "http://"+notificationService.listener.Addr().String())

	t.Run("DMNotifications", func(t *testing.T) {
		testDMNotifications(t, ctx, tester, notificationClient, notifications)
	})

	t.Run("GDMNotifications", func(t *testing.T) {
		testGDMNotifications(t, ctx, tester, notificationClient, notifications)
	})

	t.Run("SpaceChannelNotifications", func(t *testing.T) {
		testSpaceChannelNotifications(t, ctx, tester, notificationClient, notifications)
	})
}

func testGDMNotifications(
	t *testing.T,
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
	notifications *notificationCapture,
) {
	t.Run("MessageWithNoMentionsRepliesAndReaction", func(t *testing.T) {
		test := setupGDMNotificationTest(ctx, tester, notificationClient)
		testGDMMessageWithNoMentionsRepliesAndReaction(ctx, test, notifications)
	})
}

func testGDMMessageWithNoMentionsRepliesAndReaction(
	ctx context.Context,
	test *gdmChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	expectedUsersToReceiveNotification := make(map[common.Address]int)

	// by default all members should receive a notification for GDM messages
	for _, member := range test.members {
		test.subscribeWebPush(ctx, member.Address)
		test.subscribeApnPush(ctx, member.Address)

		expectedUsersToReceiveNotification[member.Address] = 1
	}

	// member disabled all GDM messages on the global level and should not get a notification
	member := test.members[1]
	test.setGlobalGDMSetting(ctx, member.Address, GdmChannelSettingValue_GDM_NO_MESSAGES)
	delete(expectedUsersToReceiveNotification, member.Address)

	// member disabled GDM message on this particular channel and should not get a notification
	member = test.members[2]
	test.setGDMChannelSetting(ctx, member.Address, GdmChannelSettingValue_GDM_NO_MESSAGES)
	delete(expectedUsersToReceiveNotification, member.Address)

	// member only wants a notification for GDM message he is mentioned or are a reply/reaction to his own message
	// on global level
	member = test.members[3]
	test.setGlobalGDMSetting(ctx, member.Address, GdmChannelSettingValue_GDM_ONLY_MENTIONS_REPLIES_REACTIONS)
	delete(expectedUsersToReceiveNotification, member.Address)

	// member only wants a notification for GDM message he is mentioned or are a reply/reaction to his own message
	// on this GDM channel
	member = test.members[4]
	test.setGDMChannelSetting(ctx, member.Address, GdmChannelSettingValue_GDM_ONLY_MENTIONS_REPLIES_REACTIONS)
	delete(expectedUsersToReceiveNotification, member.Address)

	// send GDM message with no tags
	sender := test.members[0]
	delete(expectedUsersToReceiveNotification, sender.Address)
	event := test.sendMessageWithTags(
		ctx, sender, "hi!", &Tags{})
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
	}, 10*time.Second, 2500*time.Millisecond, "Didn't receive expected notifications")

	// Wait a bit to ensure that no more notifications come in
	test.req.Never(func() bool {
		nc.WebPushNotificationsMu.Lock()
		defer nc.WebPushNotificationsMu.Unlock()
		nc.ApnPushNotificationsMu.Lock()
		defer nc.ApnPushNotificationsMu.Unlock()

		return !cmp.Equal(nc.WebPushNotifications[eventHash], expectedUsersToReceiveNotification) ||
			!cmp.Equal(nc.ApnPushNotifications[eventHash], expectedUsersToReceiveNotification)
	}, 5*time.Second, 1000*time.Millisecond, "Received unexpected notifications")
}

func testDMNotifications(
	t *testing.T,
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
	notifications *notificationCapture,
) {
	t.Run("MessageWithDefaultUserNotificationsPreferences", func(t *testing.T) {
		test := setupDMNotificationTest(ctx, tester, notificationClient)
		testDMMessageWithDefaultUserNotificationsPreferences(ctx, test, notifications)
	})

	t.Run("DMMessageWithNotificationsMutedOnDmChannel", func(t *testing.T) {
		test := setupDMNotificationTest(ctx, tester, notificationClient)
		testDMMessageWithNotificationsMutedOnDmChannel(ctx, test, notifications)
	})

	t.Run("DMMessageWithNotificationsMutedGlobal", func(t *testing.T) {
		test := setupDMNotificationTest(ctx, tester, notificationClient)
		testDMMessageWithNotificationsMutedGlobal(ctx, test, notifications)
	})

	t.Run("MessageWithBlockedUser", func(t *testing.T) {
		test := setupDMNotificationTest(ctx, tester, notificationClient)
		testDMMessageWithBlockedUser(ctx, test, notifications)
	})
}

func testDMMessageWithNotificationsMutedOnDmChannel(
	ctx context.Context,
	test *dmChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	test.setChannel(ctx, test.member.Address, DmChannelSettingValue_DM_MESSAGES_NO)

	// sender will never receive a notification for his own message and user DM stream member has
	// muted the channel -> no notifications
	expectedNotifications := 0

	test.subscribeWebPush(ctx, test.initiator.Address)
	test.subscribeWebPush(ctx, test.member.Address)
	test.subscribeApnPush(ctx, test.initiator.Address)
	test.subscribeApnPush(ctx, test.member.Address)

	// send a message and ensure that all expected notification are captured
	event := test.sendMessageWithTags(
		ctx, test.initiator, "hi!", &Tags{})
	eventHash := common.BytesToHash(event.Hash)

	// Wait a bit to ensure that no more notifications come in
	test.req.Never(func() bool {
		nc.WebPushNotificationsMu.Lock()
		webCount := len(nc.WebPushNotifications[eventHash])
		nc.WebPushNotificationsMu.Unlock()

		nc.ApnPushNotificationsMu.Lock()
		apnCount := len(nc.ApnPushNotifications[eventHash])
		nc.ApnPushNotificationsMu.Unlock()

		return webCount != expectedNotifications || apnCount != expectedNotifications
	}, 5*time.Second, 1000*time.Millisecond, "Received unexpected notifications")
}

func testDMMessageWithNotificationsMutedGlobal(
	ctx context.Context,
	test *dmChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	// receiver of message has muted notifications
	expectedUsersToReceiveNotification := 0

	test.muteGlobal(ctx, test.member.Address, DmChannelSettingValue_DM_MESSAGES_NO)

	test.subscribeWebPush(ctx, test.initiator.Address)
	test.subscribeWebPush(ctx, test.member.Address)
	test.subscribeApnPush(ctx, test.initiator.Address)
	test.subscribeApnPush(ctx, test.member.Address)

	// send a message and ensure that all expected notification are captured
	event := test.sendMessageWithTags(
		ctx, test.initiator, "hi!", &Tags{})
	eventHash := common.BytesToHash(event.Hash)

	// Wait a bit to ensure that no more notifications come in
	test.req.Never(func() bool {
		nc.WebPushNotificationsMu.Lock()
		webCount := len(nc.WebPushNotifications[eventHash])
		nc.WebPushNotificationsMu.Unlock()

		nc.ApnPushNotificationsMu.Lock()
		apnCount := len(nc.ApnPushNotifications[eventHash])
		nc.ApnPushNotificationsMu.Unlock()

		return webCount != expectedUsersToReceiveNotification || apnCount != expectedUsersToReceiveNotification
	}, 5*time.Second, 1000*time.Millisecond, "Received unexpected notifications")
}

func testDMMessageWithDefaultUserNotificationsPreferences(
	ctx context.Context,
	test *dmChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	// only test.member is expected to get a notification because test.initiator will be the message sender
	expectedUsersToReceiveNotification := map[common.Address]int{
		test.member.Address: 1,
	}

	test.subscribeWebPush(ctx, test.initiator.Address)
	test.subscribeWebPush(ctx, test.member.Address)
	test.subscribeApnPush(ctx, test.initiator.Address)
	test.subscribeApnPush(ctx, test.member.Address)

	// send a message and ensure that all expected notification are captured
	event := test.sendMessageWithTags(
		ctx, test.initiator, "hi!", &Tags{})
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
	}, 20*time.Second, 1000*time.Millisecond, "Didn't receive expected notifications")

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
	}, 5*time.Second, 1000*time.Millisecond, "Received unexpected notifications")
}

func testDMMessageWithBlockedUser(
	ctx context.Context,
	test *dmChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	// test.member is expected to get a notification but has blocked the sender -> no message
	expectedNotifications := 0

	test.blockUser(
		ctx,
		test.MemberUserSettingsStreamID,
		test.member,
		test.initiator.Address,
		true,
	)

	test.subscribeWebPush(ctx, test.initiator.Address)
	test.subscribeWebPush(ctx, test.member.Address)
	test.subscribeApnPush(ctx, test.initiator.Address)
	test.subscribeApnPush(ctx, test.member.Address)

	// send a message and ensure that all expected notification are captured
	event := test.sendMessageWithTags(
		ctx, test.initiator, "hi!", &Tags{})
	eventHash := common.BytesToHash(event.Hash)

	// ensure that no notifications come in
	test.req.Never(func() bool {
		nc.WebPushNotificationsMu.Lock()
		webCount := len(nc.WebPushNotifications[eventHash])
		nc.WebPushNotificationsMu.Unlock()

		nc.ApnPushNotificationsMu.Lock()
		apnCount := len(nc.ApnPushNotifications[eventHash])
		nc.ApnPushNotificationsMu.Unlock()

		return webCount != expectedNotifications || apnCount != expectedNotifications
	}, 10*time.Second, 1000*time.Millisecond, "Received unexpected notifications")
}

func testSpaceChannelNotifications(
	t *testing.T,
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
	notifications *notificationCapture,
) {
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
	// by default non of the members should receive a notification for this message
	expectedUsersToReceiveNotification := make(map[common.Address]int)
	for _, wallet := range test.members {
		test.setSpaceChannelSetting(ctx, wallet.Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)

		test.subscribeWebPush(ctx, wallet.Address)
		test.subscribeApnPush(ctx, wallet.Address)
	}

	// enable for some members notifications for this message
	test.setSpaceChannelSetting(
		ctx, test.members[1].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
	expectedUsersToReceiveNotification[test.members[1].Address] = 1

	test.setSpaceSetting( // per channel setting is no messages -> no notification
		ctx, test.members[2].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)

	test.setSpaceChannelSetting(
		ctx, test.members[3].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_ONLY_MENTIONS_REPLIES_REACTIONS)

	test.setSpaceSetting(
		ctx, test.members[4].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_ONLY_MENTIONS_REPLIES_REACTIONS)

	// send a message and ensure that all expected notification are captured
	event := test.sendMessageWithTags(
		ctx, test.members[0], "hi!", &Tags{})
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
	}, 20*time.Second, 1000*time.Millisecond, "Didn't receive expected notifications")

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
	}, 5*time.Second, 1000*time.Millisecond, "Received unexpected notifications")
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
		ctx, sender, "hi!", &Tags{
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
	}, 20*time.Second, 1000*time.Millisecond, "Didn't receive expected notifications")

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
	}, 5*time.Second, 1000*time.Millisecond, "Received unexpected notifications")
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
		ctx, test.members[5].Address, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
	expectedUsersToReceiveNotification[test.members[5].Address] = struct{}{}

	// send a message and ensure that all expected notification are captured
	sender := test.members[0] // no notification for your own messages
	delete(expectedUsersToReceiveNotification, sender.Address)
	event := test.sendMessageWithTags(
		ctx, sender, "hi!", &Tags{
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
	}, 20*time.Second, 100*time.Millisecond, "Didn't receive expected notifications")

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

type dmChannelNotificationsTestContext struct {
	req                           *require.Assertions
	initiator                     *crypto.Wallet
	InitiatorUserSettingsStreamID StreamId
	member                        *crypto.Wallet
	MemberUserSettingsStreamID    StreamId
	dmStreamID                    StreamId
	Channel                       *SyncCookie
	streamClient                  protocolconnect.StreamServiceClient
	notificationClient            protocolconnect.NotificationServiceClient
}

func setupDMNotificationTest(
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
) *dmChannelNotificationsTestContext {
	testCtx := &dmChannelNotificationsTestContext{
		req:                tester.require,
		streamClient:       tester.testClient(0),
		notificationClient: notificationClient,
	}

	ctx = tester.ctx
	require := tester.require
	client := testCtx.streamClient
	var err error

	testCtx.initiator, err = crypto.NewWallet(ctx)
	require.NoError(err)

	testCtx.InitiatorUserSettingsStreamID, _, _, err = createUserSettingsStream(
		ctx,
		testCtx.initiator,
		testCtx.streamClient,
		nil,
	)
	require.NoError(err)

	user1SyncCookie, _, err := createUser(ctx, testCtx.initiator, client, nil)
	require.NoError(err)
	require.NotNil(user1SyncCookie)

	_, _, err = createUserMetadataStream(ctx, testCtx.initiator, client, nil)
	require.NoError(err)

	testCtx.member, err = crypto.NewWallet(ctx)
	require.NoError(err)

	user2SyncCookie, _, err := createUser(ctx, testCtx.member, client, nil)
	require.NoError(err)
	require.NotNil(user2SyncCookie)

	testCtx.MemberUserSettingsStreamID, _, _, err = createUserSettingsStream(
		ctx,
		testCtx.member,
		testCtx.streamClient,
		nil,
	)
	require.NoError(err)

	_, _, err = createUserMetadataStream(ctx, testCtx.member, client, nil)
	require.NoError(err)

	testCtx.dmStreamID, err = DMStreamIdForUsers(testCtx.initiator.Address[:], testCtx.member.Address[:])
	require.NoError(err)
	testCtx.Channel, _, err = createDMChannel(ctx, testCtx.initiator, testCtx.member, client, testCtx.dmStreamID, nil)
	require.NoError(err)
	require.NotNil(testCtx.Channel)

	return testCtx
}

type gdmChannelNotificationsTestContext struct {
	req                *require.Assertions
	members            []*crypto.Wallet
	gdmStreamID        StreamId
	syncCookie         *SyncCookie
	streamClient       protocolconnect.StreamServiceClient
	notificationClient protocolconnect.NotificationServiceClient
}

func setupGDMNotificationTest(
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
) *gdmChannelNotificationsTestContext {
	testCtx := &gdmChannelNotificationsTestContext{
		req:                tester.require,
		streamClient:       tester.testClient(0),
		notificationClient: notificationClient,
	}

	ctx = tester.ctx
	require := tester.require
	client := testCtx.streamClient
	var err error

	for i := 0; i < 10; i++ {
		member, err := crypto.NewWallet(ctx)
		require.NoError(err)

		_, _, _, err = createUserSettingsStream(
			ctx,
			member,
			testCtx.streamClient,
			nil,
		)
		require.NoError(err)

		_, _, err = createUser(ctx, member, client, nil)
		require.NoError(err)

		_, _, err = createUserMetadataStream(ctx, member, client, nil)
		require.NoError(err)

		testCtx.members = append(testCtx.members, member)
	}

	testCtx.gdmStreamID = testutils.FakeStreamId(STREAM_GDM_CHANNEL_BIN)
	_, _, err = createGDMChannel(ctx, testCtx.members[0], testCtx.members[1:], testCtx.streamClient, testCtx.gdmStreamID, nil)

	testCtx.req.NoError(err)

	return testCtx
}

func (tc *gdmChannelNotificationsTestContext) join(
	ctx context.Context,
	member common.Address,
) {

}

func (tc *gdmChannelNotificationsTestContext) leave(
	ctx context.Context,
	member common.Address,
) {

}

func (tc *gdmChannelNotificationsTestContext) sendMessageWithTags(
	ctx context.Context,
	from *crypto.Wallet,
	messageContent string,
	tags *Tags,
) *Envelope {
	resp, err := tc.streamClient.GetLastMiniblockHash(ctx, connect.NewRequest(
		&GetLastMiniblockHashRequest{
			StreamId: tc.gdmStreamID[:],
		}))
	tc.req.NoError(err)

	event, err := events.MakeEnvelopeWithPayloadAndTags(
		from,
		events.Make_GDMChannelPayload_Message(messageContent),
		resp.Msg.GetHash(),
		tags,
	)
	tc.req.NoError(err)

	_, err = tc.streamClient.AddEvent(ctx, connect.NewRequest(&AddEventRequest{
		StreamId: tc.gdmStreamID[:],
		Event:    event,
		Optional: false,
	}))

	tc.req.NoError(err)

	return event
}

func (tc *gdmChannelNotificationsTestContext) setGlobalGDMSetting(
	ctx context.Context,
	userID common.Address,
	setting GdmChannelSettingValue,
) {
	_, err := tc.notificationClient.SetDmGdmSettings(ctx, connect.NewRequest(&SetDmGdmSettingsRequest{
		UserId:    userID[:],
		DmGlobal:  DmChannelSettingValue_DM_MESSAGES_YES,
		GdmGlobal: setting,
	}))

	tc.req.NoError(err, "setGlobalGDMSetting failed")
}

func (tc *gdmChannelNotificationsTestContext) setGDMChannelSetting(
	ctx context.Context,
	userID common.Address,
	setting GdmChannelSettingValue,
) {
	_, err := tc.notificationClient.SetGdmChannelSetting(ctx, connect.NewRequest(&SetGdmChannelSettingRequest{
		UserId:       userID[:],
		GdmChannelId: tc.gdmStreamID[:],
		Value:        setting,
	}))

	tc.req.NoError(err, "setGDMChannelSetting failed")
}

func (tc *gdmChannelNotificationsTestContext) muteChannel(
	ctx context.Context,
	userID common.Address,
	setting SpaceChannelSettingValue,
) {
	_, err := tc.notificationClient.SetSpaceChannelSettings(ctx, connect.NewRequest(&SetSpaceChannelSettingsRequest{
		UserId:    userID[:],
		ChannelId: tc.gdmStreamID[:],
		SpaceId:   nil,
		Value:     setting,
	}))

	tc.req.NoError(err, "setChannel failed")
}

func (tc *gdmChannelNotificationsTestContext) subscribeWebPush(
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

func (tc *gdmChannelNotificationsTestContext) subscribeApnPush(
	ctx context.Context,
	userID common.Address,
) {
	_, err := tc.notificationClient.SubscribeAPN(ctx, connect.NewRequest(&SubscribeAPNRequest{
		DeviceToken: userID[:], // (ab)used to determine who received a notification
		UserId:      userID[:],
		Environment: APNEnvironment_APN_ENVIRONMENT_SANDBOX,
	}))

	tc.req.NoError(err, "SubscribeAPN failed")
}

func (tc *dmChannelNotificationsTestContext) sendMessageWithTags(
	ctx context.Context,
	from *crypto.Wallet,
	messageContent string,
	tags *Tags,
) *Envelope {
	resp, err := tc.streamClient.GetLastMiniblockHash(ctx, connect.NewRequest(
		&GetLastMiniblockHashRequest{
			StreamId: tc.dmStreamID[:],
		}))
	tc.req.NoError(err)

	event, err := events.MakeEnvelopeWithPayloadAndTags(
		from,
		events.Make_DMChannelPayload_Message(messageContent),
		resp.Msg.GetHash(),
		tags,
	)
	tc.req.NoError(err)

	_, err = tc.streamClient.AddEvent(ctx, connect.NewRequest(&AddEventRequest{
		StreamId: tc.dmStreamID[:],
		Event:    event,
		Optional: false,
	}))

	tc.req.NoError(err)

	return event
}

func (tc *dmChannelNotificationsTestContext) blockUser(
	ctx context.Context,
	streamID StreamId,
	from *crypto.Wallet,
	userID common.Address,
	blocked bool,
) *Envelope {
	resp, err := tc.streamClient.GetLastMiniblockHash(ctx, connect.NewRequest(
		&GetLastMiniblockHashRequest{
			StreamId: streamID[:],
		}))
	tc.req.NoError(err)

	event, err := events.MakeEnvelopeWithPayload(
		from,
		events.Make_UserSettingsPayload_UserBlock(&UserSettingsPayload_UserBlock{
			UserId:    userID[:],
			IsBlocked: blocked,
			EventNum:  22,
		}),
		resp.Msg.GetHash(),
	)
	tc.req.NoError(err)

	_, err = tc.streamClient.AddEvent(ctx, connect.NewRequest(&AddEventRequest{
		StreamId: streamID[:],
		Event:    event,
		Optional: false,
	}))

	tc.req.NoError(err)

	return event
}

func (tc *dmChannelNotificationsTestContext) setChannel(
	ctx context.Context,
	userID common.Address,
	setting DmChannelSettingValue,
) {
	_, err := tc.notificationClient.SetDmChannelSetting(ctx, connect.NewRequest(&SetDmChannelSettingRequest{
		UserId:      userID[:],
		DmChannelId: tc.dmStreamID[:],
		Value:       setting,
	}))

	tc.req.NoError(err, "setChannel failed")
}

func (tc *dmChannelNotificationsTestContext) muteGlobal(
	ctx context.Context,
	userID common.Address,
	setting DmChannelSettingValue,
) {
	_, err := tc.notificationClient.SetDmGdmSettings(ctx, connect.NewRequest(&SetDmGdmSettingsRequest{
		UserId:    userID[:],
		DmGlobal:  setting,
		GdmGlobal: GdmChannelSettingValue_GDM_UNSPECIFIED,
	}))

	tc.req.NoError(err, "muteGlobal failed")
}

func (tc *dmChannelNotificationsTestContext) subscribeWebPush(
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

func (tc *dmChannelNotificationsTestContext) subscribeApnPush(
	ctx context.Context,
	userID common.Address,
) {
	_, err := tc.notificationClient.SubscribeAPN(ctx, connect.NewRequest(&SubscribeAPNRequest{
		DeviceToken: userID[:], // (ab)used to determine who received a notification
		UserId:      userID[:],
		Environment: APNEnvironment_APN_ENVIRONMENT_SANDBOX,
	}))

	tc.req.NoError(err, "SubscribeAPN failed")
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
		Environment: APNEnvironment_APN_ENVIRONMENT_SANDBOX,
	}))

	tc.req.NoError(err, "SubscribeAPN failed")
}

func (tc *spaceChannelNotificationsTestContext) setSpaceChannelSetting(
	ctx context.Context,
	userID common.Address,
	setting SpaceChannelSettingValue,
) {
	_, err := tc.notificationClient.SetSpaceChannelSettings(ctx, connect.NewRequest(&SetSpaceChannelSettingsRequest{
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

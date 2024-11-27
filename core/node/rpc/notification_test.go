package rpc

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"net/http"
	"sync"
	"testing"
	"time"

	"connectrpc.com/connect"
	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/common"
	eth_crypto "github.com/ethereum/go-ethereum/crypto"
	"github.com/google/go-cmp/cmp"
	payload2 "github.com/sideshow/apns2/payload"
	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/notifications/push"
	"github.com/river-build/river/core/node/notifications/types"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/testutils"
	"github.com/river-build/river/core/node/testutils/testcert"
)

// TestSubscriptionExpired ensures that web/apn subscriptions for which the notification API
// returns 410 - Gone /expired are automatically purged.
func TestSubscriptionExpired(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	ctx, cancel := context.WithCancel(tester.ctx)
	defer cancel()

	var notifications notificationExpired

	notificationService := initNotificationService(ctx, tester, notifications)
	notificationClient := protocolconnect.NewNotificationServiceClient(
		http.DefaultClient, "http://"+notificationService.listener.Addr().String())
	authClient := protocolconnect.NewAuthenticationServiceClient(
		http.DefaultClient, "http://"+notificationService.listener.Addr().String())

	t.Run("webpush", func(t *testing.T) {
		test := setupDMNotificationTest(ctx, tester, notificationClient, authClient)
		test.subscribeWebPush(ctx, test.initiator)
		test.subscribeWebPush(ctx, test.member)

		// ensure that subscription for member is dropped after subscription expired.
		_ = test.sendMessageWithTags(
			ctx, test.initiator, "hi!", &Tags{})

		test.req.Eventuallyf(func() bool {
			settings := test.getSettings(ctx, test.initiator)
			if len(settings.WebSubscriptions) != 1 {
				return false
			}

			settings = test.getSettings(ctx, test.member)
			return len(settings.WebSubscriptions) == 0
		}, 15*time.Second, 100*time.Millisecond, "webpush subscription not deleted")
	})

	t.Run("APN", func(t *testing.T) {
		test := setupDMNotificationTest(ctx, tester, notificationClient, authClient)
		test.subscribeApnPush(ctx, test.initiator)
		test.subscribeApnPush(ctx, test.member)

		// ensure that subscription for member is dropped after subscription expired.
		_ = test.sendMessageWithTags(
			ctx, test.initiator, "hi!", &Tags{})

		test.req.Eventuallyf(func() bool {
			settings := test.getSettings(ctx, test.initiator)
			if len(settings.ApnSubscriptions) != 1 {
				return false
			}

			settings = test.getSettings(ctx, test.member)
			return len(settings.ApnSubscriptions) == 0
		}, 15*time.Second, 100*time.Millisecond, "APN subscription not deleted")
	})
}

// TestNotifications is designed in such a way that all tests are run in parallel
// and share the same set of nodes, notification service and client.
func TestNotifications(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	ctx, cancel := context.WithCancel(tester.ctx)
	defer cancel()

	notifications := &notificationCapture{
		WebPushNotifications: make(map[common.Hash]map[common.Address]int),
		ApnPushNotifications: make(map[common.Hash]map[common.Address]int),
	}

	notificationService := initNotificationService(ctx, tester, notifications)

	httpClient, _ := testcert.GetHttp2LocalhostTLSClient(ctx, tester.getConfig())

	notificationClient := protocolconnect.NewNotificationServiceClient(
		httpClient, "https://"+notificationService.listener.Addr().String())

	authClient := protocolconnect.NewAuthenticationServiceClient(
		httpClient, "https://"+notificationService.listener.Addr().String())

	t.Run("DMNotifications", func(t *testing.T) {
		testDMNotifications(t, ctx, tester, notificationClient, authClient, notifications)
	})

	t.Run("GDMNotifications", func(t *testing.T) {
		testGDMNotifications(t, ctx, tester, notificationClient, authClient, notifications)
	})

	t.Run("SpaceChannelNotifications", func(t *testing.T) {
		testSpaceChannelNotifications(t, ctx, tester, notificationClient, authClient, notifications)
	})
}

func testGDMNotifications(
	t *testing.T,
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
	authClient protocolconnect.AuthenticationServiceClient,
	notifications *notificationCapture,
) {
	t.Run("MessageWithNoMentionsRepliesAndReaction", func(t *testing.T) {
		test := setupGDMNotificationTest(ctx, tester, notificationClient, authClient)
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
		test.subscribeWebPush(ctx, member)
		test.subscribeApnPush(ctx, member)

		expectedUsersToReceiveNotification[member.Address] = 1
	}

	// member disabled all GDM messages on the global level and should not get a notification
	member := test.members[1]
	test.setGlobalGDMSetting(ctx, member, GdmChannelSettingValue_GDM_MESSAGES_NO)
	delete(expectedUsersToReceiveNotification, member.Address)

	// member disabled GDM message on this particular channel and should not get a notification
	member = test.members[2]
	test.setGDMChannelSetting(ctx, member, GdmChannelSettingValue_GDM_MESSAGES_NO)
	delete(expectedUsersToReceiveNotification, member.Address)

	// member disabled all GDM messages on the global level and should not get a notification
	member = test.members[3]
	test.setGlobalGDMSetting(ctx, member, GdmChannelSettingValue_GDM_MESSAGES_NO_AND_MUTE)
	delete(expectedUsersToReceiveNotification, member.Address)

	// member disabled GDM message on this particular channel and should not get a notification
	member = test.members[4]
	test.setGDMChannelSetting(ctx, member, GdmChannelSettingValue_GDM_MESSAGES_NO_AND_MUTE)
	delete(expectedUsersToReceiveNotification, member.Address)

	// member only wants a notification for GDM message he is mentioned or are a reply/reaction to his own message
	// on global level
	member = test.members[5]
	test.setGlobalGDMSetting(ctx, member, GdmChannelSettingValue_GDM_ONLY_MENTIONS_REPLIES_REACTIONS)
	delete(expectedUsersToReceiveNotification, member.Address)

	// member only wants a notification for GDM message he is mentioned or are a reply/reaction to his own message
	// on this GDM channel
	member = test.members[6]
	test.setGDMChannelSetting(ctx, member, GdmChannelSettingValue_GDM_ONLY_MENTIONS_REPLIES_REACTIONS)
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
	}, 5*time.Second, 100*time.Millisecond, "Received unexpected notifications")
}

func testDMNotifications(
	t *testing.T,
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
	authClient protocolconnect.AuthenticationServiceClient,
	notifications *notificationCapture,
) {
	t.Run("MessageWithDefaultUserNotificationsPreferences", func(t *testing.T) {
		test := setupDMNotificationTest(ctx, tester, notificationClient, authClient)
		testDMMessageWithDefaultUserNotificationsPreferences(ctx, test, notifications)
	})

	t.Run("DMMessageWithNotificationsMutedOnDmChannel", func(t *testing.T) {
		test := setupDMNotificationTest(ctx, tester, notificationClient, authClient)
		testDMMessageWithNotificationsMutedOnDmChannel(ctx, test, notifications)
	})

	t.Run("DMMessageWithNotificationsMutedGlobal", func(t *testing.T) {
		test := setupDMNotificationTest(ctx, tester, notificationClient, authClient)
		testDMMessageWithNotificationsMutedGlobal(ctx, test, notifications)
	})

	t.Run("MessageWithBlockedUser", func(t *testing.T) {
		test := setupDMNotificationTest(ctx, tester, notificationClient, authClient)
		testDMMessageWithBlockedUser(ctx, test, notifications)
	})
}

func testDMMessageWithNotificationsMutedOnDmChannel(
	ctx context.Context,
	test *dmChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	test.setChannel(ctx, test.member, DmChannelSettingValue_DM_MESSAGES_NO)

	// sender will never receive a notification for his own message and user DM stream member has
	// muted the channel -> no notifications
	expectedNotifications := 0

	test.subscribeWebPush(ctx, test.initiator)
	test.subscribeWebPush(ctx, test.member)
	test.subscribeApnPush(ctx, test.initiator)
	test.subscribeApnPush(ctx, test.member)

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
	}, 5*time.Second, 100*time.Millisecond, "Received unexpected notifications")
}

func testDMMessageWithNotificationsMutedGlobal(
	ctx context.Context,
	test *dmChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	// receiver of message has muted notifications
	expectedUsersToReceiveNotification := 0

	test.muteGlobal(ctx, test.member, DmChannelSettingValue_DM_MESSAGES_NO)

	test.subscribeWebPush(ctx, test.initiator)
	test.subscribeWebPush(ctx, test.member)
	test.subscribeApnPush(ctx, test.initiator)
	test.subscribeApnPush(ctx, test.member)

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
	}, 5*time.Second, 100*time.Millisecond, "Received unexpected notifications")
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

	test.subscribeWebPush(ctx, test.initiator)
	test.subscribeWebPush(ctx, test.member)
	test.subscribeApnPush(ctx, test.initiator)
	test.subscribeApnPush(ctx, test.member)

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
	}, 5*time.Second, 100*time.Millisecond, "Received unexpected notifications")
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

	test.subscribeWebPush(ctx, test.initiator)
	test.subscribeWebPush(ctx, test.member)
	test.subscribeApnPush(ctx, test.initiator)
	test.subscribeApnPush(ctx, test.member)

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
	}, 10*time.Second, 100*time.Millisecond, "Received unexpected notifications")
}

func testSpaceChannelNotifications(
	t *testing.T,
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
	authClient protocolconnect.AuthenticationServiceClient,
	notifications *notificationCapture,
) {
	t.Run("TestPlainMessage", func(t *testing.T) {
		test := setupSpaceChannelNotificationTest(ctx, tester, notificationClient, authClient)
		testSpaceChannelPlainMessage(ctx, test, notifications)
	})

	t.Run("TestAtChannelTag", func(t *testing.T) {
		test := setupSpaceChannelNotificationTest(ctx, tester, notificationClient, authClient)
		testSpaceChannelAtChannelTag(ctx, test, notifications)
	})

	t.Run("TestMentionsTag", func(t *testing.T) {
		test := setupSpaceChannelNotificationTest(ctx, tester, notificationClient, authClient)
		testSpaceChannelMentionTag(ctx, test, notifications)
	})
}

// testSpaceChannelPlainMessage tests space channel message that isn't a reply, reaction nor includes a mention
func testSpaceChannelPlainMessage(
	ctx context.Context,
	test *spaceChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	// by default non of the members should receive a notification for this message
	expectedUsersToReceiveNotification := make(map[common.Address]int)
	for _, wallet := range test.members {
		test.setSpaceChannelSetting(ctx, wallet, SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)

		test.subscribeWebPush(ctx, wallet)
		test.subscribeApnPush(ctx, wallet)
	}

	// enable for some members notifications for this message
	test.setSpaceChannelSetting(
		ctx, test.members[1], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
	expectedUsersToReceiveNotification[test.members[1].Address] = 1

	test.setSpaceSetting( // per channel setting is no messages -> no notification
		ctx, test.members[2], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)

	test.setSpaceChannelSetting(
		ctx, test.members[3], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_ONLY_MENTIONS_REPLIES_REACTIONS)

	test.setSpaceSetting(
		ctx, test.members[4], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_ONLY_MENTIONS_REPLIES_REACTIONS)

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
	}, 5*time.Second, 100*time.Millisecond, "Received unexpected notifications")
}

func testSpaceChannelAtChannelTag(
	ctx context.Context,
	test *spaceChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	// subscribe for notifications only on the first couple of wallets on both web and apn
	expectedUsersToReceiveNotification := make(map[common.Address]int)
	for _, wallet := range test.members[:10] {
		test.subscribeWebPush(ctx, wallet)
		test.subscribeApnPush(ctx, wallet)
		expectedUsersToReceiveNotification[wallet.Address] = 1
	}

	// user disables all notifications for this channel
	test.setSpaceChannelSetting(
		ctx, test.members[1], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	delete(expectedUsersToReceiveNotification, test.members[1].Address)

	// user disables all notification on the space level
	test.setSpaceSetting(
		ctx, test.members[2], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	delete(expectedUsersToReceiveNotification, test.members[2].Address)

	// user wants to receive notifications for all messages for this channel
	test.setSpaceChannelSetting(
		ctx, test.members[3], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
	expectedUsersToReceiveNotification[test.members[3].Address] = 1

	// user wants to receive notifications for all messages on the space level
	test.setSpaceSetting(
		ctx, test.members[4], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
	expectedUsersToReceiveNotification[test.members[4].Address] = 1

	// user wants to receive notifications for messages that are either a reply/reaction on his own messages
	// or when he is mentioned on the channel level. Because this is the default the space setting is overwritten
	// to no messages to ensure that the channel setting overwrites the space default.
	test.setSpaceSetting(ctx, test.members[5], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	test.setSpaceChannelSetting(
		ctx, test.members[5], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_ONLY_MENTIONS_REPLIES_REACTIONS)
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
	}, 5*time.Second, 100*time.Millisecond, "Received unexpected notifications")
}

func testSpaceChannelMentionTag(
	ctx context.Context,
	test *spaceChannelNotificationsTestContext,
	nc *notificationCapture,
) {
	// subscribe for notifications only on the first couple of wallets on both web and apn
	expectedUsersToReceiveNotification := make(map[common.Address]struct{})
	var mentionedUsers [][]byte

	for _, wallet := range test.members[:10] {
		test.subscribeWebPush(ctx, wallet)
		test.subscribeApnPush(ctx, wallet)
		expectedUsersToReceiveNotification[wallet.Address] = struct{}{}
		mentionedUsers = append(mentionedUsers, wallet.Address[:])
	}

	// user disables all notifications for this channel
	test.setSpaceChannelSetting(
		ctx, test.members[1], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	delete(expectedUsersToReceiveNotification, test.members[1].Address)

	// user disables all notification on the space level
	test.setSpaceSetting(
		ctx, test.members[2], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	delete(expectedUsersToReceiveNotification, test.members[2].Address)

	// user wants to receive notifications for all messages for this channel
	test.setSpaceChannelSetting(
		ctx, test.members[3], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
	expectedUsersToReceiveNotification[test.members[3].Address] = struct{}{}

	// user wants to receive notifications for all messages on the space level
	test.setSpaceSetting(
		ctx, test.members[4], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
	expectedUsersToReceiveNotification[test.members[4].Address] = struct{}{}

	// user wants to receive notifications for messages that are either a reply/reaction on his own messages
	// or when he is mentioned on the channel level. Because this is the default the space setting is overwritten
	// to no messages to ensure that the channel setting overwrites the space default.
	test.setSpaceSetting(ctx, test.members[5], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_NO_MESSAGES)
	test.setSpaceChannelSetting(
		ctx, test.members[5], SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL)
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

func initNotificationService(
	ctx context.Context,
	tester *serviceTester,
	notifier push.MessageNotifier,
) *Service {
	var key [32]byte
	_, err := rand.Read(key[:])
	tester.require.NoError(err)

	cfg := tester.getConfig()
	cfg.Notifications.Authentication.SessionToken.Key.Algorithm = "HS256"
	cfg.Notifications.Authentication.SessionToken.Key.Key = hex.EncodeToString(key[:])

	service, err := StartServerInNotificationMode(ctx, cfg, notifier, makeTestServerOpts(tester))
	tester.require.NoError(err)

	return service
}

func setupSpaceChannelNotificationTest(
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
	authClient protocolconnect.AuthenticationServiceClient,
) *spaceChannelNotificationsTestContext {
	testCtx := &spaceChannelNotificationsTestContext{
		req:                tester.require,
		streamClient:       tester.testClient(0),
		notificationClient: notificationClient,
		authClient:         authClient,
	}

	wallet, _ := crypto.NewWallet(ctx)
	testCtx.members = []*crypto.Wallet{wallet}

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
	_, err = rand.Read(channelID[21:])
	require.NoError(err)
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

	newMiniblockRef, err := makeMiniblock(ctx, client, testCtx.channelID, true, 0)
	require.NoError(err)
	require.Greater(newMiniblockRef.Num, int64(0))

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
	authClient                    protocolconnect.AuthenticationServiceClient
}

func setupDMNotificationTest(
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
	authClient protocolconnect.AuthenticationServiceClient,
) *dmChannelNotificationsTestContext {
	testCtx := &dmChannelNotificationsTestContext{
		req:                tester.require,
		streamClient:       tester.testClient(0),
		notificationClient: notificationClient,
		authClient:         authClient,
	}

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
	streamClient       protocolconnect.StreamServiceClient
	notificationClient protocolconnect.NotificationServiceClient
	authClient         protocolconnect.AuthenticationServiceClient
}

func setupGDMNotificationTest(
	ctx context.Context,
	tester *serviceTester,
	notificationClient protocolconnect.NotificationServiceClient,
	authClient protocolconnect.AuthenticationServiceClient,
) *gdmChannelNotificationsTestContext {
	testCtx := &gdmChannelNotificationsTestContext{
		req:                tester.require,
		streamClient:       tester.testClient(0),
		notificationClient: notificationClient,
		authClient:         authClient,
	}

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
	_, _, err = createGDMChannel(
		ctx,
		testCtx.members[0],
		testCtx.members[1:],
		testCtx.streamClient,
		testCtx.gdmStreamID,
		nil,
	)

	testCtx.req.NoError(err)

	return testCtx
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
		&MiniblockRef{
			Num:  resp.Msg.GetMiniblockNum(),
			Hash: common.BytesToHash(resp.Msg.GetHash()),
		},
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

func authorize[T any](
	ctx context.Context,
	req *require.Assertions,
	authClient protocolconnect.AuthenticationServiceClient,
	primaryWallet *crypto.Wallet,
	request *connect.Request[T],
) {
	resp, err := authClient.StartAuthentication(ctx, connect.NewRequest(&StartAuthenticationRequest{
		UserId: primaryWallet.Address[:],
	}))
	req.NoError(err)

	// create a delegate signature that grants a device to make the request on behalf
	// of the users primary wallet. This device key is generated on the fly.
	deviceWallet, err := crypto.NewWallet(ctx)
	req.NoError(err)

	devicePubKey := eth_crypto.FromECDSAPub(&deviceWallet.PrivateKeyStruct.PublicKey)

	delegateExpiryEpochMs := 1000 * (time.Now().Add(time.Hour).Unix())
	// create the delegate signature by signing it with the primary wallet
	hashSrc, err := crypto.RiverDelegateHashSrc(devicePubKey, delegateExpiryEpochMs)
	req.NoError(err)
	hash := accounts.TextHash(hashSrc)
	delegateSig, err := eth_crypto.Sign(hash, primaryWallet.PrivateKeyStruct)
	req.NoError(err)

	var (
		prefix     = "NS_AUTH:"
		nonce      = resp.Msg.GetChallenge()
		expiration = big.NewInt(resp.Msg.GetExpiration().GetSeconds())
		buf        bytes.Buffer
	)

	// sign the authentication request with the device key
	buf.WriteString(prefix)
	buf.Write(primaryWallet.Address.Bytes())
	buf.Write(expiration.Bytes())
	buf.Write(nonce)

	digest := sha256.Sum256(buf.Bytes())
	bufHash := accounts.TextHash(digest[:])

	signature, err := deviceWallet.SignHash(bufHash[:])
	req.NoError(err)

	resp2, err := authClient.FinishAuthentication(ctx, connect.NewRequest(&FinishAuthenticationRequest{
		UserId:                primaryWallet.Address[:],
		Challenge:             nonce,
		Signature:             signature,
		DelegateSig:           delegateSig,
		DelegateExpiryEpochMs: delegateExpiryEpochMs,
	}))

	req.NoError(err)

	request.Header().Set("authorization", resp2.Msg.GetSessionToken())
}

func (tc *gdmChannelNotificationsTestContext) setGlobalGDMSetting(
	ctx context.Context,
	user *crypto.Wallet,
	setting GdmChannelSettingValue,
) {
	req := connect.NewRequest(&SetDmGdmSettingsRequest{
		DmGlobal:  DmChannelSettingValue_DM_MESSAGES_YES,
		GdmGlobal: setting,
	})

	authorize(ctx, tc.req, tc.authClient, user, req)

	_, err := tc.notificationClient.SetDmGdmSettings(ctx, req)

	tc.req.NoError(err, "setGlobalGDMSetting failed")
}

func (tc *gdmChannelNotificationsTestContext) setGDMChannelSetting(
	ctx context.Context,
	user *crypto.Wallet,
	setting GdmChannelSettingValue,
) {
	request := connect.NewRequest(&SetGdmChannelSettingRequest{
		GdmChannelId: tc.gdmStreamID[:],
		Value:        setting,
	})

	authorize(ctx, tc.req, tc.authClient, user, request)

	_, err := tc.notificationClient.SetGdmChannelSetting(ctx, request)

	tc.req.NoError(err, "setGDMChannelSetting failed")
}

func (tc *gdmChannelNotificationsTestContext) subscribeWebPush(
	ctx context.Context,
	user *crypto.Wallet,
) {
	userID := user.Address

	h := sha256.New()
	h.Write(userID[:])
	p256Dh := hex.EncodeToString(h.Sum(nil))
	h.Write(userID[:])
	auth := hex.EncodeToString(h.Sum(nil))

	request := connect.NewRequest(&SubscribeWebPushRequest{
		Subscription: &WebPushSubscriptionObject{
			Endpoint: userID.String(), // (ab)used to determine who received a notification
			Keys: &WebPushSubscriptionObjectKeys{
				P256Dh: p256Dh,
				Auth:   auth,
			},
		},
	})

	authorize(ctx, tc.req, tc.authClient, user, request)

	_, err := tc.notificationClient.SubscribeWebPush(ctx, request)

	tc.req.NoError(err, "SubscribeWebPush failed")
}

func (tc *gdmChannelNotificationsTestContext) subscribeApnPush(
	ctx context.Context,
	user *crypto.Wallet,
) {
	request := connect.NewRequest(&SubscribeAPNRequest{
		DeviceToken: user.Address[:], // (ab)used to determine who received a notification
		Environment: APNEnvironment_APN_ENVIRONMENT_SANDBOX,
	})

	authorize(ctx, tc.req, tc.authClient, user, request)
	_, err := tc.notificationClient.SubscribeAPN(ctx, request)

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
		&MiniblockRef{
			Num:  resp.Msg.GetMiniblockNum(),
			Hash: common.BytesToHash(resp.Msg.GetHash()),
		},
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
		&MiniblockRef{
			Hash: common.BytesToHash(resp.Msg.GetHash()),
			Num:  resp.Msg.GetMiniblockNum(),
		},
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
	user *crypto.Wallet,
	setting DmChannelSettingValue,
) {
	request := connect.NewRequest(&SetDmChannelSettingRequest{
		DmChannelId: tc.dmStreamID[:],
		Value:       setting,
	})

	authorize(ctx, tc.req, tc.authClient, user, request)

	_, err := tc.notificationClient.SetDmChannelSetting(ctx, request)

	tc.req.NoError(err, "setChannel failed")
}

func (tc *dmChannelNotificationsTestContext) getSettings(
	ctx context.Context,
	user *crypto.Wallet,
) *GetSettingsResponse {
	request := connect.NewRequest(&GetSettingsRequest{})

	authorize(ctx, tc.req, tc.authClient, user, request)

	response, err := tc.notificationClient.GetSettings(ctx, request)
	tc.req.NoError(err, "getSettings failed")

	return response.Msg
}

func (tc *dmChannelNotificationsTestContext) muteGlobal(
	ctx context.Context,
	user *crypto.Wallet,
	setting DmChannelSettingValue,
) {
	request := connect.NewRequest(&SetDmGdmSettingsRequest{
		DmGlobal:  setting,
		GdmGlobal: GdmChannelSettingValue_GDM_UNSPECIFIED,
	})

	authorize(ctx, tc.req, tc.authClient, user, request)

	_, err := tc.notificationClient.SetDmGdmSettings(ctx, request)

	tc.req.NoError(err, "muteGlobal failed")
}

func (tc *dmChannelNotificationsTestContext) subscribeWebPush(
	ctx context.Context,
	user *crypto.Wallet,
) {
	userID := user.Address
	h := sha256.New()
	h.Write(userID[:])
	p256Dh := hex.EncodeToString(h.Sum(nil))
	h.Write(userID[:])
	auth := hex.EncodeToString(h.Sum(nil))

	request := connect.NewRequest(&SubscribeWebPushRequest{
		Subscription: &WebPushSubscriptionObject{
			Endpoint: userID.String(), // (ab)used to determine who received a notification
			Keys: &WebPushSubscriptionObjectKeys{
				P256Dh: p256Dh,
				Auth:   auth,
			},
		},
	})

	authorize(ctx, tc.req, tc.authClient, user, request)

	_, err := tc.notificationClient.SubscribeWebPush(ctx, request)

	tc.req.NoError(err, "SubscribeWebPush failed")
}

func (tc *dmChannelNotificationsTestContext) subscribeApnPush(
	ctx context.Context,
	user *crypto.Wallet,
) {
	request := connect.NewRequest(&SubscribeAPNRequest{
		DeviceToken: user.Address[:], // (ab)used to determine who received a notification
		Environment: APNEnvironment_APN_ENVIRONMENT_SANDBOX,
	})
	authorize(ctx, tc.req, tc.authClient, user, request)

	_, err := tc.notificationClient.SubscribeAPN(ctx, request)

	tc.req.NoError(err, "SubscribeAPN failed")
}

type spaceChannelNotificationsTestContext struct {
	req                *require.Assertions
	members            []*crypto.Wallet
	spaceID            StreamId
	channelID          StreamId
	streamClient       protocolconnect.StreamServiceClient
	notificationClient protocolconnect.NotificationServiceClient
	authClient         protocolconnect.AuthenticationServiceClient
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
		&MiniblockRef{
			Num:  resp.Msg.GetMiniblockNum(),
			Hash: common.BytesToHash(resp.Msg.GetHash()),
		},
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
	user *crypto.Wallet,
) {
	userID := user.Address

	h := sha256.New()
	h.Write(userID[:])
	p256Dh := hex.EncodeToString(h.Sum(nil))
	h.Write(userID[:])
	auth := hex.EncodeToString(h.Sum(nil))

	request := connect.NewRequest(&SubscribeWebPushRequest{
		Subscription: &WebPushSubscriptionObject{
			Endpoint: userID.String(), // (ab)used to determine who received a notification
			Keys: &WebPushSubscriptionObjectKeys{
				P256Dh: p256Dh,
				Auth:   auth,
			},
		},
	})

	authorize(ctx, tc.req, tc.authClient, user, request)
	_, err := tc.notificationClient.SubscribeWebPush(ctx, request)

	tc.req.NoError(err, "SubscribeWebPush failed")
}

func (tc *spaceChannelNotificationsTestContext) subscribeApnPush(
	ctx context.Context,
	user *crypto.Wallet,
) {
	request := connect.NewRequest(&SubscribeAPNRequest{
		DeviceToken: user.Address[:], // (ab)used to determine who received a notification
		Environment: APNEnvironment_APN_ENVIRONMENT_SANDBOX,
	})

	authorize(ctx, tc.req, tc.authClient, user, request)

	_, err := tc.notificationClient.SubscribeAPN(ctx, request)

	tc.req.NoError(err, "SubscribeAPN failed")
}

func (tc *spaceChannelNotificationsTestContext) setSpaceChannelSetting(
	ctx context.Context,
	user *crypto.Wallet,
	setting SpaceChannelSettingValue,
) {
	request := connect.NewRequest(&SetSpaceChannelSettingsRequest{
		ChannelId: tc.channelID[:],
		SpaceId:   tc.spaceID[:],
		Value:     setting,
	})

	authorize(ctx, tc.req, tc.authClient, user, request)

	_, err := tc.notificationClient.SetSpaceChannelSettings(ctx, request)

	tc.req.NoError(err, "SetChannelSettings failed")
}

func (tc *spaceChannelNotificationsTestContext) setSpaceSetting(
	ctx context.Context,
	user *crypto.Wallet,
	setting SpaceChannelSettingValue,
) {
	request := connect.NewRequest(&SetSpaceSettingsRequest{
		SpaceId: tc.spaceID[:],
		Value:   setting,
	})

	authorize(ctx, tc.req, tc.authClient, user, request)

	_, err := tc.notificationClient.SetSpaceSettings(ctx, request)

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
) (bool, error) {
	nc.WebPushNotificationsMu.Lock()
	defer nc.WebPushNotificationsMu.Unlock()

	events, found := nc.WebPushNotifications[eventHash]
	if !found {
		events = make(map[common.Address]int)
	}

	// for testing purposes the users address is included in the endpoint
	events[common.HexToAddress(subscription.Endpoint)]++
	nc.WebPushNotifications[eventHash] = events

	return false, nil
}

func (nc *notificationCapture) SendApplePushNotification(
	_ context.Context,
	sub *types.APNPushSubscription,
	eventHash common.Hash,
	_ *payload2.Payload,
) (bool, error) {
	nc.ApnPushNotificationsMu.Lock()
	defer nc.ApnPushNotificationsMu.Unlock()

	events, found := nc.ApnPushNotifications[eventHash]
	if !found {
		events = make(map[common.Address]int)
	}

	// for test purposes the users address is the device token
	events[common.BytesToAddress(sub.DeviceToken)]++
	nc.ApnPushNotifications[eventHash] = events

	return false, nil
}

type notificationExpired struct{}

func (notificationExpired) SendWebPushNotification(
	_ context.Context,
	_ *webpush.Subscription,
	_ common.Hash,
	_ []byte,
) (bool, error) {
	return true, fmt.Errorf("subscription expired")
}

func (notificationExpired) SendApplePushNotification(
	_ context.Context,
	_ *types.APNPushSubscription,
	_ common.Hash,
	_ *payload2.Payload,
) (bool, error) {
	return true, fmt.Errorf("subscription expired")
}

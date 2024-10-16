package notifications_test

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/base/test"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/notifications/types"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
	"github.com/river-build/river/core/node/testutils/dbtestutils"
	"github.com/stretchr/testify/require"
)

func prepareNotificationsDB(ctx context.Context) (*storage.PostgresNotificationStore, func()) {
	dbCfg, dbSchemaName, dbCloser, err := dbtestutils.ConfigureDB(ctx)
	if err != nil {
		panic(err)
	}

	dbCfg.StartupDelay = 2 * time.Millisecond
	dbCfg.Extra = strings.Replace(dbCfg.Extra, "pool_max_conns=1000", "pool_max_conns=10", 1)

	pool, err := storage.CreateAndValidatePgxPool(
		ctx,
		dbCfg,
		dbSchemaName,
		nil,
	)
	if err != nil {
		panic(err)
	}

	instanceId := base.GenShortNanoid()
	exitSignal := make(chan error, 1)
	store, err := storage.NewPostgresNotificationStore(
		ctx,
		pool,
		instanceId,
		exitSignal,
		infra.NewMetricsFactory(nil, "", ""),
	)
	if err != nil {
		panic(err)
	}

	return store, dbCloser
}

func TestUserPreferencesStore(t *testing.T) {
	var (
		req            = require.New(t)
		ctx, ctxCloser = test.NewTestContext()
	)
	defer ctxCloser()

	store, dbCloser := prepareNotificationsDB(ctx)
	defer dbCloser()

	t.Parallel()

	t.Run("userPreferencesNotFound", func(t *testing.T) {
		userPreferencesNotFound(req, ctx, store)
	})
	t.Run("setAndRetrieveUserPreferences", func(t *testing.T) {
		setAndRetrieveUserPreferences(req, ctx, store)
	})
	t.Run("subscribeWebPush", func(t *testing.T) {
		subscribeWebPush(req, ctx, store)
	})
}

func userPreferencesNotFound(req *require.Assertions, ctx context.Context, store *storage.PostgresNotificationStore) {
	_, err := store.GetUserPreferences(ctx, common.Address{})

	var riverErr *base.RiverErrorImpl
	if errors.As(err, &riverErr) {
		req.Equal(protocol.Err_NOT_FOUND, riverErr.Code, fmt.Sprintf("Unexpected error %v", err))
	} else {
		req.Fail("Expected NOT_FOUND")
	}
}

func setAndRetrieveUserPreferences(req *require.Assertions, ctx context.Context, store *storage.PostgresNotificationStore) {
	wallet, err := crypto.NewWallet(ctx)
	req.NoError(err)

	expected := &types.UserPreferences{
		UserID:      wallet.Address,
		DM:          protocol.DmChannelSettingValue_DM_MESSAGES_NO,
		GDM:         protocol.GdmChannelSettingValue_GDM_ONLY_MENTIONS_REPLIES_REACTIONS,
		Spaces:      make(types.SpacesMap),
		DMChannels:  make(types.DMChannelsMap),
		GDMChannels: make(types.GDMChannelsMap),
		Subscriptions: types.Subscriptions{
			WebPush: []*webpush.Subscription{
				{
					Endpoint: "https://test.test.1",
					Keys: webpush.Keys{
						Auth:   "test.auth.1",
						P256dh: "p256dh.test.1",
					},
				},
				{
					Endpoint: "https://test.test.2",
					Keys: webpush.Keys{
						Auth:   "test.auth.2",
						P256dh: "p256dh.test.2",
					},
				},
			},
			APNSubscriptionDeviceTokens: [][]byte{
				{0, 0},
				{1, 1},
			},
		},
	}

	for i := 0; i < 500; i++ {
		var spaceID shared.StreamId
		spaceID[0] = shared.STREAM_SPACE_BIN
		_, err = rand.Read(spaceID[1:21])
		req.NoError(err)

		space := &types.SpacePreferences{
			Setting:  protocol.SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_ONLY_MENTIONS_REPLIES_REACTIONS,
			Channels: make(map[shared.StreamId]protocol.SpaceChannelSettingValue),
		}

		for c := 0; c < 150; c++ {
			var channelID shared.StreamId
			switch c % 3 {
			case 0:
				channelID[0] = shared.STREAM_DM_CHANNEL_BIN
				_, err = rand.Read(channelID[1:])
				req.NoError(err)
				expected.DMChannels[channelID] = protocol.DmChannelSettingValue_DM_MESSAGES_YES
			case 1:
				channelID[0] = shared.STREAM_GDM_CHANNEL_BIN
				_, err = rand.Read(channelID[1:])
				req.NoError(err)
				expected.GDMChannels[channelID] = protocol.GdmChannelSettingValue_GDM_MESSAGES_ALL
			case 2:
				channelID[0] = shared.STREAM_CHANNEL_BIN
				_, err = rand.Read(channelID[1:])
				req.NoError(err)
				space.Channels[channelID] = protocol.SpaceChannelSettingValue_SPACE_CHANNEL_SETTING_MESSAGES_ALL
			}
		}

		expected.Spaces[spaceID] = space
	}

	req.NoError(store.SetUserPreferences(ctx, expected))
	for _, webSub := range expected.Subscriptions.WebPush {
		req.NoError(store.AddWebPushSubscription(ctx, expected.UserID, webSub))
	}
	for _, deviceToken := range expected.Subscriptions.APNSubscriptionDeviceTokens {
		req.NoError(store.AddAPNSubscription(ctx, expected.UserID, deviceToken))
	}

	got, err := store.GetUserPreferences(ctx, expected.UserID)
	req.NoError(err)

	req.Equal(expected, got)
}

func subscribeWebPush(req *require.Assertions, ctx context.Context, store *storage.PostgresNotificationStore) {
	wallet, err := crypto.NewWallet(ctx)
	req.NoError(err)

	exp1 := webpush.Subscription{
		Endpoint: fmt.Sprintf("https://%s.local.1", wallet.Address),
		Keys: webpush.Keys{
			Auth:   "test.auth.1",
			P256dh: "p256dh.test.1",
		},
	}

	exp2 := webpush.Subscription{
		Endpoint: fmt.Sprintf("https://%s.local.2", wallet.Address),
		Keys: webpush.Keys{
			Auth:   "test.auth.2",
			P256dh: "p256dh.test.2",
		},
	}

	err = store.AddWebPushSubscription(ctx, wallet.Address, &exp1)
	req.NoError(err)
	err = store.AddWebPushSubscription(ctx, wallet.Address, &exp2)
	req.NoError(err)

	got, err := store.GetWebPushSubscriptions(ctx, wallet.Address)
	req.NoError(err)

	req.Equal(2, len(got))
	if exp1.Endpoint == got[0].Endpoint {
		req.Equal(exp1, *got[0])
	} else {
		req.Equal(exp1, *got[1])
	}
	if exp2.Endpoint == got[0].Endpoint {
		req.Equal(exp2, *got[0])
	} else {
		req.Equal(exp2, *got[1])
	}
}

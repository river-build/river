package notifications

import (
	"bytes"
	"context"
	"errors"
	"sync"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/ethereum/go-ethereum/common"
	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
	"google.golang.org/protobuf/proto"
)

type (
	UserPreferencesStore interface {
		storage.NotificationStore

		GetUserPreference(
			ctx context.Context,
			userID common.Address,
		) (*UserPreference, error)

		BlockUser(
			ctx context.Context,
			userID common.Address,
			user common.Address,
		) error

		UnblockUser(
			ctx context.Context,
			userID common.Address,
			user common.Address,
		) error

		UpdateSpaceSetting(
			ctx context.Context,
			userID common.Address,
			spaceID shared.StreamId,
			value SpaceNotificationSettingValue,
		) error

		UpdateChannelSetting(
			ctx context.Context,
			userID common.Address,
			spaceID *shared.StreamId,
			channelID shared.StreamId,
			value ChannelSettingValue,
		) error
	}

	// UserPreferencesCachedStore provides access to notification related preferences a user has set.
	// It implements storage.NotificationStore and wraps a persistent datastore and build up an in-memory cache
	// for fast retrieval. It uses a lazy-loading strategy where preferences are only retrieved from persistent
	// userPreferences when needed. Because reads are likely to happen much more frequently than writes it uses copy on write
	// allowing for parallel reads.
	UserPreferencesCachedStore struct {
		persistent storage.NotificationStore
		// preferences stores an in-memory cache of user preferences
		// mapping from userID (common.Address) -> *UserPreference
		preferences sync.Map
	}

	// UserPreference are all user preferences and web/APN subscriptions a user has configured.
	UserPreference struct {
		UserID                      common.Address
		Settings                    *Settings
		BlockedUsers                []common.Address
		WebPushSubscriptions        []*webpush.Subscription
		APNSubscriptionDeviceTokens [][]byte
	}
)

// defaultSettings instantiates a preferences objects with default values
func defaultSettings(userID common.Address) *Settings {
	return &Settings{
		UserId: userID[:],
	}
}

// NewUserPreferencesCachedStore instantiates a new UserPreferencesCachedStore instance.
// UserPreferencesCachedStore implements UserPreferencesStore.
func NewUserPreferencesCachedStore(persistent storage.NotificationStore) *UserPreferencesCachedStore {
	return &UserPreferencesCachedStore{persistent: persistent}
}

func (up *UserPreferencesCachedStore) GetUserPreference(
	ctx context.Context,
	userID common.Address,
) (*UserPreference, error) {
	cached, found := up.preferences.Load(userID)
	if found {
		return cached.(*UserPreference), nil
	}

	// lazy-load
	settings, err := up.GetSettings(ctx, userID)
	if err != nil {
		return nil, err
	}

	webPushSubs, err := up.persistent.GetWebPushSubscriptions(ctx, userID)
	if err != nil {
		return nil, err
	}

	apnPushSubs, err := up.persistent.GetAPNSubscriptions(ctx, userID)
	if err != nil {
		return nil, err
	}

	preference := &UserPreference{
		UserID:                      userID,
		Settings:                    settings,
		WebPushSubscriptions:        webPushSubs,
		APNSubscriptionDeviceTokens: apnPushSubs,
	}

	cached, _ = up.preferences.LoadOrStore(userID, preference)

	return cached.(*UserPreference), nil
}

func (up *UserPreferencesCachedStore) SetSettings(
	ctx context.Context,
	userID common.Address,
	settings *Settings,
) error {
	err := up.persistent.SetSettings(ctx, userID, settings)
	if err == nil {
		// this will force a reload when preferences are requested for userID
		up.preferences.Delete(userID)
	}

	return err
}

func (up *UserPreferencesCachedStore) GetSettings(
	ctx context.Context,
	userID common.Address,
) (*Settings, error) {
	if cs, ok := up.preferences.Load(userID); ok {
		return cs.(*UserPreference).Settings, nil
	}

	settings, err := up.persistent.GetSettings(ctx, userID)
	if err != nil {
		// if there are no preferences use default
		var riverErr *RiverErrorImpl
		if errors.As(err, &riverErr) {
			if riverErr.Code == Err_NOT_FOUND {
				webPushSubs, err := up.persistent.GetWebPushSubscriptions(ctx, userID)
				if err != nil {
					return nil, err
				}

				apnPushSubs, err := up.persistent.GetAPNSubscriptions(ctx, userID)
				if err != nil {
					return nil, err
				}

				preference := &UserPreference{
					UserID:                      userID,
					Settings:                    defaultSettings(userID),
					WebPushSubscriptions:        webPushSubs,
					APNSubscriptionDeviceTokens: apnPushSubs,
				}

				up.preferences.Store(userID, preference)
				settings = preference.Settings
			} else {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	return settings, nil
}

func (up *UserPreferencesCachedStore) UpdateSpaceSetting(
	ctx context.Context,
	userID common.Address,
	spaceID shared.StreamId,
	value SpaceNotificationSettingValue,
) error {
	settings, err := up.GetSettings(ctx, userID)
	if err != nil {
		return err
	}

	// copy on write
	settings, err = cloneSettings(settings)
	if err != nil {
		return err
	}

	// update space setting, or append when it's a space without existing preferences
	for _, space := range settings.GetSpace() {
		if bytes.Equal(space.GetSpaceId(), spaceID[:]) {
			space.Value = value
			return up.SetSettings(ctx, userID, settings)
		}
	}

	// space not found, create new space setting entry
	settings.Space = append(settings.GetSpace(), &SpaceSetting{
		SpaceId:  spaceID[:],
		Value:    value,
		Channels: nil,
	})

	return up.SetSettings(ctx, userID, settings)
}

func (up *UserPreferencesCachedStore) UpdateChannelSetting(
	ctx context.Context,
	userID common.Address,
	spaceID *shared.StreamId,
	channelID shared.StreamId,
	value ChannelSettingValue,
) error {
	settings, err := up.GetSettings(ctx, userID)
	if err != nil {
		return err
	}

	// copy on write
	settings, err = cloneSettings(settings)
	if err != nil {
		return err
	}

	typ := channelID.Type()

	if spaceID == nil {
		// channel must be a DM or GDM stream
		if typ == shared.STREAM_DM_CHANNEL_BIN || typ == shared.STREAM_GDM_CHANNEL_BIN {
			for _, channel := range settings.GetDmGdmChannels() {
				if bytes.Equal(channel.GetChannelId(), channelID[:]) {
					channel.Value = value
					return up.SetSettings(ctx, userID, settings)
				}
				settings.DmGdmChannels = append(settings.DmGdmChannels, &ChannelSetting{})
			}
			return nil
		}
		return RiverError(Err_INVALID_ARGUMENT, "SpaceId missing when updating a DM or GDM channel")
	}

	// channel must be a Channel
	if typ != shared.STREAM_CHANNEL_BIN {
		return RiverError(Err_INVALID_ARGUMENT, "Unsupported channel type")
	}

	// find space, if already configured update stream settings within that space
	for _, sp := range settings.GetSpace() {
		if bytes.Equal(sp.GetSpaceId(), spaceID[:]) {
			channelFound := false
			for _, chn := range sp.GetChannels() {
				if bytes.Equal(chn.GetChannelId(), channelID[:]) {
					channelFound = true
					chn.Value = value
				}
			}

			if !channelFound { // space found but specific channel config not, add it
				sp.Channels = append(sp.Channels, &ChannelSetting{
					ChannelId: channelID[:],
					Value:     value,
				})
			}

			return up.SetSettings(ctx, userID, settings)
		}
	}

	// space not found, add it with default space settings and the given channel
	settings.Space = append(settings.GetSpace(), &SpaceSetting{
		SpaceId: spaceID[:],
		Value:   SpaceNotificationSettingValue_SPACE_ONLY_MENTIONS_REPLIES_REACTIONS,
		Channels: []*ChannelSetting{
			{
				ChannelId: channelID[:],
				Value:     value,
			},
		},
	})

	return nil
}

func (up *UserPreferencesCachedStore) BlockUser(
	ctx context.Context,
	user common.Address,
	blockedUser common.Address,
) error {
	settings, err := up.GetSettings(ctx, user)
	if err != nil {
		return err
	}

	settings, err = cloneSettings(settings)
	if err != nil {
		return err
	}

	//for _, user := range settings. {
	//	if bytes.Equal(user, blockedUser[:]) {
	//		return nil // already blocked
	//	}
	//}
	//
	//settings.GetUser().BlockedUsers = append(settings.GetUser().BlockedUsers, blockedUser[:])

	return up.SetSettings(ctx, user, settings)
}

func (up *UserPreferencesCachedStore) GetWebPushSubscriptions(
	ctx context.Context,
	userID common.Address,
) ([]*webpush.Subscription, error) {
	pref, err := up.GetUserPreference(ctx, userID)
	if err != nil {
		return nil, err
	}

	return pref.WebPushSubscriptions, nil
}

func (up *UserPreferencesCachedStore) GetAPNSubscriptions(
	ctx context.Context,
	userID common.Address,
) ([][]byte, error) {
	pref, err := up.GetUserPreference(ctx, userID)
	if err != nil {
		return nil, err
	}

	return pref.APNSubscriptionDeviceTokens, nil
}

func (up *UserPreferencesCachedStore) UnblockUser(
	ctx context.Context,
	userID common.Address,
	user common.Address,
) error {
	settings, err := up.GetSettings(ctx, userID)
	if err != nil {
		return err
	}

	settings, err = cloneSettings(settings)
	if err != nil {
		return err
	}

	removed := false
	//slices.DeleteFunc(settings.GetUser().GetBlockedUsers(), func(blocked []byte) bool {
	//	removed = bytes.Equal(user[:], blocked)
	//	return removed
	//})

	if removed {
		return up.SetSettings(ctx, userID, settings)
	}

	return nil // user was not blocked
}

// AddWebPushSubscription does an upsert for the given userID and webPushSubscription.
// This is an upsert because a browser can be shared among multiple users and the active userID needs to
// be correlated with the web push sub.
func (up *UserPreferencesCachedStore) AddWebPushSubscription(
	ctx context.Context,
	userID common.Address,
	webPushSubscription *webpush.Subscription,
) error {
	err := up.persistent.AddWebPushSubscription(ctx, userID, webPushSubscription)
	if err == nil {
		// force reload next time user preferences are requested
		up.preferences.Delete(userID)
	}

	return err
}

// RemoveWebPushSubscription deletes a web push subscription.
func (up *UserPreferencesCachedStore) RemoveWebPushSubscription(
	ctx context.Context,
	userID common.Address,
	webPushSubscription *webpush.Subscription,
) error {
	err := up.persistent.RemoveWebPushSubscription(ctx, userID, webPushSubscription)
	if err == nil {
		// force reload next time user preferences are requested
		up.preferences.Delete(userID)
	}

	return err
}

func (up *UserPreferencesCachedStore) AddAPNSubscription(
	ctx context.Context,
	deviceToken []byte,
	userID common.Address,
) error {
	err := up.persistent.AddAPNSubscription(ctx, deviceToken, userID)
	if err == nil {
		// force reload next time user preferences are requested
		up.preferences.Delete(userID)
	}

	return err
}

func (up *UserPreferencesCachedStore) RemoveAPNSubscription(
	ctx context.Context,
	deviceToken []byte,
	userID common.Address,
) error {
	err := up.persistent.RemoveAPNSubscription(ctx, deviceToken, userID)
	if err == nil {
		// force reload next time user preferences are requested
		up.preferences.Delete(userID)
	}

	return err
}

func (up *UserPreference) IsUserBlocked(user common.Address) bool {
	//for _, blockedUser := range up.Settings.GetUser().GetBlockedUsers() {
	//	if bytes.Equal(user[:], blockedUser) {
	//		return true
	//	}
	//}
	return false
}

// HasSubscription returns an indication if the user has 1 or more subscriptions enabled
func (up *UserPreference) HasSubscription() bool {
	return len(up.WebPushSubscriptions) > 0 || len(up.APNSubscriptionDeviceTokens) > 0
}

func (up *UserPreference) IsChannelMuted(streamID shared.StreamId) bool {
	for _, channel := range up.Settings.GetDmGdmChannels() {
		if bytes.Equal(channel.GetChannelId(), streamID[:]) {
			return channel.GetValue() == ChannelSettingValue_CHANNEL_SETTING_VALUE_MUTED
		}
	}
	return false
}

func cloneSettings(settings *Settings) (*Settings, error) {
	buf, err := proto.Marshal(settings)
	if err != nil {
		return nil, AsRiverError(err, Err_INTERNAL).
			Message("Unable to marshal Settings").Func("cloneSettings")
	}

	var cpy Settings
	if err := proto.Unmarshal(buf, &cpy); err != nil {
		return nil, AsRiverError(err, Err_INTERNAL).
			Message("Unable to unmarshal Settings").Func("cloneSettings")
	}

	return &cpy, nil
}

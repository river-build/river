package notifications

import (
	"context"
	"errors"
	"sync"

	"github.com/SherClockHolmes/webpush-go"
	mapset "github.com/deckarep/golang-set/v2"
	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/notifications/types"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
)

type (
	// UserPreferencesStore extends the storage.NotificationStore that keeps data in persistent store with
	// operations that use in memory data.
	UserPreferencesStore interface {
		storage.NotificationStore

		BlockUser(
			userID common.Address,
			user common.Address,
		)

		UnblockUser(
			userID common.Address,
			user common.Address,
		)

		IsBlocked(
			userID common.Address,
			user common.Address,
		) bool
	}

	// UserPreferencesCache provides access to notification related userPreferencesCache a user has set.
	// It implements storage.NotificationStore and wraps a persistent datastore and build up an in-memory userPreferencesCache
	// for fast retrieval. It uses a lazy-loading strategy where userPreferencesCache are only retrieved from persistent
	// userPreferences when needed. Because reads are likely to happen much more frequently than writes it uses copy on write
	// allowing for parallel reads.
	UserPreferencesCache struct {
		persistent storage.NotificationStore
		// userPreferencesCache stores an in-memory userPreferencesCache of user userPreferencesCache
		// mapping from userID (common.Address) -> *types.UserPreferences
		userPreferencesCache sync.Map
		// blockedUsersCache keeps track of the list of users someone has blocked
		// mapping from userID -> *blockedUserList
		blockedUsersCache sync.Map
	}

	blockedUserList struct {
		mu    sync.RWMutex
		users mapset.Set[common.Address]
	}
)

var _ UserPreferencesStore = (*UserPreferencesCache)(nil)

// NewUserPreferencesCache instantiates a new UserPreferencesCachedStore instance.
// UserPreferencesCachedStore implements UserPreferencesStore.
func NewUserPreferencesCache(persistent storage.NotificationStore) *UserPreferencesCache {
	return &UserPreferencesCache{persistent: persistent}
}

func (up *UserPreferencesCache) GetUserPreferences(
	ctx context.Context,
	userID common.Address,
) (*types.UserPreferences, error) {
	cached, found := up.userPreferencesCache.Load(userID)
	if found {
		return cached.(*types.UserPreferences), nil
	}

	preferences, err := up.persistent.GetUserPreferences(ctx, userID)
	if err != nil {
		var riverErr *base.RiverErrorImpl
		if errors.As(err, &riverErr) && riverErr.Code == Err_NOT_FOUND {
			// load default user preferences config
			return up.def(userID), nil
		}

		return nil, err
	}

	up.userPreferencesCache.Store(userID, preferences)

	return preferences, nil
}

func (up *UserPreferencesCache) def(userID common.Address) *types.UserPreferences {
	return &types.UserPreferences{
		UserID:      userID,
		DM:          DmChannelSettingValue_DM_MESSAGES_YES,
		GDM:         GdmChannelSettingValue_GDM_ONLY_MENTIONS_REPLIES_REACTIONS,
		Spaces:      make(types.SpacesMap),
		DMChannels:  make(types.DMChannelsMap),
		GDMChannels: make(types.GDMChannelsMap),
	}
}

func (up *UserPreferencesCache) SetUserPreferences(
	ctx context.Context,
	preferences *types.UserPreferences,
) error {
	if err := up.persistent.SetUserPreferences(ctx, preferences); err != nil {
		return err
	}

	// force a reload next time user preferences are requested
	up.userPreferencesCache.Delete(preferences.UserID)

	return nil
}

func (up *UserPreferencesCache) SetGlobalDmGdm(
	ctx context.Context,
	userID common.Address,
	dm DmChannelSettingValue,
	gdm GdmChannelSettingValue,
) error {
	if err := up.persistent.SetGlobalDmGdm(ctx, userID, dm, gdm); err != nil {
		return err
	}

	// force a reload next time user preferences are requested
	up.userPreferencesCache.Delete(userID)

	return nil
}

func (up *UserPreferencesCache) SetSpaceSettings(
	ctx context.Context,
	userID common.Address,
	spaceID shared.StreamId,
	value SpaceChannelSettingValue,
) error {
	if err := up.persistent.SetSpaceSettings(ctx, userID, spaceID, value); err != nil {
		return err
	}

	// force a reload next time user preferences are requested
	up.userPreferencesCache.Delete(userID)

	return nil
}

func (up *UserPreferencesCache) SetChannelSetting(
	ctx context.Context,
	userID common.Address,
	spaceID *shared.StreamId,
	channelID shared.StreamId,
	value SpaceChannelSettingValue,
) error {
	// space id is required for streams that are part of a space
	if channelID.Type() == shared.STREAM_CHANNEL_BIN && (spaceID == nil || spaceID.Type() != shared.STREAM_SPACE_BIN) {
		return base.WrapRiverError(Err_INVALID_ARGUMENT, errors.New("missing or invalid space id")).
			Func("SetChannelSettings")
	}

	if err := up.persistent.SetChannelSetting(ctx, userID, spaceID, channelID, value); err != nil {
		return err
	}

	// force a reload next time user preferences are requested
	up.userPreferencesCache.Delete(userID)

	return nil
}

func (up *UserPreferencesCache) BlockUser(userID common.Address, user common.Address) {
	ms := &blockedUserList{
		mu:    sync.RWMutex{},
		users: mapset.NewSet[common.Address](),
	}

	cache, _ := up.blockedUsersCache.LoadOrStore(userID, ms)

	list := cache.(*blockedUserList)
	list.mu.Lock()
	list.users.Add(user)
	list.mu.Unlock()
}

func (up *UserPreferencesCache) UnblockUser(userID common.Address, user common.Address) {
	ms := &blockedUserList{
		mu:    sync.RWMutex{},
		users: mapset.NewSet[common.Address](),
	}

	cache, _ := up.blockedUsersCache.LoadOrStore(userID, ms)

	list := cache.(*blockedUserList)
	list.mu.Lock()
	list.users.Remove(user)
	list.mu.Unlock()
}

func (up *UserPreferencesCache) IsBlocked(userID common.Address, user common.Address) bool {
	cache, found := up.blockedUsersCache.Load(userID)
	if !found {
		return false
	}

	list := cache.(*blockedUserList)
	list.mu.Lock()
	blocked := list.users.Contains(user)
	list.mu.Unlock()

	return blocked
}

func (up *UserPreferencesCache) GetWebPushSubscriptions(
	ctx context.Context,
	userID common.Address,
) ([]*webpush.Subscription, error) {
	pref, err := up.GetUserPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	return pref.Subscriptions.WebPush, nil
}

// AddWebPushSubscription does an upsert for the given userID and webPushSubscription.
// This is an upsert because a browser can be shared among multiple users and the active userID needs to
// be correlated with the web push sub.
func (up *UserPreferencesCache) AddWebPushSubscription(
	ctx context.Context,
	userID common.Address,
	webPushSubscription *webpush.Subscription,
) error {
	err := up.persistent.AddWebPushSubscription(ctx, userID, webPushSubscription)
	if err != nil {
		return err
	}

	// force reload next time user userPreferencesCache are requested
	up.userPreferencesCache.Delete(userID)

	return nil
}

// RemoveWebPushSubscription deleted a web push subscription.
func (up *UserPreferencesCache) RemoveWebPushSubscription(
	ctx context.Context,
	userID common.Address,
	webPushSubscription *webpush.Subscription,
) error {
	err := up.persistent.RemoveWebPushSubscription(ctx, userID, webPushSubscription)
	if err != nil {
		return err
	}

	// force reload next time user userPreferencesCache are requested
	up.userPreferencesCache.Delete(userID)

	return nil
}

func (up *UserPreferencesCache) GetAPNSubscriptions(
	ctx context.Context,
	userID common.Address,
) ([][]byte, error) {
	pref, err := up.GetUserPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	return pref.Subscriptions.APNSubscriptionDeviceTokens, nil
}

func (up *UserPreferencesCache) AddAPNSubscription(
	ctx context.Context,
	userID common.Address,
	deviceToken []byte,
) error {
	err := up.persistent.AddAPNSubscription(ctx, userID, deviceToken)
	if err != nil {
		return err
	}

	// force reload next time user userPreferencesCache are requested
	up.userPreferencesCache.Delete(userID)

	return err
}

func (up *UserPreferencesCache) RemoveAPNSubscription(ctx context.Context,
	deviceToken []byte,
	userID common.Address,
) error {
	err := up.persistent.RemoveAPNSubscription(ctx, deviceToken, userID)
	if err != nil {
		return err
	}

	// force reload next time user userPreferencesCache are requested
	up.userPreferencesCache.Delete(userID)

	return err
}

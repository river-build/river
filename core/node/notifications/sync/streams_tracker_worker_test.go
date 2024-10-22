package sync_test

import (
	"github.com/stretchr/testify/require"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/base/test"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/notifications"
	"github.com/river-build/river/core/node/notifications/push"
	"github.com/river-build/river/core/node/notifications/sync"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	"github.com/river-build/river/core/node/storage"
)

func TestNotifications(t *testing.T) {
	t.Parallel()

	require := require.New(t)

	ctx, ctxCloser := test.NewTestContext()
	defer ctxCloser()

	tc, err := crypto.NewBlockchainTestContext(ctx, crypto.TestParams{NumKeys: 1})
	require.NoError(err)
	defer tc.Close()

	registryContract, err := registries.NewRiverRegistryContract(
		ctx, tc.DeployerBlockchain, &config.ContractConfig{Address: tc.RiverRegistryAddress})
	require.NoError(err)

	nodeRegistry, err := nodes.LoadNodeRegistry(
		ctx,
		registryContract,
		common.Address{},
		tc.DeployerBlockchain.InitialBlockNum,
		tc.DeployerBlockchain.ChainMonitor,
		nil,
	)
	require.NoError(err)

	persistent := storage.NewTestNotificationStore(ctx)
	defer persistent.Close()

	cache := notifications.NewUserPreferencesCache(persistent.Storage)
	notifier := push.NewMessageNotificationsSimulator()
	proc := notifications.NewNotificationMessageProcessor(ctx, cache, config.NotificationsConfig{
		Workers:                        5,
		SubscriptionExpirationDuration: time.Minute,
		Simulate:                       true,
	}, notifier)

	worker, err := sync.NewStreamsTrackerWorker(
		ctx,
		1234,
		tc.OnChainConfig,
		registryContract,
		nodeRegistry,
		nil,
		proc,
		cache,
		nil,
	)

	require.NoError(err)

	worker.Send(&protocol.SyncStreamsResponse{
		SyncId: "TEST_SYNC",
		SyncOp: protocol.SyncOp_SYNC_UPDATE,
		Stream: &protocol.StreamAndCookie{
			Events: nil,
			NextSyncCookie: &protocol.SyncCookie{
				NodeAddress:       []byte{0},
				StreamId:          []byte{0},
				MinipoolGen:       1,
				MinipoolSlot:      1,
				PrevMiniblockHash: []byte{0},
			},
			SyncReset: false,
		},
	})
}

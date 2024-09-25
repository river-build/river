package sync_test

import (
	"context"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/notifications/push"
	"github.com/river-build/river/core/node/notifications/sync"
	"github.com/river-build/river/core/node/registries"
	"github.com/stretchr/testify/require"
)

func TestStreamsTracker(t *testing.T) {
	req := require.New(t)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	//riverChainCfg := &config.ChainConfig{
	//	NetworkUrl:  "https://testnet.rpc.river.build/http",
	//	ChainId:     6524490,
	//	BlockTimeMs: 2000,
	//}

	riverChainCfg := &config.ChainConfig{
		NetworkUrl:  "https://mainnet.rpc.river.build/http",
		ChainId:     550,
		BlockTimeMs: 2000,
	}

	riverChain, err := crypto.NewBlockchain(ctx, riverChainCfg, nil, nil, nil)
	req.NoError(err)

	//riverRegistryCfg := &config.ContractConfig{Address: common.HexToAddress("0xf18E98D36A6bd1aDb52F776aCc191E69B491c070")}
	riverRegistryCfg := &config.ContractConfig{Address: common.HexToAddress("0x1298c03Fde548dc433a452573E36A713b38A0404")}
	riverRegistryContract, err := registries.NewRiverRegistryContract(ctx, riverChain, riverRegistryCfg)
	req.NoError(err)

	chainMonitor := crypto.NewChainMonitor()

	onChainConfig, err := crypto.NewOnChainConfig(
		ctx,
		riverChain.Client,
		common.HexToAddress("0x1298c03Fde548dc433a452573E36A713b38A0404"),
		riverChain.InitialBlockNum,
		chainMonitor,
	)
	req.NoError(err)

	nodeRegistry, err := nodes.LoadNodeRegistry(
		ctx, riverRegistryContract, common.Address{}, riverChain.InitialBlockNum, chainMonitor, nil)
	req.NoError(err)

	notifier := push.NewMessageNotificationsSimulator()

	workersCount := uint(25) // use default
	tracker, err := sync.NewStreamsTracker(ctx, onChainConfig, workersCount, riverRegistryContract, nodeRegistry, notifier)
	req.NoError(err)

	riverRegistryContract.OnStreamEvent(
		ctx,
		riverChain.InitialBlockNum,
		tracker.StreamAllocated,
		tracker.StreamLastMiniblockUpdated,
		tracker.StreamPlacementUpdated,
	)

	metrics := infra.NewMetricsFactory(nil, "tests", "streamstracker")
	go chainMonitor.RunWithBlockPeriod(
		ctx,
		riverChain.Client,
		riverChain.InitialBlockNum,
		time.Duration(riverChainCfg.BlockTimeMs)*time.Millisecond,
		metrics,
	)

	tracker.Run(ctx)
}

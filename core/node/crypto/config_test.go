package crypto

import (
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/base/test"
	"github.com/river-build/river/core/node/protocol"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestOnChainConfigSettingMultipleActiveBlockValues(t *testing.T) {
	var (
		tests = []struct {
			Key          ChainKey
			Block        uint64
			Exp          uint64
			RiverErrCode protocol.Err
		}{
			{StreamReplicationFactorConfigKey, 0, 0, protocol.Err_NOT_FOUND},
			{StreamReplicationFactorConfigKey, 1, 0, protocol.Err_NOT_FOUND},
			{StreamReplicationFactorConfigKey, 9, 1, -1},
			{StreamReplicationFactorConfigKey, 10, 2, -1},
			{StreamReplicationFactorConfigKey, 20, 3, -1},
			{StreamReplicationFactorConfigKey, 21, 3, -1},
		}
		settings = &onChainSettings{
			s: map[common.Hash]settings{},
		}
	)

	settings.Set(StreamReplicationFactorConfigKey, 20, uint64(3))
	settings.Set(StreamReplicationFactorConfigKey, 5, uint64(1))
	settings.Set(StreamReplicationFactorConfigKey, 10, uint64(2))

	for _, tt := range tests {
		val, err := settings.getOnBlock(tt.Key, tt.Block).Uint64()
		if err != nil && tt.RiverErrCode == -1 {
			t.Fatalf("unexpected error: %v", err)
		} else if err != nil && err.(*base.RiverErrorImpl).Code != tt.RiverErrCode {
			t.Fatalf("want error code: %d, got %d", tt.RiverErrCode, err.(*base.RiverErrorImpl).Code)
		} else if tt.Exp != val {
			t.Errorf("expected %d, got %d", tt.Exp, val)
		}
	}
}

func TestSetOnChain(t *testing.T) {
	var (
		require     = require.New(t)
		ctx, cancel = test.NewTestContext()
	)
	defer cancel()

	tc, err := NewBlockchainTestContext(ctx, 1, false)
	require.NoError(err)
	defer tc.Close()

	blockNum := tc.BlockNum(ctx)

	for _, key := range configKeyIDToKey {
		value, err := tc.OnChainConfig.GetUint64OnBlock(blockNum.AsUint64(), key)
		require.NoError(err, "retrieve uint64 setting")
		require.Equal(key.defaultValue.(int), int(value))
	}
}

func TestLoadConfiguration(t *testing.T) {
	var (
		require     = require.New(t)
		assert      = assert.New(t)
		ctx, cancel = test.NewTestContext()
		btc, err    = NewBlockchainTestContext(ctx, 0, false)
		missing     = map[common.Hash]struct{}{
			StreamMediaMaxChunkCountConfigKey.ID():            {},
			StreamMediaMaxChunkSizeConfigKey.ID():             {},
			StreamMinEventsPerSnapshotUserInboxConfigKey.ID(): {},
		}
	)
	defer cancel()

	require.NoError(err, "unable to construct blockchain test context")

	// ensure that settings in missing are dropped from the on chain config
	for keyID := range missing {
		pendingTx, err := btc.DeployerBlockchain.TxPool.Submit(ctx, "DeleteConfig",
			func(opts *bind.TransactOpts) (*types.Transaction, error) {
				return btc.Configuration.DeleteConfiguration(opts, keyID)
			})
		require.NoError(err, "unable to delete configuration")
		require.NoError(btc.mineBlock(ctx), "unable to mine block")
		receipt := <-pendingTx.Wait()
		require.Equal(TransactionResultSuccess, receipt.Status)
	}

	// load on chain-config and ensure that the missing keys are loaded with their default values
	cfg, err := NewOnChainConfig(ctx, btc.Client(), btc.RiverRegistryAddress, btc.BlockNum(ctx), btc.ChainMonitor)
	require.NoError(err, "unable to construct on-chain config")

	for _, key := range configKeyIDToKey {
		if _, found := missing[key.ID()]; found { // ensure default value is loaded
			value, err := cfg.GetInt(key)
			require.NoErrorf(err, "unable to retrieve setting %s", key.Name())
			assert.Equalf(key.defaultValue, value, "unexpected value retrieved for %s", key.Name())
		} else { // ensure that value is available
			_, err := cfg.GetInt(key)
			require.NoErrorf(err, "unable to retrieve setting %s", key.Name())
		}
	}
}

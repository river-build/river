package config_test

import (
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/mitchellh/mapstructure"
	"github.com/river-build/river/core/config"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDecodeHooks(t *testing.T) {
	var (
		assert  = assert.New(t)
		require = require.New(t)
		cfg     = struct {
			FromHex     common.Address
			FromFile    common.Address
			DurationOne time.Duration
			DurationTwo time.Duration
			Uint64Empty []uint64
			Uint64One   []uint64
			Uint64Five  []uint64
		}{}
		expFromHex     = common.HexToAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F")
		expFromFile    = common.HexToAddress("0x03300DF841dE9089B1Ad4918cDbA863eF84d2Fe6")
		expDurationOne = 10 * time.Second
		expDurationTwo = time.Hour
		decodeHooks    = mapstructure.ComposeDecodeHookFunc(
			config.DecodeAddressOrAddressFileHook(),
			config.DecodeDurationHook(),
			config.DecodeUint64SliceHook(),
		)
	)

	viper.SetConfigFile("./testdata/test_config.yaml")

	require.Nil(viper.ReadInConfig(), "read in config")
	require.Nil(viper.Unmarshal(&cfg, viper.DecodeHook(decodeHooks)), "unmarshal config")

	assert.Equal(expFromHex, cfg.FromHex, "address from hex")
	assert.Equal(expFromFile, cfg.FromFile, "address from file")
	assert.Equal(expDurationOne, cfg.DurationOne, "duration one")
	assert.Equal(expDurationTwo, cfg.DurationTwo, "duration two")
	assert.Equal([]uint64{}, cfg.Uint64Empty, "empty uint64 slice")
	assert.Equal([]uint64{1}, cfg.Uint64One, "uint64 slice with one element")
	assert.Equal([]uint64{1, 2, 3, 4, 5}, cfg.Uint64Five, "uint64 slice with five elements")
}

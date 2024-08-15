package types_test

import (
	"math/big"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/contracts/types"
)

func TestEncodeDecodeThresholdParams(t *testing.T) {
	require := require.New(t)
	thresholdParams := types.ThresholdParams{
		Threshold: big.NewInt(100),
	}

	encoded, err := thresholdParams.AbiEncode()
	require.NoError(err)

	decoded, err := types.DecodeThresholdParams(encoded)
	require.NoError(err)

	require.Equal(thresholdParams.Threshold.Uint64(), decoded.Threshold.Uint64())
}

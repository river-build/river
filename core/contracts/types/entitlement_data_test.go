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

func TestEncodeDecodeERC1155Params(t *testing.T) {
	require := require.New(t)
	erc1155Params := types.ERC1155Params{
		Threshold: big.NewInt(200),
		TokenId:   big.NewInt(100),
	}

	encoded, err := erc1155Params.AbiEncode()
	require.NoError(err)

	decoded, err := types.DecodeERC1155Params(encoded)
	require.NoError(err)

	require.Equal(erc1155Params.Threshold.Uint64(), decoded.Threshold.Uint64())
	require.Equal(erc1155Params.TokenId.Uint64(), decoded.TokenId.Uint64())
}

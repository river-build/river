package crypto_test

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/xchain/bindings/erc721"
)

func TestContractNameMap(t *testing.T) {
	nameMap := crypto.NewContractNameMap()
	abi, _ := erc721.Erc721MetaData.GetAbi()
	nameMap.RegisterABI("Erc721", abi)

	balanceOfHash := "70a08231"
	name, ok := nameMap.GetMethodName(balanceOfHash)
	require.True(t, ok)
	require.Equal(t, "Erc721.balanceOf", name)

	transferFromHash := "23b872dd"
	name, ok = nameMap.GetMethodName(transferFromHash)
	require.True(t, ok)
	require.Equal(t, "Erc721.transferFrom", name)
}

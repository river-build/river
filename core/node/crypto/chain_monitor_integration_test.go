//go:build integration
// +build integration

package crypto_test

import (
	"testing"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/contracts/base/deploy"
	"github.com/river-build/river/core/node/base/test"
	"github.com/river-build/river/core/node/crypto"
)

func TestChainMonitorEventDetection(t *testing.T) {
	ctx, cancel := test.NewTestContext()
	defer cancel()

	btc, err := crypto.NewBlockchainTestContext(
		ctx,
		crypto.TestParams{NumKeys: 1},
	)
	require := require.New(t)
	require.NoError(err)

	client := btc.DeployerBlockchain.Client
	chainId, err := client.ChainID(ctx)
	require.NoError(err)

	auth, err := bind.NewKeyedTransactorWithChainID(btc.DeployerBlockchain.Wallet.PrivateKeyStruct, chainId)
	require.NoError(err)

	_, _, mockEventEmitter, err := deploy.DeployMockEventEmitter(auth, client)

	btc.DeployerBlockchain.StartChainMonitor(ctx)
}

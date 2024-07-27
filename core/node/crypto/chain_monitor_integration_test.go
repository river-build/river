//go:build integration
// +build integration

package crypto_test

import (
	"context"
	"math/big"
	"sync"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/contracts/base"
	"github.com/river-build/river/core/contracts/base/deploy"
	"github.com/river-build/river/core/node/base/test"
	"github.com/river-build/river/core/node/crypto"
)

func TestWithAnvil_ChainMonitorEventDetection(t *testing.T) {
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
	btc.DeployerBlockchain.StartChainMonitor(ctx)

	addr, _, mockEventEmitter, err := deploy.DeployMockEventEmitter(auth, client)
	mockAbi, err := base.IEventEmitterMetaData.GetAbi()
	require.NoError(err)

	eventEmitterContract := bind.NewBoundContract(
		addr,
		*mockAbi,
		nil,
		nil,
		nil,
	)

	N := 1000
	results := make([]bool, N)
	var eventsComplete sync.WaitGroup
	eventsComplete.Add(N)

	resultCallback := func(ctx context.Context, event types.Log) {
		testEvent := base.IEventEmitterTestEvent{}
		err := eventEmitterContract.UnpackLog(&testEvent, "TestEvent", event)
		require.NoError(err)
		value := testEvent.Value.Int64()
		t.Log("Received event", value)

		// Range check
		require.GreaterOrEqual(value, int64(0))
		require.Less(value, int64(N))

		// Duplicate event check
		require.False(results[testEvent.Value.Int64()])

		results[testEvent.Value.Int64()] = true
		eventsComplete.Done()
	}

	btc.DeployerBlockchain.ChainMonitor.OnContractWithTopicsEvent(
		btc.DeployerBlockchain.InitialBlockNum,
		addr,
		[][]common.Hash{{mockAbi.Events["TestEvent"].ID}},
		resultCallback,
	)

	for i := 0; i < N; i++ {
		t.Log("Emitting event", i)
		btc.DeployerBlockchain.TxPool.Submit(
			ctx,
			"EmitTestEvent",
			func(opts *bind.TransactOpts) (*types.Transaction, error) {
				return mockEventEmitter.EmitEvent(opts, big.NewInt(int64(i)))
			},
		)
	}

	c := make(chan struct{})
	go func() {
		defer close(c)
		eventsComplete.Wait()
	}()

	select {
	case <-c:
	case <-time.After(30 * time.Second):
		missingEvents := make([]int, 0)
		for i, result := range results {
			if !result {
				missingEvents = append(missingEvents, i)
			}
		}
		require.Fail("Timed out waiting for events, missing events: %v", missingEvents)
	}

	for i := 0; i < N; i++ {
		require.True(results[i])
	}
}

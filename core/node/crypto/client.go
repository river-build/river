package crypto

import (
	"context"
	"encoding/hex"
	"math/big"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/ethclient/simulated"
	"github.com/prometheus/client_golang/prometheus"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"github.com/river-build/river/core/node/infra"
)

type simulatedClientWrapper struct {
	simulated.Client
}

var _ BlockchainClient = (*simulatedClientWrapper)(nil)

// NewSimulatedClientWrapper returns a wrapped simulated client that implements missing methods
// on the
func NewClientWrapper(client simulated.Client) BlockchainClient {
	return &simulatedClientWrapper{
		Client: client,
	}
}

func (scw *simulatedClientWrapper) CallContractAtHash(
	ctx context.Context,
	msg ethereum.CallMsg,
	blockHash common.Hash,
) ([]byte, error) {
	bh, ok := scw.Client.(bind.BlockHashContractCaller)
	if ok {
		return bh.CallContractAtHash(ctx, msg, blockHash)
	}

	block, err := scw.BlockByHash(ctx, blockHash)
	if err != nil {
		return nil, err
	}

	return scw.CallContract(ctx, msg, block.Number())
}

func (scw *simulatedClientWrapper) CodeAtHash(
	ctx context.Context,
	account common.Address,
	blockHash common.Hash,
) ([]byte, error) {
	bh, ok := scw.Client.(bind.BlockHashContractCaller)
	if ok {
		return bh.CodeAtHash(ctx, account, blockHash)
	}

	block, err := scw.BlockByHash(ctx, blockHash)
	if err != nil {
		return nil, err
	}

	return scw.CodeAt(ctx, account, block.Number())
}

type otelEthClient struct {
	*ethclient.Client
	ethCalls *prometheus.CounterVec
	tracer   trace.Tracer
}

var _ BlockchainClient = (*otelEthClient)(nil)

// NewInstrumentedEthClient wraps an Ethereum client and adds open-telemetry tracing.
func NewInstrumentedEthClient(
	client *ethclient.Client,
	metrics infra.MetricsFactory,
	tracer trace.Tracer,
) *otelEthClient {
	var ethCalls *prometheus.CounterVec
	if metrics != nil {
		ethCalls = metrics.NewCounterVecEx(
			"eth_calls",
			"Number of eth_calls made by an instrumented client",
			"method_name",
		)
	}

	return &otelEthClient{Client: client, ethCalls: ethCalls, tracer: tracer}
}

func (ic *otelEthClient) ChainID(ctx context.Context) (*big.Int, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_chainId")
		defer span.End()
	}

	return ic.Client.ChainID(ctx)
}

func (ic *otelEthClient) BlockNumber(ctx context.Context) (uint64, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_blockNumber")
		defer span.End()
	}

	return ic.Client.BlockNumber(ctx)
}

func (ic *otelEthClient) SendTransaction(ctx context.Context, tx *types.Transaction) error {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_sendRawTransaction")
		defer span.End()

		span.SetAttributes(attribute.String("tx_hash", tx.Hash().String()))
		data := tx.Data()
		methodName := getMethodName(&data)
		span.SetAttributes(attribute.String("method_name", methodName))
	}

	return ic.Client.SendTransaction(ctx, tx)
}

func (ic *otelEthClient) HeaderByNumber(ctx context.Context, number *big.Int) (*types.Header, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_getHeaderByNumber")
		defer span.End()
	}

	return ic.Client.HeaderByNumber(ctx, number)
}

func (ic *otelEthClient) BlockByNumber(ctx context.Context, number *big.Int) (*types.Block, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_getBlockByNumber")
		defer span.End()
	}
	return ic.Client.BlockByNumber(ctx, number)
}

func (ic *otelEthClient) CallContract(ctx context.Context, msg ethereum.CallMsg, blockNumber *big.Int) ([]byte, error) {
	var methodName string
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_call")
		defer span.End()

		methodName = getMethodName(&msg.Data)
		span.SetAttributes(attribute.String("method_name", methodName))
	}

	if ic.ethCalls != nil {
		if methodName == "" {
			methodName = getMethodName(&msg.Data)
		}
		ic.ethCalls.With(prometheus.Labels{"method_name": methodName}).Inc()
	}

	return ic.Client.CallContract(ctx, msg, blockNumber)
}

func getMethodName(data *[]byte) (methodName string) {
	if len(*data) > 4 {
		selector := hex.EncodeToString((*data)[:4])
		var defined bool
		methodName, defined = GetSelectorMethodName(selector)
		if !defined {
			methodName = selector
		}
	}
	return methodName
}

func (ic *otelEthClient) CallContractAtHash(
	ctx context.Context,
	msg ethereum.CallMsg,
	blockHash common.Hash,
) ([]byte, error) {
	var methodName string

	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_call")
		defer span.End()

		methodName = getMethodName(&msg.Data)
		span.SetAttributes(attribute.String("method_name", methodName))
	}

	if ic.ethCalls != nil {
		if methodName == "" {
			methodName = getMethodName(&msg.Data)
		}
		ic.ethCalls.With(prometheus.Labels{"method_name": methodName}).Inc()
	}

	return ic.Client.CallContractAtHash(ctx, msg, blockHash)
}

func (ic *otelEthClient) PendingCallContract(ctx context.Context, msg ethereum.CallMsg) ([]byte, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_pendingCallContract")
		defer span.End()

		methodName := getMethodName(&msg.Data)
		span.SetAttributes(attribute.String("method_name", methodName))
	}

	return ic.Client.PendingCallContract(ctx, msg)
}

func (ic *otelEthClient) NonceAt(ctx context.Context, account common.Address, blockNumber *big.Int) (uint64, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_nonceAt")
		defer span.End()
	}

	return ic.Client.NonceAt(ctx, account, blockNumber)
}

func (ic *otelEthClient) PendingNonceAt(ctx context.Context, account common.Address) (uint64, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_pendingNonceAt")
		defer span.End()
	}

	return ic.Client.PendingNonceAt(ctx, account)
}

func (ic *otelEthClient) TransactionReceipt(ctx context.Context, txHash common.Hash) (*types.Receipt, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_getTransactionReceipt")
		defer span.End()
	}

	return ic.Client.TransactionReceipt(ctx, txHash)
}

func (ic *otelEthClient) BalanceAt(
	ctx context.Context,
	account common.Address,
	blockNumber *big.Int,
) (*big.Int, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_balanceAt")
		defer span.End()
	}

	return ic.Client.BalanceAt(ctx, account, blockNumber)
}

func (ic *otelEthClient) FilterLogs(ctx context.Context, q ethereum.FilterQuery) ([]types.Log, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_filterLogs")
		defer span.End()

		if q.FromBlock != nil {
			span.SetAttributes(attribute.String("from", q.FromBlock.String()))
		}
		if q.ToBlock != nil {
			span.SetAttributes(attribute.String("to", q.ToBlock.String()))
		}
	}
	return ic.Client.FilterLogs(ctx, q)
}

func (ic *otelEthClient) BlockByHash(ctx context.Context, hash common.Hash) (*types.Block, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_blockByHash")
		defer span.End()
	}

	return ic.Client.BlockByHash(ctx, hash)
}

func (ic *otelEthClient) CodeAt(ctx context.Context, account common.Address, blockNumber *big.Int) ([]byte, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_getCode")
		defer span.End()
	}

	return ic.Client.CodeAt(ctx, account, blockNumber)
}

func (ic *otelEthClient) CodeAtHash(
	ctx context.Context,
	contract common.Address,
	blockHash common.Hash,
) ([]byte, error) {
	var bc BlockchainClient = ic.Client
	bh, ok := bc.(bind.BlockHashContractCaller)
	if ok {
		if ic.tracer != nil {
			var span trace.Span
			ctx, span = ic.tracer.Start(ctx, "eth_getCode")
			defer span.End()
		}
		return bh.CodeAtHash(ctx, contract, blockHash)
	}

	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "CodeAtHash")
		defer span.End()

		span.SetAttributes(attribute.String("blockHash", hex.EncodeToString(blockHash[:])))
	}

	block, err := ic.BlockByHash(ctx, blockHash)
	if err != nil {
		return nil, err
	}

	return ic.CodeAt(ctx, contract, block.Number())
}

func (ic *otelEthClient) EstimateGas(ctx context.Context, call ethereum.CallMsg) (uint64, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_estimateGas")
		defer span.End()
	}

	return ic.Client.EstimateGas(ctx, call)
}

func (ic *otelEthClient) HeaderByHash(ctx context.Context, hash common.Hash) (*types.Header, error) {
	if ic.tracer != nil {
		var span trace.Span
		ctx, span = ic.tracer.Start(ctx, "eth_getBlockByHash")
		defer span.End()
	}

	return ic.Client.HeaderByHash(ctx, hash)
}

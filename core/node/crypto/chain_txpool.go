package crypto

import (
	"context"
	"encoding/hex"
	"errors"
	"math/big"
	"sync"
	"sync/atomic"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/river-build/river/core/config"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/infra"
	. "github.com/river-build/river/core/node/protocol"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

type (
	// TransactionPoolPendingTransaction is a transaction that is submitted to the network but not yet included in the
	// chain. Because a transaction can be resubmitted with different gas parameters the transaction hash isn't stable.
	TransactionPoolPendingTransaction interface {
		// Wait till the transaction is included in the chain and the receipt is available or until ctx expires.
		Wait(context.Context) (*types.Receipt, error)
		// TransactionHash returns the hash of the transaction that was executed on the chain.
		// This is not always reliably populated on the transaction receipt.
		TransactionHash() common.Hash
	}

	// CreateTransaction expects the function to create a transaction with the received transaction options.
	CreateTransaction = func(opts *bind.TransactOpts) (*types.Transaction, error)

	// TransactionPool represents an in-memory transaction pool to which transaction can be submitted.
	TransactionPool interface {
		// Submit calls createTx and sends the resulting transaction to the blockchain. It returns a pending transaction
		// for which the caller can wait for the transaction receipt to arrive. The pool will resubmit transactions
		// when necessary.
		Submit(ctx context.Context, name string, createTx CreateTransaction) (TransactionPoolPendingTransaction, error)

		// EstimateGas estimates the gas usage of the transaction that would be created by createTx.
		EstimateGas(ctx context.Context, createTx CreateTransaction) (uint64, error)

		// ProcessedTransactionsCount returns the number of transactions that have been processed
		ProcessedTransactionsCount() int64

		// PendingTransactionsCount returns the number of pending transactions in the pool
		PendingTransactionsCount() int64

		// ReplacementTransactionsCount returns the number of replacement transactions sent
		ReplacementTransactionsCount() int64

		// LastReplacementTransactionUnix returns the last unix timestamp when a replacement transaction was sent.
		// Or 0 when no replacement transaction has been sent.
		LastReplacementTransactionUnix() int64
	}

	// transactionPool allows to submit transactions and keeps track of submitted transactions and can replace them
	// when not included within reasonable time.
	transactionPool struct {
		pendingTransactionPool *pendingTransactionPool
		client                 BlockchainClient
		wallet                 *Wallet
		chainID                uint64
		chainIDStr             string
		signerFn               bind.SignerFn
		tracer                 trace.Tracer
		processedTxCount       atomic.Int64
		pricePolicy            TransactionPricePolicy

		// metrics
		transactionSubmitted         *prometheus.CounterVec
		walletBalanceLastTimeChecked time.Time
		walletBalance                prometheus.Gauge

		// mu guards lastPendingTx that is used to determine the tx nonce
		mu            sync.Mutex
		lastPendingTx *txPoolPendingTransaction
	}

	// txPoolPendingTransaction represents a transaction that is submitted to the chain but no receipt was retrieved.
	txPoolPendingTransaction struct {
		txHashes    []common.Hash // transaction hashes, due to resubmit there can be multiple
		tx          *types.Transaction
		txOpts      *bind.TransactOpts
		name        string
		resubmit    CreateTransaction
		firstSubmit time.Time
		lastSubmit  time.Time
		tracer      trace.Tracer
		// listener waits on this channel for the transaction receipt
		listener chan *types.Receipt
		// The hash of the transaction that was executed on the chain. This is only set on the
		// receipt by geth nodes and is not always available.
		executedHash atomic.Pointer[common.Hash]
	}

	// pendingTransactionPool keeps track of transactions that are submitted but the receipt has not been retrieved.
	pendingTransactionPool struct {
		pendingTxs sync.Map

		client  BlockchainClient
		wallet  *Wallet
		chainID uint64

		addPendingTx chan *txPoolPendingTransaction

		replacePolicy TransactionPoolReplacePolicy
		pricePolicy   TransactionPricePolicy

		pendingTxCount      atomic.Int64
		processedTxCount    atomic.Int64
		replacementsSent    atomic.Int64
		lastReplacementSent atomic.Int64

		transactionTotalInclusionDuration prometheus.Observer
		transactionInclusionDuration      prometheus.Observer
		transactionsReplaced              *prometheus.CounterVec
		transactionsPending               prometheus.Gauge
		transactionsProcessed             *prometheus.CounterVec
		transactionGasCap                 *prometheus.GaugeVec
		transactionGasTip                 *prometheus.GaugeVec

		onCheckPendingTransactionsMutex sync.Mutex
	}
)

var _ TransactionPool = (*transactionPool)(nil)
var _ TransactionPoolPendingTransaction = (*txPoolPendingTransaction)(nil)

func newPendingTransactionPool(
	monitor ChainMonitor,
	client BlockchainClient,
	chainID *big.Int,
	wallet *Wallet,
	replacePolicy TransactionPoolReplacePolicy,
	pricePolicy TransactionPricePolicy,
	metrics infra.MetricsFactory,
) *pendingTransactionPool {
	transactionsReplacedCounter := metrics.NewCounterVecEx(
		"txpool_replaced", "Number of replacement transactions submitted",
		"chain_id", "address", "func_selector",
	)
	transactionsPendingCounter := metrics.NewGaugeVecEx(
		"txpool_pending", "Number of transactions that are waiting to be included in the chain",
		"chain_id", "address",
	)
	transactionsProcessedCounter := metrics.NewCounterVecEx(
		"txpool_processed", "Number of submitted transactions that are included in the chain",
		"chain_id", "address", "status",
	)
	transactionTotalInclusionDuration := metrics.NewHistogramVecEx(
		"txpool_tx_total_inclusion_duration_sec",
		"How long it takes before a transaction is included in the chain since first submit",
		prometheus.LinearBuckets(1.0, 2.0, 10), "chain_id", "address",
	)
	transactionInclusionDuration := metrics.NewHistogramVecEx(
		"txpool_tx_inclusion_duration_sec",
		"How long it takes before a transaction is included in the chain since last submit",
		prometheus.LinearBuckets(1.0, 2.0, 10), "chain_id", "address",
	)

	curryLabels := prometheus.Labels{"chain_id": chainID.String(), "address": wallet.Address.String()}

	transactionGasCap := metrics.NewGaugeVecEx(
		"txpool_tx_fee_cap_wei", "Latest submitted EIP1559 transaction gas fee cap",
		"chain_id", "address", "replacement",
	)
	transactionGasTip := metrics.NewGaugeVecEx(
		"txpool_tx_miner_tip_wei", "Latest submitted EIP1559 transaction gas fee miner tip",
		"chain_id", "address", "replacement",
	)

	ptp := &pendingTransactionPool{
		client:        client,
		wallet:        wallet,
		chainID:       chainID.Uint64(),
		replacePolicy: replacePolicy,
		pricePolicy:   pricePolicy,
		addPendingTx:  make(chan *txPoolPendingTransaction, 10),

		transactionsReplaced:              transactionsReplacedCounter.MustCurryWith(curryLabels),
		transactionsPending:               transactionsPendingCounter.With(curryLabels),
		transactionsProcessed:             transactionsProcessedCounter.MustCurryWith(curryLabels),
		transactionTotalInclusionDuration: transactionTotalInclusionDuration.With(curryLabels),
		transactionInclusionDuration:      transactionInclusionDuration.With(curryLabels),
		transactionGasCap:                 transactionGasCap.MustCurryWith(curryLabels),
		transactionGasTip:                 transactionGasTip.MustCurryWith(curryLabels),
	}

	go ptp.run()

	monitor.OnHeader(ptp.checkPendingTransactions)

	return ptp
}

func (pool *pendingTransactionPool) PendingTransactionsCount() int64 {
	return pool.pendingTxCount.Load()
}

func (pool *pendingTransactionPool) run() {
	for ptx := range pool.addPendingTx {
		pool.pendingTxs.Store(ptx.tx.Nonce(), ptx)
		pool.pendingTxCount.Add(1)

		// metrics
		gasCap, _ := ptx.tx.GasFeeCap().Float64()
		tipCap, _ := ptx.tx.GasTipCap().Float64()
		pool.transactionsPending.Add(1)
		pool.transactionGasCap.With(prometheus.Labels{"replacement": "false"}).Set(gasCap)
		pool.transactionGasTip.With(prometheus.Labels{"replacement": "false"}).Set(tipCap)
	}
}

func (pool *pendingTransactionPool) checkPendingTransactions(ctx context.Context, head *types.Header) {
	// Try lock to have only one invocation at a time.
	if !pool.onCheckPendingTransactionsMutex.TryLock() {
		return
	}
	defer pool.onCheckPendingTransactionsMutex.Unlock()

	log := dlog.FromCtx(ctx).With("chain", pool.chainID)

	// grab the latest nonce, pending transactions with a nonce lower or equal are included in the chain and should
	// have a receipt available.
	nonce, err := pool.client.NonceAt(ctx, pool.wallet.Address, nil)
	if err != nil {
		log.Warn("unable to get tx pool nonce", "err", err)
		return
	}

	// drop transactions that have a receipt available from the pool and check others if it is time to send a
	// replacement transactions
	pool.pendingTxs.Range(func(k, v interface{}) bool {
		var (
			ptx          = v.(*txPoolPendingTransaction)
			ptxNonce     = k.(uint64)
			ptxConfirmed = ptxNonce <= nonce
		)

		if ptxConfirmed {
			// there can be multiple transactions (original + replacements), start from latest submitted
			for i := len(ptx.txHashes) - 1; i >= 0; i-- {
				txHash := ptx.txHashes[i]
				receipt, err := pool.client.TransactionReceipt(ctx, txHash)
				if receipt != nil {
					pool.pendingTxs.Delete(ptx.tx.Nonce())
					ptx.executedHash.Store(&txHash)
					ptx.listener <- receipt
					close(ptx.listener)

					status := "failed"
					if receipt.Status == types.ReceiptStatusSuccessful {
						status = "succeeded"
					}

					log.Debug(
						"TxPool: Transaction DONE",
						"txHash", txHash,
						"chain", pool.chainID,
						"name", ptx.name,
						"from", ptx.txOpts.From,
						"to", ptx.tx.To(),
						"nonce", ptx.tx.Nonce(),
						"succeeded", receipt.Status == types.ReceiptStatusSuccessful,
						"cumulativeGasUsed", receipt.CumulativeGasUsed,
						"gasUsed", receipt.GasUsed,
						"effectiveGasPrice", receipt.EffectiveGasPrice,
						"blockHash", receipt.BlockHash,
						"blockNumber", receipt.BlockNumber,
					)

					pool.pendingTxCount.Add(-1)
					pool.processedTxCount.Add(1)
					pool.transactionTotalInclusionDuration.Observe(time.Since(ptx.firstSubmit).Seconds())
					pool.transactionInclusionDuration.Observe(time.Since(ptx.lastSubmit).Seconds())
					pool.transactionsProcessed.With(prometheus.Labels{"status": status}).Inc()
					pool.transactionsPending.Add(-1)

					return true
				}
				if errors.Is(err, ethereum.NotFound) {
					continue
				}
				if err != nil {
					log.Warn("unable to get transaction receipt", "txHash", txHash.Hex(), "err", err)
					return true
				}
			}
		} else { // determine if tx is eligible for resubmit
			if pool.replacePolicy.Eligible(head, ptx.lastSubmit, ptx.tx) {
				ptx.txOpts.GasPrice, ptx.txOpts.GasFeeCap, ptx.txOpts.GasTipCap =
					pool.pricePolicy.Reprice(head, ptx.tx)

				ptx.txOpts.GasLimit = 0 // force re-simulation to determine new gas limit

				tx, err := ptx.resubmit(ptx.txOpts)
				if err != nil {
					log.Warn("unable to create replacement transaction", "txHash", ptx.tx.Hash(), "err", err)
					return true
				}

				if err := pool.client.SendTransaction(ctx, tx); err == nil {
					log.Debug(
						"TxPool: Transaction REPLACED",
						"old", ptx.tx.Hash(),
						"txHash", tx.Hash(),
						"chain", pool.chainID,
						"name", ptx.name,
						"nonce", tx.Nonce(),
						"from", ptx.txOpts.From,
						"to", tx.To(),
						"gasPrice", tx.GasPrice(),
						"gasFeeCap", tx.GasFeeCap(),
						"gasTipCap", tx.GasTipCap(),
					)

					ptx.tx = tx
					ptx.txHashes = append(ptx.txHashes, tx.Hash())
					ptx.lastSubmit = time.Now()

					funcSelector := funcSelectorFromTxForMetrics(tx)
					gasCap, _ := tx.GasFeeCap().Float64()
					tipCap, _ := tx.GasTipCap().Float64()

					pool.replacementsSent.Add(1)
					pool.lastReplacementSent.Store(ptx.lastSubmit.Unix())
					pool.transactionsReplaced.With(prometheus.Labels{"func_selector": funcSelector}).Add(1)
					pool.transactionGasCap.With(prometheus.Labels{"replacement": "false"}).Set(gasCap)
					pool.transactionGasTip.With(prometheus.Labels{"replacement": "false"}).Set(tipCap)
				} else {
					log.Error("unable to replace transaction", "txHash", tx.Hash(), "err", err)
				}
			}
		}

		return true
	})
}

// NewTransactionPoolWithPoliciesFromConfig creates an in-memory transaction pool that tracks transactions that are
// submitted through it. Pending transactions checked on each block if they are eligable to be replaced (through the
// replacement policy). If the pending transaction must be replaced is uses the price policy to determine the new gas
// fees for the replacement transaction. The pool then submits the replacement policy. It keeps track of the old pending
// transactions in case the original transaction was included in the chain.
func NewTransactionPoolWithPoliciesFromConfig(
	ctx context.Context,
	cfg *config.ChainConfig,
	riverClient BlockchainClient,
	wallet *Wallet,
	chainMonitor ChainMonitor,
	initialBlockNumber BlockNumber,
	metrics infra.MetricsFactory,
	tracer trace.Tracer,
) (*transactionPool, error) {
	if cfg.BlockTimeMs <= 0 {
		return nil, RiverError(Err_BAD_CONFIG, "BlockTimeMs must be set").
			Func("NewTransactionPoolWithPoliciesFromConfig")
	}
	// if pending tx timeout is not specified use a default of 3*chain.BlockPeriod
	txTimeout := cfg.TransactionPool.TransactionTimeout
	if txTimeout == 0 {
		txTimeout = 3 * time.Duration(cfg.BlockTimeMs) * time.Millisecond
	}

	var (
		replacementPolicy = NewTransactionPoolDeadlinePolicy(txTimeout)
		pricePolicy       = NewDefaultTransactionPricePolicy(
			cfg.TransactionPool.GasFeeIncreasePercentage,
			cfg.TransactionPool.GasFeeCap,
			cfg.TransactionPool.MinerTipFeeReplacementPercentage)
	)

	return NewTransactionPoolWithPolicies(
		ctx, riverClient, wallet, replacementPolicy, pricePolicy, chainMonitor, initialBlockNumber, metrics, tracer)
}

// NewTransactionPoolWithPolicies creates an in-memory transaction pool that tracks transactions that are submitted
// through it. Pending transactions checked on each block if they are eligable to be replaced. This is determined with
// the given replacePolicy. If the pending transaction must be replaced the given pricePolicy is used to determine the
// fees for the replacement transaction. The pool than submits the replacement policy. It keeps track of the old pending
// transactions in case the original transaction was included in the chain.
func NewTransactionPoolWithPolicies(
	ctx context.Context,
	client BlockchainClient,
	wallet *Wallet,
	replacePolicy TransactionPoolReplacePolicy,
	pricePolicy TransactionPricePolicy,
	chainMonitor ChainMonitor,
	initialBlockNumber BlockNumber,
	metrics infra.MetricsFactory,
	tracer trace.Tracer,
) (*transactionPool, error) {
	chainID, err := client.ChainID(ctx)
	if err != nil {
		return nil, err
	}

	signer := types.LatestSignerForChainID(chainID)

	signerFn := func(address common.Address, tx *types.Transaction) (*types.Transaction, error) {
		signature, err := crypto.Sign(signer.Hash(tx).Bytes(), wallet.PrivateKeyStruct)
		if err != nil {
			return nil, err
		}
		return tx.WithSignature(signer, signature)
	}

	transactionsSubmittedCounter := metrics.NewCounterVecEx(
		"txpool_submitted", "Number of transactions submitted",
		"chain_id", "address", "func_selector",
	)

	walletBalance := metrics.NewGaugeVecEx(
		"txpool_wallet_balance_eth", "Wallet native coin balance",
		"chain_id", "address",
	)

	curryLabels := prometheus.Labels{"chain_id": chainID.String(), "address": wallet.Address.String()}
	txPool := &transactionPool{
		client:               client,
		wallet:               wallet,
		chainID:              chainID.Uint64(),
		chainIDStr:           chainID.String(),
		pricePolicy:          pricePolicy,
		signerFn:             signerFn,
		tracer:               tracer,
		transactionSubmitted: transactionsSubmittedCounter.MustCurryWith(curryLabels),
		walletBalance:        walletBalance.With(curryLabels),
		pendingTransactionPool: newPendingTransactionPool(
			chainMonitor, client, chainID, wallet, replacePolicy, pricePolicy, metrics),
	}

	chainMonitor.OnHeader(txPool.Balance)

	return txPool, nil
}

// Wait until the receipt is available for tx or until ctx expired.
// Can only be called once, when the receipt is read it isn't available again and an error is returned.
func (tx *txPoolPendingTransaction) Wait(ctx context.Context) (*types.Receipt, error) {
	var span trace.Span
	if tx.tracer != nil {
		ctx, span = tx.tracer.Start(ctx, "pending_tx_wait")
		defer span.End()
	}

	select {
	case receipt, ok := <-tx.listener:
		if !ok {
			return nil, RiverError(Err_UNAVAILABLE,
				"Transaction receipt already retrieved or not available").Func("Wait")
		}
		if span != nil {
			span.SetAttributes(attribute.String("tx_hash", receipt.TxHash.String()))
		}
		return receipt, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

// TransactionHash returns the transaction hash and is only available after the receipt was retrieved.
func (tx *txPoolPendingTransaction) TransactionHash() common.Hash {
	txHash := tx.executedHash.Load()
	if txHash == nil {
		return common.Hash{}
	}
	return *txHash
}

// caller is expected to hold a lock on r.mu
func (r *transactionPool) nextNonce(ctx context.Context) (uint64, error) {
	if r.lastPendingTx != nil {
		return r.lastPendingTx.tx.Nonce() + 1, nil
	}
	return r.client.PendingNonceAt(ctx, r.wallet.Address)
}

func (r *transactionPool) EstimateGas(ctx context.Context, createTx CreateTransaction) (uint64, error) {
	opts := &bind.TransactOpts{
		From:    r.wallet.Address,
		Nonce:   new(big.Int).SetUint64(0),
		Signer:  r.signerFn,
		Context: ctx,
		NoSend:  true,
	}

	tx, err := createTx(opts)
	log := dlog.FromCtx(ctx)
	if err != nil {
		log.Debug("Estimating gas for transaction failed", "err", err)
		return 0, err
	}
	return tx.Gas(), nil
}

func (r *transactionPool) Submit(
	ctx context.Context,
	name string,
	createTx CreateTransaction,
) (TransactionPoolPendingTransaction, error) {
	var span trace.Span

	if r.tracer != nil {
		ctx, span = r.tracer.Start(ctx, "txpool_submit")
		defer span.End()
	}

	// lock to prevent tx.Nonce collisions
	r.mu.Lock()
	defer r.mu.Unlock()

	nonce, err := r.nextNonce(ctx)
	if err != nil {
		return nil, err
	}

	opts := &bind.TransactOpts{
		From:    r.wallet.Address,
		Nonce:   new(big.Int).SetUint64(nonce),
		Signer:  r.signerFn,
		Context: ctx,
		NoSend:  true,
	}

	tx, err := createTx(opts)
	if err != nil {
		return nil, err
	}

	if span != nil {
		span.SetAttributes(attribute.String("tx_hash", tx.Hash().String()))
	}

	// ensure that tx gas price is not higher than node operator has defined in the config he is willing to pay
	if tx.GasFeeCap() != nil && r.pricePolicy.GasFeeCap() != nil && tx.GasFeeCap().Cmp(r.pricePolicy.GasFeeCap()) > 0 {
		return nil, RiverError(Err_BAD_CONFIG, "Transaction too expensive").
			Tags("tx.GasFeeCap", tx.GasFeeCap().String(), "user.GasFeeCap", r.pricePolicy.GasFeeCap().String(), "name", name).
			Func("Submit")
	}

	if err := r.client.SendTransaction(ctx, tx); err != nil {
		return nil, err
	}

	now := time.Now()
	pendingTx := &txPoolPendingTransaction{
		txHashes:    []common.Hash{tx.Hash()},
		tx:          tx,
		txOpts:      opts,
		resubmit:    createTx,
		name:        name,
		firstSubmit: now,
		lastSubmit:  now,
		tracer:      r.tracer,
		listener:    make(chan *types.Receipt, 1),
	}

	r.lastPendingTx = pendingTx
	r.pendingTransactionPool.addPendingTx <- pendingTx

	// metrics
	funcSelector := funcSelectorFromTxForMetrics(tx)
	r.transactionSubmitted.With(prometheus.Labels{"func_selector": funcSelector}).Add(1)

	log := dlog.FromCtx(ctx)
	log.Debug(
		"TxPool: Transaction SENT",
		"txHash", tx.Hash(),
		"chain", r.chainID,
		"name", name,
		"nonce", tx.Nonce(),
		"from", opts.From,
		"to", tx.To(),
		"gasPrice", tx.GasPrice(),
		"gasFeeCap", tx.GasFeeCap(),
		"gasTipCap", tx.GasTipCap(),
	)

	return pendingTx, nil
}

func (r *transactionPool) Balance(ctx context.Context, _ *types.Header) {
	if time.Since(r.walletBalanceLastTimeChecked) < time.Minute {
		return
	}

	balance, err := r.client.BalanceAt(ctx, r.wallet.Address, nil)
	if err != nil {
		log := dlog.FromCtx(ctx).With("chain", r.chainID)
		log.Error("Unable to retrieve wallet balance", "err", err)
		return
	}

	r.walletBalance.Set(WeiToEth(balance))
	r.walletBalanceLastTimeChecked = time.Now()
}

func (r *transactionPool) ProcessedTransactionsCount() int64 {
	return r.processedTxCount.Load()
}

func (r *transactionPool) PendingTransactionsCount() int64 {
	return r.pendingTransactionPool.pendingTxCount.Load()
}

func (r *transactionPool) ReplacementTransactionsCount() int64 {
	return r.pendingTransactionPool.replacementsSent.Load()
}

func (r *transactionPool) LastReplacementTransactionUnix() int64 {
	return r.pendingTransactionPool.lastReplacementSent.Load()
}

func funcSelectorFromTxForMetrics(tx *types.Transaction) string {
	if len(tx.Data()) >= 4 {
		return hex.EncodeToString(tx.Data()[:4])
	}
	return "unknown"
}

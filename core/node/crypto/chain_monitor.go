package crypto

import (
	"context"
	"math/big"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/prometheus/client_golang/prometheus"

	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/infra"
)

type (
	// ChainMonitor monitors the EVM chain for new blocks and/or events.
	ChainMonitor interface {
		// RunWithBlockPeriod the monitor until the given ctx expires using the client to interact
		// with the chain.
		RunWithBlockPeriod(
			ctx context.Context,
			client BlockchainClient,
			initialBlock BlockNumber,
			blockPeriod time.Duration,
			metrics infra.MetricsFactory,
		)
		// OnHeader adds a callback that is when a new header is received.
		// Note: it is not guaranteed to be called for every new header!
		OnHeader(cb OnChainNewHeader)
		// OnBlock adds a callback that is called for each new block
		OnBlock(cb OnChainNewBlock)
		// OnAllEvents matches all events for all contracts, e.g. all chain events.
		OnAllEvents(from BlockNumber, cb OnChainEventCallback)
		// OnContractEvent matches all events created by the contract on the given address.
		OnContractEvent(from BlockNumber, addr common.Address, cb OnChainEventCallback)
		// OnContractWithTopicsEvent matches events created by the contract on the given
		OnContractWithTopicsEvent(
			from BlockNumber,
			addr common.Address,
			topics [][]common.Hash,
			cb OnChainEventCallback,
		)
		// OnStopped calls cb after the chain monitor stopped monitoring the chain
		OnStopped(cb OnChainMonitorStoppedCallback)
	}

	// OnChainEventCallback is called for each event that matches the filter.
	// Note that the monitor doesn't care about errors in the callback and doesn't
	// expect callbacks to change the received event.
	OnChainEventCallback = func(context.Context, types.Log)

	// OnChainNewHeader is called when a new header is detected to be added to the chain.
	// Note, it is NOT guaranteed to be called for every new header.
	// It is called each time the chain is polled and a new header is detected, discarding intermediate headers.
	OnChainNewHeader = func(context.Context, *types.Header)

	// OnChainNewBlock is called for each new block that is added to the chain.
	OnChainNewBlock = func(context.Context, BlockNumber)

	// OnChainMonitorStoppedCallback is called after the chain monitor stopped monitoring the chain.
	OnChainMonitorStoppedCallback = func(context.Context)

	chainMonitor struct {
		mu        sync.Mutex
		builder   chainMonitorBuilder
		fromBlock *big.Int
	}

	// ChainMonitorPollInterval determines the next poll interval for the chain monitor
	ChainMonitorPollInterval interface {
		Interval(took time.Duration, hitBlockRangeLimit bool, gotErr bool) time.Duration
	}

	defaultChainMonitorPollIntervalCalculator struct {
		blockPeriod      time.Duration
		errCounter       int64
		errSlowdownLimit time.Duration
	}
)

// NewChainMonitor constructs an EVM chain monitor that can track state changes on an EVM chain.
func NewChainMonitor() *chainMonitor {
	return &chainMonitor{
		builder: chainMonitorBuilder{dirty: true},
	}
}

func NewChainMonitorPollIntervalCalculator(
	blockPeriod time.Duration, errSlowdownLimit time.Duration,
) *defaultChainMonitorPollIntervalCalculator {
	return &defaultChainMonitorPollIntervalCalculator{
		blockPeriod:      blockPeriod,
		errCounter:       0,
		errSlowdownLimit: max(errSlowdownLimit, time.Second),
	}
}

func (p *defaultChainMonitorPollIntervalCalculator) Interval(
	took time.Duration, hitBlockRangeLimit bool, gotErr bool,
) time.Duration {
	if gotErr {
		// increments each time an error was encountered the time for the next poll until errSlowdownLimit
		p.errCounter = min(p.errCounter+1, 10000)
		return min(time.Duration(p.errCounter)*p.blockPeriod, p.errSlowdownLimit)
	}

	p.errCounter = 0
	if hitBlockRangeLimit { // fallen behind chain, fetch immediately next block range
		return time.Duration(0)
	}
	return max(p.blockPeriod-took, 0)
}

// setFromBlock must be called with ecm.mu locked.
// onSubscribe is an indication if fromBlock is allowed to be in the past.
func (cm *chainMonitor) setFromBlock(fromBlock *big.Int, onSubscribe bool) {
	if cm.fromBlock == nil {
		cm.fromBlock = fromBlock
	} else if onSubscribe && cm.fromBlock.Cmp(fromBlock) > 0 { // can go back but not into the future
		cm.fromBlock = fromBlock
	} else if !onSubscribe && cm.fromBlock.Cmp(fromBlock) < 0 { // can only go into the future (chain monitor)
		cm.fromBlock = fromBlock
	}
}

func (cm *chainMonitor) OnHeader(cb OnChainNewHeader) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.builder.OnHeader(cb)
}

func (cm *chainMonitor) OnBlock(cb OnChainNewBlock) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.builder.OnBlock(cb)
}

func (cm *chainMonitor) OnAllEvents(from BlockNumber, cb OnChainEventCallback) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.builder.OnAllEvents(from, cb)
	cm.setFromBlock(from.AsBigInt(), true)
}

func (cm *chainMonitor) OnContractEvent(from BlockNumber, addr common.Address, cb OnChainEventCallback) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.builder.OnContractEvent(from, addr, cb)
	cm.setFromBlock(from.AsBigInt(), true)
}

func (cm *chainMonitor) OnContractWithTopicsEvent(
	from BlockNumber,
	addr common.Address,
	topics [][]common.Hash,
	cb OnChainEventCallback,
) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.builder.OnContractWithTopicsEvent(from, addr, topics, cb)
	cm.setFromBlock(from.AsBigInt(), true)
}

func (cm *chainMonitor) OnStopped(cb OnChainMonitorStoppedCallback) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.builder.OnChainMonitorStopped(cb)
}

// RunWithBlockPeriod monitors the chain the given client is connected to and calls the
// associated callback for each event that matches its filter.
//
// It will finish when the given ctx is cancelled.
//
// It will start monitoring from the given initialBlock block number (inclusive).
//
// Callbacks are called in the order they were added and
// aren't called concurrently to ensure that events are processed in the order
// they were received.
func (cm *chainMonitor) RunWithBlockPeriod(
	ctx context.Context,
	client BlockchainClient,
	initialBlock BlockNumber,
	blockPeriod time.Duration,
	metrics infra.MetricsFactory,
) {
	var (
		chainBaseFee = metrics.NewGaugeVecEx(
			"chain_monitor_base_fee_wei", "Current EIP-1559 base fee as obtained from the block header",
			"chain_id",
		)
		chainMonitorHeadBlock = metrics.NewGaugeVecEx(
			"chain_monitor_head_block", "Latest block available for the chain monitor",
			"chain_id",
		)
		chainMonitorProcessedBlock = metrics.NewGaugeVecEx(
			"chain_monitor_processed_block", "Latest block processed by the chain monitor",
			"chain_id",
		)
		chainMonitorRecvEvents = metrics.NewCounterVecEx(
			"chain_monitor_received_events", "Chain monitor total received events",
			"chain_id",
		)
		chainMonitorPollCounter = metrics.NewCounterVecEx(
			"chain_monitor_pollcounter", "How many times the chain monitor poll loop has run",
			"chain_id",
		)
	)

	var (
		log                   = dlog.FromCtx(ctx)
		one                   = big.NewInt(1)
		pollInterval          = time.Duration(0)
		poll                  = NewChainMonitorPollIntervalCalculator(blockPeriod, 30*time.Second)
		baseFeeGauge          prometheus.Gauge
		headBlockGauge        prometheus.Gauge
		processedBlockGauge   prometheus.Gauge
		receivedEventsCounter prometheus.Counter
		pollIntervalCounter   prometheus.Counter
	)

	if chainID := loadChainID(ctx, client); chainID != nil {
		curryLabels := prometheus.Labels{"chain_id": chainID.String()}
		baseFeeGauge = chainBaseFee.With(curryLabels)
		headBlockGauge = chainMonitorHeadBlock.With(curryLabels)
		processedBlockGauge = chainMonitorProcessedBlock.With(curryLabels)
		receivedEventsCounter = chainMonitorRecvEvents.With(curryLabels)
		pollIntervalCounter = chainMonitorPollCounter.With(curryLabels)
	} else {
		return
	}

	cm.mu.Lock()
	cm.setFromBlock(initialBlock.AsBigInt(), true)
	cm.mu.Unlock()

	log.Debug("chain monitor started", "blockPeriod", blockPeriod, "fromBlock", initialBlock)

	for {
		pollIntervalCounter.Inc()

		select {
		case <-ctx.Done():
			log.Debug("initiate chain monitor shutdown")
			ctx2, cancel := context.WithTimeout(context.WithoutCancel(ctx), time.Minute)
			cm.builder.stoppedCallbacks.onChainMonitorStopped(ctx2)
			cancel()
			log.Debug("chain monitor stopped")
			return

		case <-time.After(pollInterval):
			var (
				start     = time.Now()
				fromBlock uint64
			)

			head, err := client.HeaderByNumber(ctx, nil)
			if err != nil {
				log.Warn("chain monitor is unable to retrieve chain head", "error", err)
				pollInterval = poll.Interval(time.Since(start), false, true)
				continue
			}

			headBlockGauge.Set(float64(head.Number.Uint64()))
			if head.BaseFee != nil {
				baseFee, _ := head.BaseFee.Float64()
				baseFeeGauge.Set(baseFee)
			}

			cm.mu.Lock()
			if frmBlock := cm.fromBlock; frmBlock == nil || frmBlock.Uint64() > head.Number.Uint64() { // no new block
				cm.mu.Unlock()
				pollInterval = poll.Interval(time.Since(start), false, false)
				continue
			} else {
				fromBlock = frmBlock.Uint64()
				cm.mu.Unlock()
			}

			var (
				newBlocks           []BlockNumber
				collectedLogs       []types.Log
				toBlock             = new(big.Int).Set(head.Number)
				moreBlocksAvailable = false
				callbacksExecuted   sync.WaitGroup
			)

			// ensure that the search range isn't too big because RPC providers
			// often have limitations on the block range and/or response size.
			if head.Number.Uint64()-fromBlock > 25 {
				moreBlocksAvailable = true
				toBlock.SetUint64(fromBlock + 25)
			}

			cm.mu.Lock()
			query := cm.builder.Query()
			query.FromBlock, query.ToBlock = new(big.Int).SetUint64(fromBlock), toBlock

			if len(cm.builder.blockCallbacks) > 0 {
				for i := query.FromBlock.Uint64(); i <= query.ToBlock.Uint64(); i++ {
					newBlocks = append(newBlocks, BlockNumber(i))
				}
			}

			if len(cm.builder.eventCallbacks) > 0 { // collect events in new blocks
				collectedLogs, err = client.FilterLogs(ctx, query)
				if err != nil {
					log.Warn("unable to retrieve logs", "error", err, "from", query.FromBlock, "to", query.ToBlock)
					pollInterval = poll.Interval(time.Since(start), false, true)
					cm.mu.Unlock()
					continue
				}
				receivedEventsCounter.Add(float64(len(collectedLogs)))
			}

			if len(cm.builder.headerCallbacks) > 0 {
				callbacksExecuted.Add(1)
				go func() {
					cm.builder.headerCallbacks.onHeadReceived(ctx, head)
					callbacksExecuted.Done()
				}()
			}

			if len(cm.builder.blockCallbacks) > 0 {
				callbacksExecuted.Add(1)
				go func() {
					for _, header := range newBlocks {
						cm.builder.blockCallbacks.onBlockReceived(ctx, header)
					}
					callbacksExecuted.Done()
				}()
			}

			if len(cm.builder.eventCallbacks) > 0 {
				callbacksExecuted.Add(1)
				go func() {
					for _, log := range collectedLogs {
						cm.builder.eventCallbacks.onLogReceived(ctx, log)
					}
					callbacksExecuted.Done()
				}()
			}

			callbacksExecuted.Wait()

			// from and toBlocks are inclusive, start at the next block on next iteration
			cm.setFromBlock(new(big.Int).Add(query.ToBlock, one), false)
			cm.mu.Unlock()

			processedBlockGauge.Set(float64(query.ToBlock.Uint64()))
			pollInterval = poll.Interval(time.Since(start), moreBlocksAvailable, false)
		}
	}
}

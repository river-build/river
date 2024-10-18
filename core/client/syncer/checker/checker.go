package checker

import (
	"context"
	"sync"
	"sync/atomic"
	"time"

	"github.com/ethereum/go-ethereum/common"

	"github.com/river-build/river/core/client/syncer"
	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/contracts/river"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/registries"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/utils/syncmap"
)

type streamState struct {
	streamId StreamId

	mu         sync.Mutex
	bcMbNum    int64
	bcMbHash   common.Hash
	syncMbNum  int64
	syncMbHash common.Hash
}

func newStreamState(streamId StreamId) *streamState {
	return &streamState{
		streamId:  streamId,
		bcMbNum:   -1,
		syncMbNum: -1,
	}
}

func (s *streamState) onUpdate(ctx context.Context, bcMbHash common.Hash, bcMbNum uint64, stats *streamCheckerStats) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.bcMbHash = bcMbHash
	s.bcMbNum = int64(bcMbNum)

	s.compare(ctx, "blockchain", stats)
}

func (s *streamState) onSync(ctx context.Context, update *syncer.SyncUpdate, stats *streamCheckerStats) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.syncMbNum = update.Stream.GetNextSyncCookie().GetMinipoolGen() - 1
	s.syncMbHash = common.Hash(update.Stream.GetNextSyncCookie().GetPrevMiniblockHash())

	s.compare(ctx, "sync", stats)
}

func withinOne(a, b int64) bool {
	diff := a - b
	return diff >= -1 && diff <= 1
}

func (s *streamState) compare(ctx context.Context, lastUpdate string, stats *streamCheckerStats) {
	log := dlog.FromCtx(ctx)

	if s.bcMbNum != -1 && s.syncMbNum != -1 && !withinOne(s.bcMbNum, s.syncMbNum) {
		log.Error(
			"Miniblock number out of sync",
			"streamId",
			s.streamId,
			"bcMbNum",
			s.bcMbNum,
			"syncMbNum",
			s.syncMbNum,
			"lastUpdate",
			lastUpdate,
		)
		stats.outOfSync.Add(1)
	} else if s.bcMbNum != -1 && s.bcMbNum == s.syncMbNum && s.bcMbHash != s.syncMbHash {
		log.Error(
			"Miniblock hash mismatch",
			"streamId", s.streamId, "bcMbNum", s.bcMbNum, "syncMbNum", s.syncMbNum,
			"bcHash", s.bcMbHash, "syncHash", s.syncMbHash,
			"lastUpdate", lastUpdate)
		stats.hashMismatch.Add(1)
	} else if s.bcMbNum == -1 || s.syncMbNum == -1 {
		log.Debug("Waiting for initial miniblock", "streamId", s.streamId, "bcMbNum", s.bcMbNum, "syncMbNum", s.syncMbNum, "lastUpdate", lastUpdate)
		stats.waitingForInit.Add(1)
	} else {
		log.Debug("Miniblock number in sync", "streamId", s.streamId, "bcMbNum", s.bcMbNum, "syncMbNum", s.syncMbNum, "lastUpdate", lastUpdate)
		stats.inSync.Add(1)
	}
}

type streamCheckerStats struct {
	bcUpdates      atomic.Uint64
	syncUpdates    atomic.Uint64
	streams        atomic.Uint64
	outOfSync      atomic.Uint64
	hashMismatch   atomic.Uint64
	waitingForInit atomic.Uint64
	inSync         atomic.Uint64
	down           atomic.Uint64
	up             atomic.Uint64
	added          atomic.Uint64
}

type streamChecker struct {
	config     *config.Config
	blockchain *crypto.Blockchain
	registry   *registries.RiverRegistryContract

	updates chan *syncer.SyncUpdate

	syncReceiver syncer.SyncReceiver

	streams syncmap.Typed[StreamId, *streamState]

	stats streamCheckerStats
}

func StartStreamChecker(
	ctx context.Context,
	config *config.Config,
	node common.Address,
	onExit chan<- error,
) error {
	checker := &streamChecker{
		config:  config,
		updates: make(chan *syncer.SyncUpdate, 100),
	}

	var err error
	checker.blockchain, err = crypto.NewBlockchain(
		ctx,
		&config.RiverChain,
		nil,
		infra.NewMetricsFactory(nil, "river", "cmdline"),
		nil,
	)
	if err != nil {
		return err
	}

	checker.blockchain.StartChainMonitor(ctx)

	checker.registry, err = registries.NewRiverRegistryContract(ctx, checker.blockchain, &config.RegistryContract)
	if err != nil {
		return err
	}

	err = checker.registry.OnStreamEvent(
		ctx,
		checker.blockchain.InitialBlockNum,
		checker.onAllocated,
		checker.onLastMiniblockUpdated,
		checker.onPlacementUpdated,
	)
	if err != nil {
		return err
	}

	nodeRegistry, err := nodes.LoadNodeRegistry(
		ctx,
		checker.registry,
		common.Address{},
		checker.blockchain.InitialBlockNum,
		checker.blockchain.ChainMonitor,
		nil,
	)
	if err != nil {
		return err
	}

	stub, err := nodeRegistry.GetStreamServiceClientForAddress(node)
	if err != nil {
		return err
	}

	checker.syncReceiver, err = syncer.StartSyncReceiver(ctx, stub, onExit)
	if err != nil {
		return err
	}

	go checker.run(ctx)

	return nil
}

func (c *streamChecker) onAllocated(ctx context.Context, event *river.StreamRegistryV1StreamAllocated) {
	streamId := StreamId(event.StreamId)
	state := newStreamState(streamId)
	c.streams.Store(streamId, state)
	c.stats.streams.Add(1)
	c.stats.bcUpdates.Add(1)
	go c.addToSync(ctx, state)
}

func (c *streamChecker) onLastMiniblockUpdated(
	ctx context.Context,
	event *river.StreamRegistryV1StreamLastMiniblockUpdated,
) {
	c.stats.bcUpdates.Add(1)

	streamId := StreamId(event.StreamId)
	state, loaded := c.streams.Load(streamId)
	if !loaded {
		state = newStreamState(streamId)
		c.streams.Store(streamId, state)
		c.stats.streams.Add(1)
		go c.addToSync(ctx, state)
		return
	}

	state.onUpdate(ctx, common.Hash(event.LastMiniblockHash), event.LastMiniblockNum, &c.stats)
}

func (c *streamChecker) onPlacementUpdated(ctx context.Context, event *river.StreamRegistryV1StreamPlacementUpdated) {
	// Do nothing
}

func (c *streamChecker) addToSync(ctx context.Context, state *streamState) {
	info, err := c.registry.GetStream(ctx, state.streamId)
	if err != nil {
		dlog.FromCtx(ctx).Error("addToSync: Failed to get stream", "error", err)
		return
	}
	state.onUpdate(ctx, info.LastMiniblockHash, info.LastMiniblockNum, &c.stats)
	cookie := &SyncCookie{
		NodeAddress:       info.Nodes[0][:],
		StreamId:          state.streamId[:],
		MinipoolGen:       int64(info.LastMiniblockNum + 1),
		PrevMiniblockHash: info.LastMiniblockHash[:],
	}

	err = c.syncReceiver.AddStream(ctx, state.streamId, cookie, c.updates)
	if err != nil {
		dlog.FromCtx(ctx).Error("addToSync: Failed to add stream", "error", err)
	}
}

func (c *streamChecker) run(ctx context.Context) {
	log := dlog.FromCtx(ctx)

	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case update := <-c.updates:
			c.handleUpdate(ctx, update)
		case <-ticker.C:
			log.Info(
				"Stream checker stats",
				"bcUpdates",
				c.stats.bcUpdates.Load(),
				"syncUpdates",
				c.stats.syncUpdates.Load(),
				"streams",
				c.stats.streams.Load(),
				"outOfSync",
				c.stats.outOfSync.Load(),
				"hashMismatch",
				c.stats.hashMismatch.Load(),
				"waitingForInit",
				c.stats.waitingForInit.Load(),
				"inSync",
				c.stats.inSync.Load(),
				"down",
				c.stats.down.Load(),
				"up",
				c.stats.up.Load(),
				"added",
				c.stats.added.Load(),
			)
		}
	}
}

func (c *streamChecker) handleUpdate(ctx context.Context, update *syncer.SyncUpdate) {
	c.stats.syncUpdates.Add(1)

	streamId, err := StreamIdFromBytes(update.Stream.GetNextSyncCookie().GetStreamId())
	if err != nil {
		dlog.FromCtx(ctx).Error("handleUpdate: Failed to parse stream id", "error", err)
		return
	}
	s, loaded := c.streams.Load(streamId)
	if !loaded {
		dlog.FromCtx(ctx).Error("handleUpdate:Stream not found", "streamId", streamId)
		return
	}

	if update.Status != syncer.SyncUpdate_Down {
		s.onSync(ctx, update, &c.stats)

		switch update.Status { //nolint:exhaustive
		case syncer.SyncUpdate_Up:
			c.stats.up.Add(1)
		case syncer.SyncUpdate_Added:
			c.stats.added.Add(1)
		}
	} else {
		c.stats.down.Add(1)
	}
}

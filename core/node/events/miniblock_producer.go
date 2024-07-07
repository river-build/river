package events

import (
	"context"
	"slices"
	"sync"

	"github.com/river-build/river/core/contracts/river"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	. "github.com/river-build/river/core/node/shared"
)

const (
	// MiniblockCandidateBatchSize keep track the max number of new miniblocks that are registered in the StreamRegistry
	// in a single transaction.
	MiniblockCandidateBatchSize = 50
)

type MiniblockProducer interface {
	Run(ctx context.Context)
}

type MiniblockProducerOpts struct {
	TestDisableMbProdcutionOnBlock bool
}

func NewMiniblockProducer(
	ctx context.Context,
	streamCache StreamCache,
	opts *MiniblockProducerOpts,
) *miniblockProducer {
	mb := &miniblockProducer{
		streamCache: streamCache,
	}
	if opts != nil {
		mb.opts = *opts
	}

	if !mb.opts.TestDisableMbProdcutionOnBlock {
		streamCache.Params().ChainMonitor.OnBlock(mb.OnNewBlock)
	}

	return mb
}

type miniblockProducer struct {
	streamCache StreamCache
	opts        MiniblockProducerOpts

	onNewBlockMutex sync.Mutex
}

var _ MiniblockProducer = (*miniblockProducer)(nil)

// OnNewBlock loops over streams and determines if it needs to produce a new mini block.
// For every stream that is eligible to produce a new mini block it creates a new mini block candidate.
// It bundles candidates in a batch.
// If the batch is full it submits the batch to the RiverRegistry#stream facet for registration and parses the resulting
// logs to determine which mini block candidate was registered and which are not. For each registered mini block
// candidate it applies the candidate to the stream.
func (p *miniblockProducer) OnNewBlock(ctx context.Context, _ crypto.BlockNumber) {
	// Try lock to have only one invocation at a time. Previous onNewBlock may still be running.
	if !p.onNewBlockMutex.TryLock() {
		return
	}

	// don't block the chain monitor
	go func() {
		defer p.onNewBlockMutex.Unlock()
		p.Run(ctx)
	}()
}

func (p *miniblockProducer) Run(ctx context.Context) {
	log := dlog.FromCtx(ctx)

	candidates := p.streamCache.GetMbCandidateStreams(ctx)

	preFilteredLen := len(candidates)

	// Drop streams that we are not the current leader for.
	candidates = slices.DeleteFunc(candidates, func(s *streamImpl) bool {
		// TODO: actual logic
		return !s.nodes.LocalIsLeader()
	})

	log.Debug(
		"MiniblockProducer: processing miniblock candidates",
		"preFilteredLen",
		preFilteredLen,
		"filteredLen",
		len(candidates),
	)

	if len(candidates) == 0 {
		return
	}

	var wg sync.WaitGroup
	for i := 0; i < len(candidates); i += MiniblockCandidateBatchSize {
		wg.Add(1)
		end := min(i+MiniblockCandidateBatchSize, len(candidates))
		go p.processCandidateBatch(ctx, candidates[i:end], wg.Done)
	}
	wg.Wait()
}

func (p *miniblockProducer) processCandidateBatch(
	ctx context.Context,
	candidates []*streamImpl,
	onDone func(),
) {
	if onDone != nil {
		defer onDone()
	}
	if len(candidates) == 0 {
		return
	}

	log := dlog.FromCtx(ctx)
	var err error

	miniblocks := make([]river.SetMiniblock, 0, len(candidates))
	proposals := map[StreamId]*MiniblockInfo{}
	streams := map[StreamId]*streamImpl{}
	for _, c := range candidates {
		// Test also creates miniblocks on demand.
		// Miniblock production code is going to be hardened to be able to handle multiple concurrent calls.
		// But this is not the case yet, to make tests stable do not attempt to create miniblock if
		// another one is already in progress.
		if !c.makeMiniblockMutex.TryLock() {
			continue
		}
		defer c.makeMiniblockMutex.Unlock()

		proposal, err := c.ProposeNextMiniblock(ctx, false)
		if err != nil {
			log.Error(
				"processMiniblockProposalBatch: Error creating new miniblock proposal",
				"streamId",
				c.streamId,
				"err",
				err,
			)
			continue
		}
		if proposal == nil {
			log.Debug("processMiniblockProposalBatch: No miniblock to produce", "streamId", c.streamId)
			continue
		}
		miniblocks = append(
			miniblocks,
			river.SetMiniblock{
				StreamId:          c.streamId,
				PrevMiniBlockHash: *proposal.headerEvent.PrevMiniblockHash,
				LastMiniblockHash: proposal.headerEvent.Hash,
				LastMiniblockNum:  uint64(proposal.Num),
				IsSealed:          false,
			},
		)
		proposals[c.streamId] = proposal
		streams[c.streamId] = c
	}

	if len(miniblocks) == 0 {
		return
	}

	var success []StreamId
	// SetStreamLastMiniblock is more efficient when registering a single block
	if len(miniblocks) == 1 {
		mb := miniblocks[0]
		err = p.streamCache.Params().Registry.SetStreamLastMiniblock(
			ctx, mb.StreamId, mb.PrevMiniBlockHash, mb.LastMiniblockHash, mb.LastMiniblockNum, false)
		if err != nil {
			log.Error("processMiniblockProposalBatch: Error registering miniblock", "streamId", mb.StreamId, "err", err)
			return
		}
		success = append(success, mb.StreamId)
	} else {
		var failed []StreamId
		success, failed, err = p.streamCache.Params().Registry.SetStreamLastMiniblockBatch(ctx, miniblocks)
		if err != nil {
			log.Error("processMiniblockProposalBatch: Error registering miniblock batch", "err", err)
			return
		}
		if len(failed) > 0 {
			log.Error("processMiniblockProposalBatch: Failed to register some miniblocks", "failed", failed)
		}
	}

	for _, streamId := range success {
		err = streams[streamId].ApplyMiniblock(ctx, proposals[streamId])
		if err != nil {
			log.Error("processMiniblockProposalBatch: Error applying miniblock", "streamId", streamId, "err", err)
		}
	}
}

package sync

import (
	"context"
	"sync"
	"time"

	"github.com/puzpuzpuz/xsync/v3"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/shared"
)

type (
	StreamsObserver interface {
		Run(ctx context.Context, interval time.Duration)
		OnSyncUpdate(streamID shared.StreamId, block int64, reset bool)
		OnRegistryUpdate(streamID shared.StreamId, block int64)
	}

	StreamOutOfSyncReporter interface {
		ReportMissingSyncMiniBlock(ctx context.Context, streamID shared.StreamId, missingMiniBlock int64)
	}

	receivedBlock struct {
		number int64
		when   time.Time
	}

	receivedMiniblocks struct {
		mu             sync.Mutex
		mustObserve    bool
		syncBlocks     []*receivedBlock
		registryBlocks []*receivedBlock
	}

	StreamsObserverImpl struct {
		reporter                   StreamOutOfSyncReporter
		percentageStreamsToObserve int
		streams                    *xsync.MapOf[shared.StreamId, *receivedMiniblocks]
		// timeout indicates that a stream sync is missing blocks when an expect block
		// isn't received within timeout.
		timeout time.Duration
	}

	StreamSyncReporter struct{}
)

func NewReceivedMiniblocksObserver(
	reporter StreamOutOfSyncReporter,
	percentageStreamsToObserve int,
	timeout time.Duration,
) *StreamsObserverImpl {
	if percentageStreamsToObserve < 0 {
		percentageStreamsToObserve = 5
	}
	if timeout <= 0 {
		timeout = 30 * time.Second
	}

	return &StreamsObserverImpl{
		reporter:                   reporter,
		percentageStreamsToObserve: percentageStreamsToObserve,
		streams:                    xsync.NewMapOf[shared.StreamId, *receivedMiniblocks](),
		timeout:                    timeout,
	}
}

func (obs *StreamsObserverImpl) Run(ctx context.Context, interval time.Duration) {
	for {
		select {
		case <-time.After(interval):
			now := time.Now()
			obs.streams.Range(func(streamID shared.StreamId, rm *receivedMiniblocks) bool {
				if block := rm.Check(now, obs.timeout); block != -1 {
					obs.reporter.ReportMissingSyncMiniBlock(ctx, streamID, block)
				}
				return true
			})
		case <-ctx.Done():
			return
		}
	}
}

func (obs *StreamsObserverImpl) OnSyncUpdate(streamID shared.StreamId, block int64, reset bool) {
	if !obs.mustObserve(streamID) {
		return
	}

	entry := &receivedMiniblocks{}
	entry, _ = obs.streams.LoadOrStore(streamID, entry)

	if reset {
		entry.syncBlocks = append(entry.syncBlocks, &receivedBlock{
			number: block,
			when:   time.Now(),
		})
		obs.streams.Store(streamID, entry)
		return
	}

	entry, _ = obs.streams.LoadOrStore(streamID, entry)
	entry.mu.Lock()
	defer entry.mu.Unlock()

	entry.syncBlocks = append(entry.syncBlocks, &receivedBlock{
		number: block,
		when:   time.Now(),
	})

	if len(entry.syncBlocks) > 50 {
		entry.syncBlocks = entry.syncBlocks[25:]
	}
}

func (obs *StreamsObserverImpl) OnRegistryUpdate(streamID shared.StreamId, block int64) {
	if !obs.mustObserve(streamID) {
		return
	}

	entry := &receivedMiniblocks{}

	entry, _ = obs.streams.LoadOrStore(streamID, entry)
	entry.mu.Lock()
	defer entry.mu.Unlock()

	entry.registryBlocks = append(entry.registryBlocks, &receivedBlock{
		number: block,
		when:   time.Now(),
	})

	if len(entry.registryBlocks) > 50 {
		entry.registryBlocks = entry.registryBlocks[25:]
	}
}

func (rm *receivedMiniblocks) Check(now time.Time, timeout time.Duration) int64 {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	// start observing when a block that is both seen in a stream sync update and smart contract event
	if !rm.mustObserve {
	outer1:
		for ridx, rblk := range rm.registryBlocks {
			for sidx, sblk := range rm.syncBlocks {
				if rblk.number == sblk.number {
					rm.registryBlocks = rm.registryBlocks[ridx+1:]
					rm.syncBlocks = rm.syncBlocks[sidx+1:]
					rm.mustObserve = true
					break outer1
				}
			}
		}
	}

	// ensure that blocks are in sync within reasonable time
	if rm.mustObserve {
		length := min(len(rm.registryBlocks), len(rm.syncBlocks))

		// drop blocks that are received through both channels
		for range length {
			if rm.registryBlocks[0].number == rm.syncBlocks[0].number {
				rm.registryBlocks = rm.registryBlocks[1:]
				rm.syncBlocks = rm.syncBlocks[1:]
			} else {
				missingBlock := rm.registryBlocks[0].number
				rm.syncBlocks = nil
				rm.registryBlocks = nil
				rm.mustObserve = false
				return missingBlock
			}
		}

		// detect if there is a missing sync block -> stream sync is missing blocks
		if len(rm.registryBlocks) > 0 {
			howLongAgoReceived := time.Since(rm.registryBlocks[0].when)
			if howLongAgoReceived > timeout {
				missingBlock := rm.registryBlocks[0].number
				// reset observation
				rm.registryBlocks = nil
				rm.syncBlocks = nil
				rm.mustObserve = false
				return missingBlock
			}
		}
	}

	return -1
}

func (obs *StreamsObserverImpl) mustObserve(streamID shared.StreamId) bool {
	v := (int(streamID[5])<<24 | int(streamID[6])<<16 | int(streamID[7])<<8 | int(streamID[8])) % 100
	return v < obs.percentageStreamsToObserve
}

func (StreamSyncReporter) Report(ctx context.Context, streamID shared.StreamId, block int64) {
	dlog.FromCtx(ctx).Warn("Stream sync missed block", "stream", streamID, "block", block)
}

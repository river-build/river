package scrub

import (
	"context"
	"fmt"

	"github.com/gammazero/workerpool"

	"github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
)

type MiniblockScrubber interface {
	ScheduleStreamMiniblocksScrub(
		ctx context.Context,
		streamId shared.StreamId,
		fromBlockNum int64,
	) error
	Close()
}

type miniblockScrubTaskProcessorImpl struct {
	store      storage.StreamStorage
	workerPool workerpool.WorkerPool
	reports    chan *MiniblockScrubReport
}

var _ MiniblockScrubber = (*miniblockScrubTaskProcessorImpl)(nil)

type MiniblockScrubReport struct {
	StreamId            shared.StreamId
	LatestBlockScrubbed int64 // -1 if no blocks scrubbed
	FirstCorruptBlock   int64 // -1 if no blocks corrupt
	ScrubError          error
}

func newErrorReport(streamId shared.StreamId, scrubErr error, errorBlock int64) *MiniblockScrubReport {
	return &MiniblockScrubReport{
		StreamId:            streamId,
		LatestBlockScrubbed: errorBlock - 1,
		FirstCorruptBlock:   -1,
		ScrubError:          scrubErr,
	}
}

func newCorruptStreamReport(streamId shared.StreamId, scrubErr error, errorBlock int64) *MiniblockScrubReport {
	return &MiniblockScrubReport{
		StreamId:            streamId,
		LatestBlockScrubbed: errorBlock - 1,
		FirstCorruptBlock:   errorBlock,
		ScrubError:          scrubErr,
	}
}

func newSuccessReport(streamId shared.StreamId, latestBlockScrubbed int64) *MiniblockScrubReport {
	return &MiniblockScrubReport{
		StreamId:            streamId,
		LatestBlockScrubbed: latestBlockScrubbed,
		FirstCorruptBlock:   -1,
	}
}

func NewMiniblockScrubber(
	store storage.StreamStorage,
	numWorkers int,
	reports chan *MiniblockScrubReport,
) MiniblockScrubber {
	if numWorkers <= 0 {
		numWorkers = 100
	}
	return &miniblockScrubTaskProcessorImpl{
		store:      store,
		reports:    reports,
		workerPool: *workerpool.New(numWorkers),
	}
}

// Close releases all miniblockScrubTaskProcessorImpl resources. It blocks until
// all go routines are stopped.
func (m *miniblockScrubTaskProcessorImpl) Close() {
	done := make(chan bool)

	go func() {
		m.workerPool.Stop()
		close(done)
	}()

	// Drain the reports queue so that the workerpool close is unblocked. (After
	// the task processor is closed, we do not expect the remaining reports
	// to be valuable to the consumer.)
	for {
		select {
		case <-m.reports:
			continue
		case <-done:
			return
		}
	}
}

var maxBlocksPerScan = 100

func optsFromPrevMiniblock(prevMb *events.MiniblockInfo) events.NewMiniblockInfoFromProtoOpts {
	expectedPrevSnapshotNum := prevMb.Header().PrevSnapshotMiniblockNum
	if prevMb.Header().Snapshot != nil {
		expectedPrevSnapshotNum = prevMb.Header().MiniblockNum
	}
	return events.NewMiniblockInfoFromProtoOpts{
		ExpectedBlockNumber:               prevMb.Header().MiniblockNum + 1,
		ExpectedLastMiniblockHash:         prevMb.Ref.Hash,
		ExpectedEventNumOffset:            prevMb.Header().EventNumOffset + int64(len(prevMb.Events())+1),
		ExpectedMinimumTimestampExclusive: prevMb.Header().Timestamp.AsTime(),
		ExpectedPrevSnapshotMiniblockNum:  expectedPrevSnapshotNum,
	}
}

func (m *miniblockScrubTaskProcessorImpl) scrubMiniblocks(
	ctx context.Context,
	streamId shared.StreamId,
	fromBlockNumInclusive int64,
) *MiniblockScrubReport {
	blockNum := fromBlockNumInclusive
	latest, err := m.store.GetLastMiniblockNumber(ctx, streamId)
	if err != nil {
		return newErrorReport(
			streamId,
			base.AsRiverError(err, protocol.Err_DB_OPERATION_FAILURE).
				Message("Unable to get last miniblock number for stream").
				Tag("streamId", streamId).
				Tag("fromBlockNum", fromBlockNumInclusive),
			blockNum,
		)
	}

	// Initialize miniblock options based on previous miniblock state
	// If the miniblock is block 0, an empty options is fine.
	opts := events.NewMiniblockInfoFromProtoOpts{}
	if blockNum > 0 {
		prevBlock, err := m.store.ReadMiniblocks(ctx, streamId, blockNum-1, blockNum)
		if err != nil || len(prevBlock) < 1 {
			if len(prevBlock) < 1 {
				err = fmt.Errorf("Previous miniblock was not available")
			}

			return newErrorReport(
				streamId,
				base.AsRiverError(err, protocol.Err_DB_OPERATION_FAILURE).
					Message("Unable to read previous miniblock for stream").
					Tag("streamId", streamId).
					Tag("fromBlockNum", fromBlockNumInclusive).
					Tag("prevBlock", blockNum-1),
				blockNum,
			)
		}

		prevMb, err := events.NewMiniblockInfoFromBytes(prevBlock[0], blockNum-1)
		if err != nil {
			// Don't return a corruption error here because the previous block is outside
			// of the range we were given to check.
			return newErrorReport(
				streamId,
				base.AsRiverError(err, protocol.Err_BAD_BLOCK).
					Message("Unable to parse previous miniblock for stream").
					Tag("streamId", streamId).
					Tag("fromBlockNum", fromBlockNumInclusive).
					Tag("prevBlock", blockNum-1),
				blockNum,
			)
		}

		opts = optsFromPrevMiniblock(prevMb)
	}

	for blockNum <= latest {
		toExclusive := min(blockNum+int64(maxBlocksPerScan), latest+1)
		blocks, err := m.store.ReadMiniblocks(ctx, streamId, blockNum, toExclusive)
		if err != nil {
			return newErrorReport(
				streamId,
				base.AsRiverError(err, protocol.Err_DB_OPERATION_FAILURE).
					Message("Unable to read miniblocks for stream").
					Tag("streamId", streamId).
					Tag("fromInclusive", blockNum).
					Tag("toExclusive", blockNum+int64(maxBlocksPerScan)),
				blockNum,
			)
		}

		if len(blocks) == 0 {
			return newErrorReport(
				streamId,
				base.RiverError(
					protocol.Err_DB_OPERATION_FAILURE,
					"Unable to read latest miniblocks").
					Tag("lastAvailableBlockNum", blockNum-1).
					Tag("latestBlockNum", latest),
				blockNum,
			)
		}

		for offset, block := range blocks {
			mbInfo, err := events.NewMiniblockInfoFromBytesWithOpts(block, opts)
			if err != nil {
				err = base.AsRiverError(err, protocol.Err_DB_OPERATION_FAILURE).
					Message("Failed to validate miniblock").
					Tag("streamId", streamId).
					Tag("miniblockNum", blockNum+int64(offset))
				return newCorruptStreamReport(streamId, err, blockNum+int64(offset))
			}
			opts = optsFromPrevMiniblock(mbInfo)
		}
		blockNum = blockNum + int64(len(blocks))
	}

	return newSuccessReport(streamId, latest)
}

func (m *miniblockScrubTaskProcessorImpl) ScheduleStreamMiniblocksScrub(
	ctx context.Context,
	streamId shared.StreamId,
	fromBlockNum int64,
) error {
	latest, err := m.store.GetLastMiniblockNumber(ctx, streamId)
	if err != nil {
		return base.AsRiverError(err, protocol.Err_DB_OPERATION_FAILURE).
			Func("ScheduleStreamMiniblockScrub").
			Message("Unable to fetch latest miniblock number of stream").
			Tag("streamId", streamId).
			Tag("fromBlockNum", fromBlockNum)
	}

	if latest < fromBlockNum {
		return base.RiverError(protocol.Err_MINIBLOCK_TOO_NEW, "Miniblock has not caught up to fromBlockNum").
			Func("ScheduleStreamMiniblockScrub").
			Tag("streamId", streamId).
			Tag("fromBlockNum", fromBlockNum).
			Tag("latest", latest)
	}

	m.workerPool.Submit(
		func() {
			m.reports <- m.scrubMiniblocks(ctx, streamId, fromBlockNum)
		},
	)

	return nil
}

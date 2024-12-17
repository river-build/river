package sync_test

import (
	"context"
	"crypto/rand"
	"testing"
	"time"

	"github.com/puzpuzpuz/xsync/v3"
	"github.com/river-build/river/core/node/notifications/sync"
	"github.com/river-build/river/core/node/shared"
	"github.com/stretchr/testify/require"
)

type StreamSyncReporterCapturer struct {
	missingBlocks *xsync.MapOf[shared.StreamId, []int64]
}

func (ssrc *StreamSyncReporterCapturer) ReportMissingSyncMiniBlock(ctx context.Context, streamID shared.StreamId, missingMiniBlock int64) {
	blocks := []int64{missingMiniBlock}
	got, ok := ssrc.missingBlocks.LoadOrStore(streamID, blocks)
	if ok {
		got = append(got, missingMiniBlock)
		ssrc.missingBlocks.Store(streamID, got)
	}
}

// TestStreamsTrackerObserverAllGood tests if the streams observer tracks streams correct when sync is reliable.
func TestStreamsTrackerObserverAllGood(t *testing.T) {
	t.Parallel()

	var (
		ctx, cancel       = context.WithTimeout(context.Background(), 10*time.Second)
		checkInterval     = 100 * time.Millisecond
		percentageToTrack = 100
		reporter          = &StreamSyncReporterCapturer{
			missingBlocks: xsync.NewMapOf[shared.StreamId, []int64](),
		}
		timeout   = 5 * time.Second
		streamIDs []shared.StreamId
		req       = require.New(t)
	)
	defer cancel()

	observer := sync.NewReceivedMiniblocksObserver(reporter, percentageToTrack, timeout)
	go observer.Run(ctx, checkInterval)

	for range 100 {
		var streamID shared.StreamId
		streamID[0] = shared.STREAM_CHANNEL_BIN
		_, err := rand.Read(streamID[1:32])
		req.NoError(err)
		streamIDs = append(streamIDs, streamID)
	}

	for b := range int64(5) {
		for i, streamID := range streamIDs {
			if i%2 == 0 {
				observer.OnRegistryUpdate(streamID, b)
				observer.OnSyncUpdate(streamID, b, b == 0)
			} else {
				observer.OnSyncUpdate(streamID, b, b == 0)
				observer.OnRegistryUpdate(streamID, b)
			}
		}
	}

	req.Never(func() bool {
		return reporter.missingBlocks.Size() != 0
	}, 10*time.Second, 100*time.Millisecond, "Stream sync reported unreliable")
}

// TestStreamsTrackerObserverWithMissingSyncBlock tests if the streams observer detects when a stream sync
// misses a block.
func TestStreamsTrackerObserverWithMissingSyncBlock(t *testing.T) {
	t.Parallel()

	var (
		ctx, cancel       = context.WithTimeout(context.Background(), 10*time.Second)
		checkInterval     = 100 * time.Millisecond
		percentageToTrack = 100
		reporter          = &StreamSyncReporterCapturer{
			missingBlocks: xsync.NewMapOf[shared.StreamId, []int64](),
		}
		timeout = 5 * time.Second
		req     = require.New(t)
	)
	defer cancel()

	observer := sync.NewReceivedMiniblocksObserver(reporter, percentageToTrack, timeout)
	go observer.Run(ctx, checkInterval)

	var streamID shared.StreamId

	streamID[0] = shared.STREAM_CHANNEL_BIN
	_, err := rand.Read(streamID[1:32])
	req.NoError(err)

	observer.OnRegistryUpdate(streamID, 0)
	observer.OnSyncUpdate(streamID, 0, false)
	observer.OnRegistryUpdate(streamID, 1)
	observer.OnSyncUpdate(streamID, 1, false)
	observer.OnRegistryUpdate(streamID, 2)
	missingBlock := int64(2) // observer.OnSyncUpdate(streamID, 2, false) missing
	observer.OnRegistryUpdate(streamID, 3)
	observer.OnSyncUpdate(streamID, 3, false)

	req.Never(func() bool {
		blocks, ok := reporter.missingBlocks.Load(streamID)
		if !ok {
			return false // possible too fast
		}

		if len(blocks) != 1 {
			return false
		}

		return blocks[0] != missingBlock
	}, 10*time.Second, 500*time.Millisecond, "Stream reported wrongly as reliable/unreliable")

	blocks, _ := reporter.missingBlocks.Load(streamID)
	req.Equal(missingBlock, blocks[0])
}

// TestStreamsTrackerObserverWithTooSlowSyncBlock tests if the streams observer detects when a stream sync
// doesn't receive a block that the river registry contract did report to be available.
func TestStreamsTrackerObserverWithTooSlowSyncBlock(t *testing.T) {
	t.Parallel()

	var (
		ctx, cancel       = context.WithTimeout(context.Background(), 10*time.Second)
		checkInterval     = 100 * time.Millisecond
		percentageToTrack = 100
		reporter          = &StreamSyncReporterCapturer{
			missingBlocks: xsync.NewMapOf[shared.StreamId, []int64](),
		}
		timeout = 5 * time.Second
		req     = require.New(t)
	)
	defer cancel()

	observer := sync.NewReceivedMiniblocksObserver(reporter, percentageToTrack, timeout)
	go observer.Run(ctx, checkInterval)

	var streamID shared.StreamId

	streamID[0] = shared.STREAM_CHANNEL_BIN
	_, err := rand.Read(streamID[1:32])
	req.NoError(err)

	observer.OnRegistryUpdate(streamID, 0)
	observer.OnSyncUpdate(streamID, 0, false)
	observer.OnRegistryUpdate(streamID, 1)
	observer.OnSyncUpdate(streamID, 1, false)
	observer.OnRegistryUpdate(streamID, 2)
	observer.OnSyncUpdate(streamID, 2, false)
	observer.OnRegistryUpdate(streamID, 3)
	missingBlock := int64(3) // observer.OnSyncUpdate(streamID, 3, false) never happens

	req.Eventually(func() bool {
		blocks, ok := reporter.missingBlocks.Load(streamID)
		if !ok {
			return false // possible too fast
		}

		if len(blocks) != 1 {
			return false
		}

		return blocks[0] == missingBlock
	}, 10*time.Second, 500*time.Millisecond, "Stream reported wrongly as reliable/unreliable")
}

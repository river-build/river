package rpc

import (
	"context"
	"errors"
	"time"

	"github.com/puzpuzpuz/xsync/v3"

	"github.com/river-build/river/core/node/logging"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
)

// ephemeralStreamMonitor is a monitor that keeps track of ephemeral streams and cleans up dead ones.
type ephemeralStreamMonitor struct {
	// ephemeralStreams is a map of ephemeral stream IDs to the time they were last updated.
	ephemeralStreams *xsync.MapOf[StreamId, time.Time]

	storage storage.StreamStorage
}

// newEphemeralStreamMonitor creates and starts a dead ephemeral stream monitor.
func newEphemeralStreamMonitor(
	ctx context.Context,
	storage storage.StreamStorage,
) (*ephemeralStreamMonitor, error) {
	m := &ephemeralStreamMonitor{
		ephemeralStreams: xsync.NewMapOf[StreamId, time.Time](),
		storage:          storage,
	}

	// Load all ephemeral streams from the database.
	if err := m.loadEphemeralStreams(ctx); err != nil {
		return nil, err
	}

	// Start the dead stream monitor.
	go m.monitor(ctx)

	return m, nil
}

// monitor is the main loop of the dead ephemeral stream clean up procedure.
func (m *ephemeralStreamMonitor) monitor(ctx context.Context) {
	const (
		cleanupInterval = time.Minute
		ttl             = time.Minute * 10
	)

	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			if err := ctx.Err(); !errors.Is(err, context.Canceled) {
				logging.FromCtx(ctx).Error("dead ephemeral stream monitor stopped", "err", err)
			}
			return
		case <-ticker.C:
			m.ephemeralStreams.Range(func(streamId StreamId, lastUpdated time.Time) bool {
				if time.Since(lastUpdated) > ttl {
					if err := m.storage.DeleteEphemeralStream(ctx, streamId); err != nil {
						logging.FromCtx(ctx).Error("failed to delete dead ephemeral stream", "err", err, "streamId", streamId)
					}

					m.ephemeralStreams.Delete(streamId)
				}

				return true
			})
		}
	}
}

// onUpdated is called when a stream is updated, e.g. new ephemeral miniblock was added.
func (m *ephemeralStreamMonitor) onUpdated(streamId StreamId) {
	m.ephemeralStreams.Store(streamId, time.Now())
}

// onSealed is called when a stream is sealed, i.e. the ephemeral stream was normalized.
func (m *ephemeralStreamMonitor) onSealed(streamId StreamId) {
	m.ephemeralStreams.Delete(streamId)
}

// loadEphemeralStreams loads all ephemeral streams from the database.
func (m *ephemeralStreamMonitor) loadEphemeralStreams(ctx context.Context) error {
	ephemeralStreams, err := m.storage.GetEphemeralStreams(ctx)
	if err != nil {
		return err
	}

	for _, streamId := range ephemeralStreams {
		// This is fine to assume that the last update timestamp is now since this function
		// called only once on startup.
		m.ephemeralStreams.Store(streamId, time.Now())
	}

	return nil
}

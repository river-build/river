package rpc

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/river-build/river/core/node/logging"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
)

type deadEphemeralStreamMonitor struct {
	sync.Mutex

	// ephemeralStreams is a map of ephemeral stream IDs to the time they were last updated.
	ephemeralStreams map[StreamId]time.Time

	storage storage.StreamStorage
}

// start starts the dead ephemeral stream monitor.
func (m *deadEphemeralStreamMonitor) start(ctx context.Context) error {
	// Load all ephemeral streams from the database.
	if err := m.loadEphemeralStreams(ctx); err != nil {
		return err
	}

	// Start the dead stream monitor.
	go m.monitor(ctx)

	return nil
}

// monitor is the main loop of the dead ephemeral stream clean up procedure.
func (m *deadEphemeralStreamMonitor) monitor(ctx context.Context) {
	const (
		cleanupInterval = time.Minute * 5
		ttl             = time.Minute * 5
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
			m.Lock()
			for streamId, lastUpdated := range m.ephemeralStreams {
				if time.Since(lastUpdated) <= ttl {
					continue
				}

				if err := m.storage.DeleteEphemeralStream(ctx, streamId); err != nil {
					logging.FromCtx(ctx).Error("failed to delete dead ephemeral stream", "err", err, "streamId", streamId)
				} else {
					delete(m.ephemeralStreams, streamId)
				}
			}
			m.Unlock()
		}
	}

}

// onUpdated is called when a stream is updated, e.g. new ephemeral miniblock was added.
func (m *deadEphemeralStreamMonitor) onUpdated(streamId StreamId) {
	m.Lock()
	m.ephemeralStreams[streamId] = time.Now()
	m.Unlock()
}

// onSealed is called when a stream is sealed, i.e. the ephemeral stream was normalized.
func (m *deadEphemeralStreamMonitor) onSealed(streamId StreamId) {
	m.Lock()
	delete(m.ephemeralStreams, streamId)
	m.Unlock()
}

// loadEphemeralStreams loads all ephemeral streams from the database.
func (m *deadEphemeralStreamMonitor) loadEphemeralStreams(ctx context.Context) error {
	ephemeralStreams, err := m.storage.GetEphemeralStreams(ctx)
	if err != nil {
		return err
	}

	m.Lock()
	m.ephemeralStreams = make(map[StreamId]time.Time, len(ephemeralStreams))
	for _, streamId := range ephemeralStreams {
		// This is fine to assume that the last update timestamp is now since this function
		// called only once on startup.
		m.ephemeralStreams[streamId] = time.Now()
	}
	m.Unlock()

	return nil
}

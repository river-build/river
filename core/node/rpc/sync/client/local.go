package client

import (
	"context"

	"github.com/ethereum/go-ethereum/common"
	"github.com/linkdata/deadlock"
	. "github.com/towns-protocol/towns/core/node/base"
	. "github.com/towns-protocol/towns/core/node/events"
	"github.com/towns-protocol/towns/core/node/logging"
	. "github.com/towns-protocol/towns/core/node/protocol"
	. "github.com/towns-protocol/towns/core/node/shared"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

type localSyncer struct {
	globalSyncOpID string

	syncStreamCtx      context.Context
	cancelGlobalSyncOp context.CancelCauseFunc

	streamCache *StreamCache
	cookies     []*SyncCookie
	messages    chan<- *SyncStreamsResponse
	localAddr   common.Address

	activeStreamsMu deadlock.Mutex
	activeStreams   map[StreamId]*Stream

	// otelTracer is used to trace individual sync Send operations, tracing is disabled if nil
	otelTracer trace.Tracer
}

func newLocalSyncer(
	ctx context.Context,
	globalSyncOpID string,
	cancelGlobalSyncOp context.CancelCauseFunc,
	localAddr common.Address,
	streamCache *StreamCache,
	cookies []*SyncCookie,
	messages chan<- *SyncStreamsResponse,
	otelTracer trace.Tracer,
) (*localSyncer, error) {
	return &localSyncer{
		globalSyncOpID:     globalSyncOpID,
		syncStreamCtx:      ctx,
		cancelGlobalSyncOp: cancelGlobalSyncOp,
		streamCache:        streamCache,
		localAddr:          localAddr,
		cookies:            cookies,
		messages:           messages,
		activeStreams:      make(map[StreamId]*Stream),
		otelTracer:         otelTracer,
	}, nil
}

func (s *localSyncer) Run() {
	log := logging.FromCtx(s.syncStreamCtx)
	for _, cookie := range s.cookies {
		streamID, _ := StreamIdFromBytes(cookie.GetStreamId())
		if err := s.addStream(s.syncStreamCtx, streamID, cookie); err != nil {
			log.Errorw("Unable to add local sync stream", "stream", streamID, "err", err)
		}
	}

	<-s.syncStreamCtx.Done()

	s.activeStreamsMu.Lock()
	defer s.activeStreamsMu.Unlock()

	for streamID, syncStream := range s.activeStreams {
		syncStream.Unsub(s)
		delete(s.activeStreams, streamID)
	}
}

func (s *localSyncer) Address() common.Address {
	return s.localAddr
}

func (s *localSyncer) AddStream(ctx context.Context, cookie *SyncCookie) error {
	if s.otelTracer != nil {
		var span trace.Span
		streamID, _ := StreamIdFromBytes(cookie.GetStreamId())
		ctx, span = s.otelTracer.Start(ctx, "localSyncer::AddStream",
			trace.WithAttributes(attribute.String("stream", streamID.String())))
		defer span.End()
	}

	streamID, err := StreamIdFromBytes(cookie.GetStreamId())
	if err != nil {
		return err
	}
	return s.addStream(ctx, streamID, cookie)
}

func (s *localSyncer) RemoveStream(ctx context.Context, streamID StreamId) (bool, error) {
	if s.otelTracer != nil {
		_, span := s.otelTracer.Start(ctx, "localSyncer::removeStream",
			trace.WithAttributes(attribute.String("stream", streamID.String())))
		defer span.End()
	}

	s.activeStreamsMu.Lock()
	defer s.activeStreamsMu.Unlock()

	syncStream, found := s.activeStreams[streamID]
	if found {
		syncStream.Unsub(s)
		delete(s.activeStreams, streamID)
	}

	return len(s.activeStreams) == 0, nil
}

// OnUpdate is called each time a new cookie is available for a stream
func (s *localSyncer) OnUpdate(r *StreamAndCookie) {
	select {
	case s.messages <- &SyncStreamsResponse{SyncOp: SyncOp_SYNC_UPDATE, Stream: r}:
		return
	case <-s.syncStreamCtx.Done():
		return
	default:
		err := RiverError(Err_BUFFER_FULL, "Client sync subscription message channel is full").
			Tag("syncId", s.globalSyncOpID).
			Func("OnUpdate")

		_ = err.LogError(logging.FromCtx(s.syncStreamCtx))

		s.cancelGlobalSyncOp(err)
	}
}

// OnSyncError is called when a sync subscription failed unrecoverable
func (s *localSyncer) OnSyncError(error) {
	s.activeStreamsMu.Lock()
	defer s.activeStreamsMu.Unlock()

	for streamID, syncStream := range s.activeStreams {
		syncStream.Unsub(s)
		delete(s.activeStreams, streamID)
		s.OnStreamSyncDown(streamID)
	}
}

// OnStreamSyncDown is called when updates for a stream could not be given.
func (s *localSyncer) OnStreamSyncDown(streamID StreamId) {
	select {
	case s.messages <- &SyncStreamsResponse{SyncOp: SyncOp_SYNC_DOWN, StreamId: streamID[:]}:
		return
	case <-s.syncStreamCtx.Done():
		return
	default:
		err := RiverError(Err_BUFFER_FULL, "Client sync subscription message channel is full").
			Tag("syncId", s.globalSyncOpID).
			Func("sendSyncStreamResponseToClient")

		_ = err.LogError(logging.FromCtx(s.syncStreamCtx))

		s.cancelGlobalSyncOp(err)
	}
}

func (s *localSyncer) addStream(ctx context.Context, streamID StreamId, cookie *SyncCookie) error {
	s.activeStreamsMu.Lock()
	defer s.activeStreamsMu.Unlock()

	// prevent subscribing multiple times on the same stream
	if _, found := s.activeStreams[streamID]; found {
		return nil
	}

	syncStream, err := s.streamCache.GetStreamWaitForLocal(ctx, streamID)
	if err != nil {
		return err
	}

	if err := syncStream.Sub(ctx, cookie, s); err != nil {
		return err
	}

	s.activeStreams[streamID] = syncStream

	return nil
}

func (s *localSyncer) DebugDropStream(_ context.Context, streamID StreamId) (bool, error) {
	s.activeStreamsMu.Lock()
	defer s.activeStreamsMu.Unlock()

	syncStream, found := s.activeStreams[streamID]
	if found {
		syncStream.Unsub(s)
		delete(s.activeStreams, streamID)
		s.OnStreamSyncDown(streamID)
		return false, nil
	}

	return false, RiverError(Err_NOT_FOUND, "stream not found").Tag("stream", streamID)
}

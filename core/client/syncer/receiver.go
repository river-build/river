package syncer

import (
	"context"
	"sync"
	"time"

	"connectrpc.com/connect"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	. "github.com/river-build/river/core/node/shared"
)

type SyncUpdateStatus int

const (
	SyncUpdate_Update SyncUpdateStatus = iota
	SyncUpdate_Down
	SyncUpdate_Up
	SyncUpdate_Added
)

type SyncUpdate struct {
	Status SyncUpdateStatus
	Id     StreamId
	Stream *StreamAndCookie
}

type SyncReceiver interface {
	AddStream(ctx context.Context, stream StreamId, cookie *SyncCookie, c chan<- *SyncUpdate) error
}

func StartSyncReceiver(
	ctx context.Context,
	stub protocolconnect.StreamServiceClient,
	onSyncExit chan<- error,
) (SyncReceiver, error) {
	resp, err := stub.SyncStreams(ctx, connect.NewRequest(&SyncStreamsRequest{}))
	if err != nil {
		return nil, err
	}

	// Receive syncId
	received := resp.Receive()
	if !received {
		return nil, resp.Err()
	}

	msg := resp.Msg()
	if msg.SyncOp != SyncOp_SYNC_NEW {
		defer resp.Close()
		return nil, RiverError(Err_BAD_SYNC_COOKIE, "expected new sync", "syncOp", msg.SyncOp)
	}

	receiver := &syncReceiver{
		syncId:  msg.SyncId,
		stub:    stub,
		streams: make(map[StreamId]*streamInfo),
	}

	go receiver.receive(ctx, resp, onSyncExit)

	return receiver, nil
}

type streamInfoStatus int

const (
	streamInfoStatus_Ok streamInfoStatus = iota
	streamInfoStatus_Added
	streamInfoStatus_Down
)

type streamInfo struct {
	cookie *SyncCookie
	status streamInfoStatus
	ch     chan<- *SyncUpdate
}

type syncReceiver struct {
	syncId string
	stub   protocolconnect.StreamServiceClient

	mu      sync.Mutex
	streams map[StreamId]*streamInfo
}

var _ SyncReceiver = &syncReceiver{}

func (s *syncReceiver) receive(
	ctx context.Context,
	resp *connect.ServerStreamForClient[SyncStreamsResponse],
	onSyncExit chan<- error,
) {
	log := dlog.FromCtx(ctx)
	defer resp.Close()

	for {
		select {
		case <-ctx.Done():
			onSyncExit <- ctx.Err()
			return
		default:
			received := resp.Receive()
			if !received {
				onSyncExit <- resp.Err()
				return
			}

			msg := resp.Msg()
			log.Debug("received sync message", "syncId", s.syncId, "msg", msg)
			switch msg.SyncOp {
			case SyncOp_SYNC_NEW:
				onSyncExit <- RiverError(Err_BAD_SYNC_COOKIE, "only one SYNC_NEW is expected", "syncId", s.syncId).LogError(log)
				return
			case SyncOp_SYNC_CLOSE:
				log.Info("received sync close", "syncId", s.syncId)
				onSyncExit <- nil
				return
			case SyncOp_SYNC_UPDATE:
				s.handleUpdate(ctx, msg)
			case SyncOp_SYNC_PONG:
				s.handlePong(ctx, msg)
			case SyncOp_SYNC_DOWN:
				s.handleDown(ctx, msg)
			case SyncOp_SYNC_UNSPECIFIED:
				fallthrough
			default:
				log.Error("unknown sync op", "syncId", s.syncId, "syncOp", msg.SyncOp)
			}
		}
	}
}

func (s *syncReceiver) handleUpdate(ctx context.Context, msg *SyncStreamsResponse) {
	log := dlog.FromCtx(ctx)

	ch, update, err := s.handleUpdateImpl(ctx, msg)
	if err != nil {
		log.Error("error handling update", "syncId", s.syncId, "error", err)
		return
	}

	ch <- update
}

func (s *syncReceiver) handleUpdateImpl(
	ctx context.Context,
	msg *SyncStreamsResponse,
) (chan<- *SyncUpdate, *SyncUpdate, error) {
	id, err := StreamIdFromBytes(msg.Stream.GetNextSyncCookie().GetStreamId())
	if err != nil {
		return nil, nil, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	stream, ok := s.streams[id]
	if !ok {
		return nil, nil, RiverError(
			Err_BAD_SYNC_COOKIE,
			"stream not found in sync",
			"streamId",
			stream,
			"syncId",
			s.syncId,
		)
	}

	stream.cookie = msg.Stream.GetNextSyncCookie()

	upd := SyncUpdate_Update
	if stream.status == streamInfoStatus_Down {
		upd = SyncUpdate_Up
		// TODO: cancel retries
	} else if stream.status == streamInfoStatus_Added {
		upd = SyncUpdate_Added
	}
	stream.status = streamInfoStatus_Ok

	return stream.ch, &SyncUpdate{
		Status: upd,
		Id:     id,
		Stream: msg.Stream,
	}, nil
}

func (s *syncReceiver) handlePong(ctx context.Context, msg *SyncStreamsResponse) {
	log := dlog.FromCtx(ctx)

	log.Info("received pong", "syncId", s.syncId, "pong", msg.PongNonce)

	// TODO: handle pong
}

func (s *syncReceiver) handleDown(ctx context.Context, msg *SyncStreamsResponse) {
	log := dlog.FromCtx(ctx)

	log.Info("received down", "syncId", s.syncId, "streamId", msg.StreamId)

	ch, update, err := s.handleDownImpl(ctx, msg)
	if err != nil {
		log.Error("error handling down", "syncId", s.syncId, "error", err)
		return
	}

	ch <- update

	go s.retryDownStream(ctx, update.Id)
}

func (s *syncReceiver) handleDownImpl(
	ctx context.Context,
	msg *SyncStreamsResponse,
) (chan<- *SyncUpdate, *SyncUpdate, error) {
	id, err := StreamIdFromBytes(msg.GetStreamId())
	if err != nil {
		return nil, nil, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	stream, ok := s.streams[id]
	if !ok {
		return nil, nil, RiverError(
			Err_BAD_SYNC_COOKIE,
			"stream not found in sync",
			"streamId",
			stream,
			"syncId",
			s.syncId,
		)
	}

	if stream.status == streamInfoStatus_Down {
		dlog.FromCtx(ctx).Error("stream already down", "streamId", id, "syncId", s.syncId)
	}
	stream.status = streamInfoStatus_Down

	return stream.ch, &SyncUpdate{
		Status: SyncUpdate_Down,
		Id:     id,
	}, nil
}

func (s *syncReceiver) AddStream(
	ctx context.Context,
	streamId StreamId,
	cookie *SyncCookie,
	c chan<- *SyncUpdate,
) error {
	dlog.FromCtx(ctx).Debug("adding stream to sync", "syncId", s.syncId, "cookie", cookie)

	s.insertStream(ctx, streamId, cookie, c)

	_, err := s.stub.AddStreamToSync(ctx, connect.NewRequest(&AddStreamToSyncRequest{
		SyncId:  s.syncId,
		SyncPos: cookie,
	}))
	if err != nil {
		// Notice that this error can be a transport error, and stream still can be successfully added
		// in this case, because of this it can't be removed from the map here.
		return err
	}

	// TODO: add monitor for this stream to become added.
	return nil
}

func (s *syncReceiver) insertStream(
	ctx context.Context,
	streamId StreamId,
	cookie *SyncCookie,
	c chan<- *SyncUpdate,
) {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, exists := s.streams[streamId]
	if exists {
		dlog.FromCtx(ctx).
			Warn("stream already added to sync, maybe this is a retry on transport error", "streamId", streamId, "syncId", s.syncId)
		return
	}

	s.streams[streamId] = &streamInfo{
		cookie: cookie,
		status: streamInfoStatus_Added,
		ch:     c,
	}
}

func (s *syncReceiver) getRetryCookie(streamId StreamId) *SyncCookie {
	s.mu.Lock()
	defer s.mu.Unlock()

	stream, ok := s.streams[streamId]
	if !ok || stream.status != streamInfoStatus_Down {
		return nil
	}
	return stream.cookie
}

func (s *syncReceiver) retryDownStream(ctx context.Context, streamId StreamId) {
	dlog.FromCtx(ctx).Debug("retrying down stream", "streamId", streamId, "syncId", s.syncId)

	duration := 1 * time.Second
	timer := time.NewTimer(duration)
	defer timer.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-timer.C:
			cookie := s.getRetryCookie(streamId)
			if cookie == nil {
				return
			}

			_, err := s.stub.AddStreamToSync(ctx, connect.NewRequest(&AddStreamToSyncRequest{
				SyncId:  s.syncId,
				SyncPos: cookie,
			}))
			if err == nil {
				dlog.FromCtx(ctx).Debug("stream added back to sync", "streamId", streamId, "syncId", s.syncId)
				// TODO: add monitor for this stream to become up.
				return
			}

			duration := max(duration*2, 30*time.Second)
			timer.Reset(duration)
		}
	}
}

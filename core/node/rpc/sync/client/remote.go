package client

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	. "github.com/river-build/river/core/node/shared"
)

type remoteSyncer struct {
	cancelGlobalSyncOp context.CancelFunc
	syncStreamCtx      context.Context
	syncStreamCancel   context.CancelFunc
	syncID             string
	forwarderSyncID    string
	remoteAddr         common.Address
	client             protocolconnect.StreamServiceClient
	cookies            []*SyncCookie
	messages           chan<- *SyncStreamsResponse
	streams            sync.Map
	responseStream     *connect.ServerStreamForClient[SyncStreamsResponse]
}

func newRemoteSyncer(
	ctx context.Context,
	cancelGlobalSyncOp context.CancelFunc,
	forwarderSyncID string,
	remoteAddr common.Address,
	client protocolconnect.StreamServiceClient,
	cookies []*SyncCookie,
	messages chan<- *SyncStreamsResponse,
) (*remoteSyncer, error) {
	syncStreamCtx, syncStreamCancel := context.WithCancel(ctx)
	responseStream, err := client.SyncStreams(syncStreamCtx, connect.NewRequest(&SyncStreamsRequest{SyncPos: cookies}))
	if err != nil {
		for _, cookie := range cookies {
			messages <- &SyncStreamsResponse{
				SyncOp:   SyncOp_SYNC_DOWN,
				StreamId: cookie.GetStreamId(),
			}
		}
		syncStreamCancel()
		return nil, err
	}

	if !responseStream.Receive() {
		syncStreamCancel()
		return nil, responseStream.Err()
	}

	log := dlog.FromCtx(ctx)

	if responseStream.Msg().GetSyncOp() != SyncOp_SYNC_NEW || responseStream.Msg().GetSyncId() == "" {
		log.Error("Received unexpected sync stream message",
			"syncOp", responseStream.Msg().SyncOp,
			"syncId", responseStream.Msg().SyncId)
		syncStreamCancel()
		return nil, err
	}

	s := &remoteSyncer{
		forwarderSyncID:    forwarderSyncID,
		cancelGlobalSyncOp: cancelGlobalSyncOp,
		syncStreamCtx:      syncStreamCtx,
		syncStreamCancel:   syncStreamCancel,
		client:             client,
		cookies:            cookies,
		messages:           messages,
		responseStream:     responseStream,
		remoteAddr:         remoteAddr,
	}

	s.syncID = responseStream.Msg().GetSyncId()

	for _, cookie := range s.cookies {
		streamID, _ := StreamIdFromBytes(cookie.GetStreamId())
		s.streams.Store(streamID, struct{}{})
	}

	return s, nil
}

func (s *remoteSyncer) Run() {
	log := dlog.FromCtx(s.syncStreamCtx)

	defer s.responseStream.Close()

	var latestMsgReceived atomic.Value

	latestMsgReceived.Store(time.Now())

	go s.connectionAlive(&latestMsgReceived)

	for s.responseStream.Receive() {
		if s.syncStreamCtx.Err() != nil {
			break
		}

		latestMsgReceived.Store(time.Now())

		res := s.responseStream.Msg()

		if res.GetSyncOp() == SyncOp_SYNC_UPDATE {
			if err := s.sendSyncStreamResponseToClient(res); err != nil {
				if !errors.Is(err, context.Canceled) {
					log.Error("Cancel remote sync with client", "remote", s.remoteAddr, "err", err)
					s.cancelGlobalSyncOp()
				}
				return
			}
		} else if res.GetSyncOp() == SyncOp_SYNC_DOWN {
			if streamID, err := StreamIdFromBytes(res.GetStreamId()); err == nil {
				if err := s.sendSyncStreamResponseToClient(res); err != nil {
					if !errors.Is(err, context.Canceled) {
						log.Error("Cancel remote sync with client", "remote", s.remoteAddr, "err", err)
						s.cancelGlobalSyncOp()
					}
					return
				}

				s.streams.Delete(streamID)
			}
		}
	}

	// stream interrupted while client didn't cancel sync -> remote is unavailable
	if s.syncStreamCtx.Err() == nil {
		log.Info("remote node disconnected", "remote", s.remoteAddr)

		s.streams.Range(func(key, value any) bool {
			streamID := key.(StreamId)
			log.Debug("stream down", "syncId", s.forwarderSyncID, "remote", s.remoteAddr, "stream", streamID)

			msg := &SyncStreamsResponse{SyncOp: SyncOp_SYNC_DOWN, StreamId: streamID[:]}

			if err := s.sendSyncStreamResponseToClient(msg); err != nil {
				log.Error("Cancel remote sync with client", "remote", s.remoteAddr, "err", err)
				s.cancelGlobalSyncOp()
				return false
			}

			return true
		})
	}
}

// sendSyncStreamResponseToClient tries to write msg to the client send message channel.
// If the channel is full or the sync operation is cancelled, the function returns an error.
func (s *remoteSyncer) sendSyncStreamResponseToClient(msg *SyncStreamsResponse) error {
	select {
	case s.messages <- msg:
		return nil
	case <-s.syncStreamCtx.Done():
		return s.syncStreamCtx.Err()
	default:
		return RiverError(Err_BUFFER_FULL, "Client sync subscription message channel is full").
			Tag("syncOpId", s.forwarderSyncID).
			Func("sendSyncStreamResponseToClient")
	}
}

// connectionAlive periodically pings remote to check if the connection is still alive.
// if the remote can't be reach the sync stream is canceled.
func (s *remoteSyncer) connectionAlive(latestMsgReceived *atomic.Value) {
	var (
		log = dlog.FromCtx(s.syncStreamCtx)
		// check every pingTicker if it's time to send a ping req to remote
		pingTicker = time.NewTicker(3 * time.Second)
		// don't send a ping req if there was activity within recentActivityInterval
		recentActivityInterval = 15 * time.Second
		// if no message was receiving within recentActivityDeadline assume stream is dead
		recentActivityDeadline = 30 * time.Second
	)
	defer pingTicker.Stop()

	for {
		select {
		case <-pingTicker.C:
			now := time.Now()
			lastMsgRecv := latestMsgReceived.Load().(time.Time)
			if lastMsgRecv.Add(recentActivityDeadline).Before(now) { // no recent activity -> conn dead
				log.Warn("remote sync node time out", "remote", s.remoteAddr)
				s.syncStreamCancel()
				return
			}

			if lastMsgRecv.Add(recentActivityInterval).After(now) { // seen recent activity
				continue
			}

			// send ping to remote to generate activity to check if remote is still alive
			if _, err := s.client.PingSync(s.syncStreamCtx, connect.NewRequest(&PingSyncRequest{
				SyncId: s.syncID,
				Nonce:  fmt.Sprintf("%d", now.Unix()),
			})); err != nil {
				if !errors.Is(err, context.Canceled) {
					log.Error("ping sync failed", "remote", s.remoteAddr, "err", err)
				}
				s.syncStreamCancel()
				return
			}
			return

		case <-s.syncStreamCtx.Done():
			return
		}
	}
}

func (s *remoteSyncer) Address() common.Address {
	return s.remoteAddr
}

func (s *remoteSyncer) AddStream(ctx context.Context, cookie *SyncCookie) error {
	streamID, err := StreamIdFromBytes(cookie.GetStreamId())
	if err != nil {
		return err
	}

	_, err = s.client.AddStreamToSync(ctx, connect.NewRequest(&AddStreamToSyncRequest{
		SyncId:  s.syncID,
		SyncPos: cookie,
	}))

	if err == nil {
		s.streams.Store(streamID, struct{}{})
	}

	return err
}

func (s *remoteSyncer) RemoveStream(ctx context.Context, streamID StreamId) (bool, error) {
	_, err := s.client.RemoveStreamFromSync(ctx, connect.NewRequest(&RemoveStreamFromSyncRequest{
		SyncId:   s.syncID,
		StreamId: streamID[:],
	}))

	if err == nil {
		s.streams.Delete(streamID)
	}

	noMoreStreams := true
	s.streams.Range(func(key, value any) bool {
		noMoreStreams = false
		return false
	})

	if noMoreStreams {
		s.syncStreamCancel()
	}

	return noMoreStreams, err
}

func (s *remoteSyncer) DebugDropStream(ctx context.Context, streamID StreamId) (bool, error) {
	if _, err := s.client.Info(ctx, connect.NewRequest(&InfoRequest{Debug: []string{
		"drop_stream",
		s.syncID,
		streamID.String(),
	}})); err != nil {
		return false, AsRiverError(err)
	}

	noMoreStreams := true
	s.streams.Range(func(key, value any) bool {
		noMoreStreams = false
		return false
	})

	if noMoreStreams {
		s.syncStreamCancel()
	}

	return noMoreStreams, nil
}

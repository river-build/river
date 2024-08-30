package rpc

import (
	"context"
	"fmt"
	"reflect"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"connectrpc.com/connect"

	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/node/crypto"
	. "github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	. "github.com/river-build/river/core/node/shared"
)

const defaultTimeout = 5 * time.Second

type syncClient struct {
	client  protocolconnect.StreamServiceClient
	syncId  string
	err     atomic.Pointer[error]
	errC    chan error
	syncIdC chan string
	updateC chan *protocol.StreamAndCookie
	downC   chan StreamId
	pongC   chan string
}

func (c *syncClient) sync(ctx context.Context, cookie *protocol.SyncCookie) {
	req := &protocol.SyncStreamsRequest{}
	if cookie != nil {
		req.SyncPos = []*protocol.SyncCookie{cookie}
	}
	resp, err := c.client.SyncStreams(ctx, connect.NewRequest(req))
	if err == nil {
	syncLoop:
		for {
			if !resp.Receive() {
				break
			}

			msg := resp.Msg()
			switch msg.SyncOp {
			case protocol.SyncOp_SYNC_NEW:
				c.syncId = msg.SyncId
				c.syncIdC <- c.syncId
			case protocol.SyncOp_SYNC_CLOSE:
				break syncLoop
			case protocol.SyncOp_SYNC_UPDATE:
				c.updateC <- msg.Stream
			case protocol.SyncOp_SYNC_DOWN:
				streamId, err2 := StreamIdFromBytes(msg.StreamId)
				if err2 != nil {
					err = err2
					break syncLoop
				}
				c.downC <- streamId
			case protocol.SyncOp_SYNC_PONG:
				c.pongC <- msg.PongNonce
			case protocol.SyncOp_SYNC_UNSPECIFIED:
				fallthrough
			default:
				err = fmt.Errorf("unknown sync op: %v", msg.SyncOp)
				break syncLoop
			}
		}

		if err == nil {
			err = resp.Err()
		}
	}

	// Store pointer to error: if error is nil, sync is completed successfully
	// if error is not nil, sync failed
	c.err.Store(&err)
	if err != nil {
		c.errC <- err
	}
}

func (c *syncClient) cancelSync(t *testing.T, ctx context.Context) {
	_, err := c.client.CancelSync(ctx, connect.NewRequest(&protocol.CancelSyncRequest{
		SyncId: c.syncId,
	}))
	require.NoError(t, err, "failed to cancel sync")
}

type syncClients struct {
	clients []*syncClient
	closed  bool
}

func makeSyncClients(tt *serviceTester, numNodes int) *syncClients {
	clients := make([]*syncClient, numNodes)
	for i := range numNodes {
		clients[i] = &syncClient{
			client:  tt.testClient(i),
			errC:    make(chan error, 100),
			syncIdC: make(chan string, 100),
			updateC: make(chan *protocol.StreamAndCookie, 100),
			downC:   make(chan StreamId, 100),
			pongC:   make(chan string, 100),
		}
	}

	return &syncClients{clients: clients}
}

func (sc *syncClients) startSync(t *testing.T, ctx context.Context, cookie *protocol.SyncCookie) {
	for _, client := range sc.clients {
		go client.sync(ctx, cookie)
	}

	t.Cleanup(func() {
		sc.cancelAll(t, ctx)
	})

	for i, client := range sc.clients {
		select {
		case <-client.syncIdC:
			// Received syncId, continue
		case err := <-client.errC:
			t.Fatalf("Error in sync client %d: %v", i, err)
			return
		case <-time.After(defaultTimeout):
			t.Fatalf("Timeout waiting for syncId from client %d", i)
			return
		}
	}
}

func (sc *syncClients) checkDone(t *testing.T) {
	for i, client := range sc.clients {
		err := client.err.Load()
		if err == nil {
			t.Fatalf("sync client not done %d", i)
			return
		}
		if *err != nil {
			t.Fatalf("Error in sync client %d: %v", i, *err)
			return
		}
		// Check that all updates and pongs are consumed
		select {
		case update := <-client.updateC:
			t.Fatalf("Unexpected update remaining for client %d: %v", i, update)
		case down := <-client.downC:
			t.Fatalf("Unexpected down remaining for client %d: %v", i, down)
		case pong := <-client.pongC:
			t.Fatalf("Unexpected pong remaining for client %d: %v", i, pong)
		default:
			// No updates or pongs remaining, which is expected
		}
	}
}

func (sc *syncClients) expectOneUpdate(t *testing.T, opts *updateOpts) {
	t.Helper()
	timer := time.NewTimer(defaultTimeout)
	defer timer.Stop()

	for i, client := range sc.clients {
		select {
		case update := <-client.updateC:
			checkUpdate(t, update, opts)
			if t.Failed() {
				return
			}
		case <-timer.C:
			t.Fatalf("Timeout waiting for update on client %d", i)
			return
		}
	}
}

func (sc *syncClients) cancelAll(t *testing.T, ctx context.Context) {
	t.Helper()
	if sc.closed {
		return
	}
	sc.closed = true
	for _, client := range sc.clients {
		client.cancelSync(t, ctx)
	}
}

type updateOpts struct {
	mbs       int
	events    int
	eventType string
}

func getPayloadType(event *protocol.StreamEvent) string {
	if event == nil || event.Payload == nil {
		return "nil"
	}

	// Get the type of the payload
	payloadType := reflect.TypeOf(event.Payload)

	// If it's a pointer, get the element it points to
	if payloadType.Kind() == reflect.Ptr {
		payloadType = payloadType.Elem()
	}

	typeName := payloadType.Name()
	typeName = strings.TrimPrefix(typeName, "StreamEvent_")
	return typeName
}

func checkUpdate(t *testing.T, update *protocol.StreamAndCookie, opts *updateOpts) {
	t.Helper()
	require.NotNil(t, update)
	if opts == nil {
		return
	}
	updateStr := fmt.Sprintf("ev: %d, mb: %d", len(update.Events), len(update.Miniblocks))
	for _, e := range update.Events {
		// Parse event
		parsedEvent, err := ParseEvent(e)
		if err != nil {
			t.Errorf("Failed to parse event: %v", err)
			return
		}
		eventType := getPayloadType(parsedEvent.Event)
		updateStr += fmt.Sprintf("\n    %s", eventType)
		if opts.eventType != "" && eventType != opts.eventType {
			t.Fatalf("Unexpected event type: %s", updateStr)
			return
		}
	}
	fmt.Println("checkUpdate: update: ", updateStr)
	if opts.mbs >= 0 {
		require.Len(t, update.Miniblocks, opts.mbs, "checkUpdate: update: %s", updateStr)
	}
	if opts.events >= 0 {
		require.Len(t, update.Events, opts.events, "checkUpdate: update: %s", updateStr)
	}
}

func TestSyncWithFlush(t *testing.T) {
	numNodes := 10
	tt := newServiceTester(t, serviceTesterOpts{numNodes: numNodes, start: true})
	ctx := tt.ctx
	require := tt.require

	syncClients := makeSyncClients(tt, numNodes)
	client0 := syncClients.clients[0].client

	wallet, err := crypto.NewWallet(ctx)
	require.NoError(err)
	streamId, cookie, _, err := createUserSettingsStream(
		ctx,
		wallet,
		client0,
		&protocol.StreamSettings{
			DisableMiniblockCreation: true,
		},
	)
	require.NoError(err)

	syncClients.startSync(t, ctx, cookie)

	syncClients.expectOneUpdate(t, &updateOpts{})

	require.NoError(addUserBlockedFillerEvent(ctx, wallet, client0, streamId, cookie.PrevMiniblockHash))
	syncClients.expectOneUpdate(t, &updateOpts{events: 1, eventType: "UserSettingsPayload"})

	hash, mbNum, err := makeMiniblock(ctx, client0, streamId, false, 0)
	require.NoError(err)
	require.NotEmpty(hash)
	require.Equal(int64(1), mbNum)
	syncClients.expectOneUpdate(t, &updateOpts{events: 1, eventType: "MiniblockHeader"})

	var cacheCleanupTotal CacheCleanupResult
	for i := 0; i < 10; i++ {
		cacheCleanupResult := tt.nodes[i].service.cache.CacheCleanup(ctx, true, -1*time.Hour)
		cacheCleanupTotal.TotalStreams += cacheCleanupResult.TotalStreams
		cacheCleanupTotal.UnloadedStreams += cacheCleanupResult.UnloadedStreams
	}
	require.Equal(1, cacheCleanupTotal.TotalStreams)
	require.Equal(1, cacheCleanupTotal.UnloadedStreams)

	require.NoError(addUserBlockedFillerEvent(ctx, wallet, client0, streamId, hash))
	syncClients.expectOneUpdate(t, &updateOpts{events: 1, eventType: "UserSettingsPayload"})

	syncClients.cancelAll(t, ctx)
	syncClients.checkDone(t)
}

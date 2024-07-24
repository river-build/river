package sync

import (
	"context"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/nodes"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/rpc/sync/client"
	"github.com/river-build/river/core/node/shared"
)

type (
	// StreamSyncOperation represents a stream sync operation that is currently in progress.
	StreamSyncOperation struct {
		// SyncID is the identifier as used with the external client to identify the streams sync operation.
		SyncID string
		// ctx is the root context for this subscription, when expires the subscription and all background syncers are
		// cancelled
		ctx context.Context
		// cancel sync operation
		cancel context.CancelFunc
		// commands holds incoming requests from the client to add/remove/cancel commands
		commands chan *subCommand
		// thisNodeAddress keeps the address of this stream  thisNodeAddress instance
		thisNodeAddress common.Address
		// streamCache gives access to streams managed by this thisNodeAddress
		streamCache events.StreamCache
		// nodeRegistry is used to get the remote remoteNode endpoint from a thisNodeAddress address
		nodeRegistry nodes.NodeRegistry
	}

	// subCommand represents a request to add or remove a stream and ping sync operation
	subCommand struct {
		Ctx             context.Context
		RmStreamReq     *connect.Request[RemoveStreamFromSyncRequest]
		AddStreamReq    *connect.Request[AddStreamToSyncRequest]
		PingReq         *connect.Request[PingSyncRequest]
		DebugDropStream shared.StreamId
		reply           chan error
	}
)

func (cmd *subCommand) Reply(err error) {
	if err != nil {
		cmd.reply <- err
	}
	close(cmd.reply)
}

// NewStreamsSyncOperation initialises a new sync stream operation. It groups the given syncCookies per stream node
// by its address and subscribes on the internal stream streamCache for local streams.
//
// Use the Run method to start syncing.
func NewStreamsSyncOperation(
	ctx context.Context,
	node common.Address,
	streamCache events.StreamCache,
	nodeRegistry nodes.NodeRegistry,
) (*StreamSyncOperation, error) {
	// make the sync operation cancellable for CancelSync
	ctx, cancel := context.WithCancel(ctx)

	return &StreamSyncOperation{
		ctx:             ctx,
		cancel:          cancel,
		SyncID:          GenNanoid(),
		thisNodeAddress: node,
		commands:        make(chan *subCommand, 10),
		streamCache:     streamCache,
		nodeRegistry:    nodeRegistry,
	}, nil
}

// Run the stream sync until either sub.Cancel is called or until sub.ctx expired
func (syncOp *StreamSyncOperation) Run(
	req *connect.Request[SyncStreamsRequest],
	res *connect.ServerStream[SyncStreamsResponse],
) error {
	cookies, err := client.ValidateAndGroupSyncCookies(req.Msg.GetSyncPos())
	if err != nil {
		return err
	}

	syncers, messages, err := client.NewSyncers(
		syncOp.ctx, syncOp.SyncID, syncOp.streamCache, syncOp.nodeRegistry, syncOp.thisNodeAddress, cookies)
	if err != nil {
		return err
	}

	go syncers.Run()

	for {
		select {
		case msg, ok := <-messages:
			if !ok { // messages is closed in syncers when syncOp.ctx is cancelled
				_ = res.Send(&SyncStreamsResponse{
					SyncId: syncOp.SyncID,
					SyncOp: SyncOp_SYNC_CLOSE,
				})
				return nil
			}

			// use the syncID as used between client and subscription node
			msg.SyncId = syncOp.SyncID
			if err = res.Send(msg); err != nil {
				syncOp.cancel()
				return err
			}

		case cmd := <-syncOp.commands:
			if cmd.AddStreamReq != nil {
				nodeAddress := common.BytesToAddress(cmd.AddStreamReq.Msg.GetSyncPos().GetNodeAddress())
				streamID, err := shared.StreamIdFromBytes(cmd.AddStreamReq.Msg.GetSyncPos().GetStreamId())
				if err != nil {
					cmd.Reply(err)
					continue
				}
				cmd.Reply(syncers.AddStream(cmd.Ctx, nodeAddress, streamID, cmd.AddStreamReq.Msg.GetSyncPos()))
			} else if cmd.RmStreamReq != nil {
				streamID, err := shared.StreamIdFromBytes(cmd.RmStreamReq.Msg.GetStreamId())
				if err != nil {
					cmd.Reply(err)
					continue
				}
				cmd.Reply(syncers.RemoveStream(cmd.Ctx, streamID))
			} else if cmd.PingReq != nil {
				err = res.Send(&SyncStreamsResponse{
					SyncId:    syncOp.SyncID,
					SyncOp:    SyncOp_SYNC_PONG,
					PongNonce: cmd.PingReq.Msg.GetNonce(),
				})
				cmd.Reply(err)
			} else if cmd.DebugDropStream != (shared.StreamId{}) {
				cmd.Reply(syncers.DebugDropStream(cmd.Ctx, cmd.DebugDropStream))
			}
		}
	}
}

func (syncOp *StreamSyncOperation) AddStreamToSync(
	ctx context.Context,
	req *connect.Request[AddStreamToSyncRequest],
) (*connect.Response[AddStreamToSyncResponse], error) {
	if err := events.SyncCookieValidate(req.Msg.GetSyncPos()); err != nil {
		return nil, err
	}

	op := &subCommand{
		Ctx:          ctx,
		AddStreamReq: req,
		reply:        make(chan error, 1),
	}

	if syncOp.sendMsg(op) {
		select {
		case err := <-op.reply:
			if err == nil {
				return connect.NewResponse(&AddStreamToSyncResponse{}), nil
			}
			return nil, err
		case <-syncOp.ctx.Done():
			return nil, RiverError(Err_CANCELED, "sync operation cancelled").Tags("syncId", syncOp.SyncID)
		}
	}

	return nil, RiverError(Err_CANCELED, "sync operation cancelled").Tags("syncId", syncOp.SyncID)
}

func (syncOp *StreamSyncOperation) RemoveStreamFromSync(
	ctx context.Context,
	req *connect.Request[RemoveStreamFromSyncRequest],
) (*connect.Response[RemoveStreamFromSyncResponse], error) {
	if req.Msg.GetSyncId() != syncOp.SyncID {
		return nil, RiverError(Err_INVALID_ARGUMENT, "invalid syncId").Tag("syncId", req.Msg.GetSyncId())
	}

	op := &subCommand{
		Ctx:         ctx,
		RmStreamReq: req,
		reply:       make(chan error, 1),
	}

	if syncOp.sendMsg(op) {
		select {
		case err := <-op.reply:
			if err == nil {
				return connect.NewResponse(&RemoveStreamFromSyncResponse{}), nil
			}
			return nil, err
		case <-syncOp.ctx.Done():
			return nil, RiverError(Err_CANCELED, "sync operation cancelled").Tags("syncId", syncOp.SyncID)
		}
	}

	return nil, RiverError(Err_CANCELED, "sync operation cancelled").Tags("syncId", syncOp.SyncID)
}

func (syncOp *StreamSyncOperation) CancelSync(
	_ context.Context,
	req *connect.Request[CancelSyncRequest],
) (*connect.Response[CancelSyncResponse], error) {
	if req.Msg.GetSyncId() != syncOp.SyncID {
		return nil, RiverError(Err_INVALID_ARGUMENT, "invalid syncId").Tag("syncId", req.Msg.GetSyncId())
	}

	syncOp.cancel()

	return connect.NewResponse(&CancelSyncResponse{}), nil
}

func (syncOp *StreamSyncOperation) PingSync(
	ctx context.Context,
	req *connect.Request[PingSyncRequest],
) (*connect.Response[PingSyncResponse], error) {
	if req.Msg.GetSyncId() != syncOp.SyncID {
		return nil, RiverError(Err_INVALID_ARGUMENT, "invalid syncId").Tag("syncId", req.Msg.GetSyncId())
	}

	op := &subCommand{
		Ctx:     ctx,
		PingReq: req,
		reply:   make(chan error, 1),
	}

	if syncOp.sendMsg(op) {
		select {
		case err := <-op.reply:
			if err == nil {
				return connect.NewResponse(&PingSyncResponse{}), nil
			}
			return nil, err
		case <-syncOp.ctx.Done():
			return nil, RiverError(Err_CANCELED, "sync operation cancelled").Tags("syncId", syncOp.SyncID)
		}
	}

	return nil, RiverError(Err_CANCELED, "sync operation cancelled").Tags("syncId", syncOp.SyncID)
}

func (syncOp *StreamSyncOperation) debugDropStream(ctx context.Context, streamID shared.StreamId) error {
	op := &subCommand{
		Ctx:             ctx,
		DebugDropStream: streamID,
		reply:           make(chan error, 1),
	}

	if syncOp.sendMsg(op) {
		select {
		case err := <-op.reply:
			return err
		case <-syncOp.ctx.Done():
			return RiverError(Err_CANCELED, "sync operation cancelled").Tags("syncId", syncOp.SyncID)
		}
	}

	return RiverError(Err_CANCELED, "sync operation cancelled").Tags("syncId", syncOp.SyncID)
}

func (syncOp *StreamSyncOperation) sendMsg(cmd *subCommand) bool {
	select {
	case syncOp.commands <- cmd:
		return true
	case <-syncOp.ctx.Done():
		return false
	}
}

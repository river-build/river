package utils

import (
	"context"
	"log/slog"
	"time"

	"connectrpc.com/connect"

	"github.com/river-build/river/core/node/dlog"
)

const (
	// RpcStreamIdKey is key under which the streamId is set if the RPC call is made within the context of a stream.
	RpcStreamIdKey = "streamId"
)

type RequestWithStreamId interface {
	GetStreamId() string
}

// CtxAndLogForRequest returns a new context and logger for the given request.
// If the request is made in the context of a stream it will try to add the stream id to the logger.
func CtxAndLogForRequest[T any](ctx context.Context, req *connect.Request[T]) (context.Context, *slog.Logger) {
	log := dlog.FromCtx(ctx)

	// Add streamId to log context if present in request
	if reqMsg, ok := any(req.Msg).(RequestWithStreamId); ok {
		streamId := reqMsg.GetStreamId()
		if streamId != "" {
			log = log.With(RpcStreamIdKey, streamId).With("application", "streamNode")
			return dlog.CtxWithLog(ctx, log), log
		}
	}

	return ctx, log
}

func UncancelContext(
	ctx context.Context,
	minTimeout, defaultTimeout time.Duration,
) (context.Context, context.CancelFunc) {
	deadline, ok := ctx.Deadline()
	now := time.Now()
	if ok {
		if deadline.Before(now.Add(minTimeout)) {
			deadline = now.Add(minTimeout)
		}
	} else {
		deadline = now.Add(defaultTimeout)
	}
	ctx = context.WithoutCancel(ctx)
	return context.WithDeadline(ctx, deadline)
}

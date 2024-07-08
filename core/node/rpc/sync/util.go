package sync

import (
	"context"
	"log/slog"

	"connectrpc.com/connect"
	"github.com/river-build/river/core/node/dlog"
)

type RequestWithStreamId interface {
	GetStreamId() string
}

func ctxAndLogForRequest[T any](ctx context.Context, req *connect.Request[T]) (context.Context, *slog.Logger) {
	log := dlog.FromCtx(ctx)

	// Add streamId to log context if present in request
	if reqMsg, ok := any(req.Msg).(RequestWithStreamId); ok {
		streamId := reqMsg.GetStreamId()
		if streamId != "" {
			log = log.With("streamId", streamId)
			return dlog.CtxWithLog(ctx, log), log
		}
	}

	return ctx, log
}

package rpc

import (
	"context"
	"time"

	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"

	"connectrpc.com/connect"
)

type streamIdProvider interface {
	GetStreamId() string
}

func (s *Service) NewMetricsInterceptor() connect.UnaryInterceptorFunc {
	interceptor := func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(
			ctx context.Context,
			req connect.AnyRequest,
		) (connect.AnyResponse, error) {
			proc := req.Spec().Procedure
			defer s.metrics.StoreExecutionTimeMetrics(proc, "rpc", time.Now())

			r, ok := req.Any().(streamIdProvider)
			if ok {
				// this line will enrich the tracing span with the streamId
				span, _ := tracer.SpanFromContext(ctx)
				span.SetTag("streamId", r.GetStreamId())
			}
			return next(ctx, req)
		}
	}
	return interceptor
}

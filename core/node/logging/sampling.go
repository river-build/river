package logging

import (
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// SampledLogger returns a modified version of the input log that samples the logs
// using zap's sampling algorithm, which drops logs with identical messages within
// a time period after a threshold of identical logs is met. The sampling here is
// configured to drop 95% of logs after 5 of the same log message is seen in 1
// minute.
func SampledLogger(log *zap.Logger) *zap.Logger {
	return log.WithOptions(
		zap.WrapCore(
			func(core zapcore.Core) zapcore.Core {
				return zapcore.NewSamplerWithOptions(core, 1*time.Minute, 5, 20)
			},
		),
	)
}

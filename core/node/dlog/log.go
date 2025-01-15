package dlog

import (
	"context"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	DefaultLogOut = os.Stdout
	defaultLogger *zap.SugaredLogger
)

func init() {
	defaultLogger = DefaultZapLogger()
}

func DefaultZapLogger() *zap.SugaredLogger {
	encoderCfg := zap.NewProductionEncoderConfig()
	encoderCfg.EncodeLevel = zapcore.CapitalColorLevelEncoder

	consoleEncoder := zapcore.NewConsoleEncoder(encoderCfg)
	writer := zapcore.AddSync(DefaultLogOut)

	logLevel := zapcore.InfoLevel
	core := zapcore.NewCore(consoleEncoder, writer, logLevel)

	logger := zap.New(
		core,
		zap.AddCaller(),
	)
	return logger.Sugar()
}

// Log is the default logger.
func Log() *zap.SugaredLogger {
	return defaultLogger
}

func SetLog(l *zap.SugaredLogger) {
	defaultLogger = l
}

func LogWith(args ...any) *zap.SugaredLogger {
	return Log().With(args...)
}

type dlogCtxKeyType struct{}

var dlogCtxKey = dlogCtxKeyType{}

func CtxWithLog(ctx context.Context, l *zap.SugaredLogger) context.Context {
	return context.WithValue(ctx, dlogCtxKey, l)
}

func CtxWithLogValues(ctx context.Context, args ...any) context.Context {
	return context.WithValue(ctx, dlogCtxKey, LogWith(args...))
}

func FromCtx(ctx context.Context) *zap.SugaredLogger {
	if l, ok := ctx.Value(dlogCtxKey).(*zap.SugaredLogger); ok {
		return l
	}
	return defaultLogger
}

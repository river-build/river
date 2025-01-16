package dlog

import (
	"context"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/buffer"
	"go.uber.org/zap/zapcore"
)

var (
	DefaultLogOut = os.Stdout
	defaultLogger *zap.SugaredLogger
)

func init() {
	defaultLogger = DefaultZapLogger()
}

func DefaultZapEncoderConfig() zapcore.EncoderConfig {
	return zapcore.EncoderConfig{
		MessageKey:       "msg",
		LevelKey:         "level",
		TimeKey:          "timestamp",
		FunctionKey:      "function",
		EncodeLevel:      zapcore.CapitalLevelEncoder,
		EncodeTime:       zapcore.ISO8601TimeEncoder,
		EncodeName:       zapcore.FullNameEncoder,
		ConsoleSeparator: " ",
	}
}

type customConsoleEncoder struct {
	zapcore.Encoder
}

func (enc *customConsoleEncoder) AddString(key, val string) {
	isHex, hasPrefix := IsHexString(val)
	if isHex {
		if hasPrefix {
			if len(val) > shortenHexChars+2 {
				val = val[:(2+shortenHexCharsPartLen)] + ".." + val[len(val)-shortenHexCharsPartLen:]
			}
		} else {
			if len(val) > shortenHexChars {
				val = val[:shortenHexCharsPartLen] + ".." + val[len(val)-shortenHexCharsPartLen:]
			}
		}
	}
	enc.Encoder.AddString(key, val)
}

func (enc *customConsoleEncoder) EncodeEntry(ent zapcore.Entry, fields []zapcore.Field) (*buffer.Buffer, error) {
	buf, err := enc.Encoder.EncodeEntry(ent, nil)
	if err != nil {
		return nil, err
	}

	for _, f := range fields {
		f.AddTo(enc)
		buf.AppendString("\n")
	}

	return buf, nil
}

// NewZapTextEncoder returns a console encoder that has custom handling for hex byte-arrays
// and strings.
func NewZapTextEncoder(cfg *zapcore.EncoderConfig) zapcore.Encoder {
	if cfg == nil {
		defaultCfg := DefaultZapEncoderConfig()
		cfg = &defaultCfg
	}
	return &customConsoleEncoder{
		Encoder: zapcore.NewConsoleEncoder(*cfg),
	}
}

func DefaultZapLogger() *zap.SugaredLogger {
	encoderCfg := DefaultZapEncoderConfig()
	encoderCfg.EncodeLevel = zapcore.CapitalColorLevelEncoder

	encoder := NewZapTextEncoder(&encoderCfg)
	writer := zapcore.AddSync(DefaultLogOut)

	logLevel := zapcore.InfoLevel
	core := zapcore.NewCore(encoder, writer, logLevel)

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
	return zap.L().Sugar()
}

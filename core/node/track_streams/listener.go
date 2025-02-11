package track_streams

import (
	"context"

	mapset "github.com/deckarep/golang-set/v2"

	. "github.com/river-build/river/core/node/events"

	"github.com/river-build/river/core/node/shared"
)

type StreamEventListener interface {
	OnMessageEvent(
		ctx context.Context,
		streamID shared.StreamId,
		parentStreamID *shared.StreamId, // only
		bots mapset.Set[string],
		event *ParsedEvent,
	)
}

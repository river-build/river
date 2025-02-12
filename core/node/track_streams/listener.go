package track_streams

import (
	"context"

	mapset "github.com/deckarep/golang-set/v2"

	. "github.com/towns-protocol/towns/core/node/events"

	"github.com/towns-protocol/towns/core/node/shared"
)

type StreamEventListener interface {
	OnMessageEvent(
		ctx context.Context,
		streamID shared.StreamId,
		parentStreamID *shared.StreamId, // only
		members mapset.Set[string],
		event *ParsedEvent,
	)
}

package events

import (
	"context"

	"github.com/river-build/river/core/node/crypto"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
)

// TrackedStreamView presents an interface that can be used to apply the returned
// data structures of a stream synced from another node in order to render an up-to-date
// view of the stream locally.
type TrackedStreamView interface {
	// ApplyBlock applies the block to the internal view, updating the stream with the latest
	// membership if it is a channel.
	ApplyBlock(miniblock *Miniblock) error

	// ApplyEvent applies the event to the internal view and notifies if the event unseen
	ApplyEvent(ctx context.Context, event *Envelope) error

	// SendEventNotification notifies via the internal callback, but does not apply the event
	// to the internal view state. This method can be used to invoke the callback on events
	// that were added to this streamView via ApplyBlock
	SendEventNotification(ctx context.Context, event *ParsedEvent) error
}

type trackedStreamViewImpl struct {
	streamID   shared.StreamId
	view       *StreamView
	cfg        crypto.OnChainConfiguration
	onNewEvent func(ctx context.Context, view *StreamView, event *ParsedEvent) error
}

// The TrackedStreamView tracks the current state of a remote stream by applying blocks and events to
// that stream in order to internally render an up-to-date view of the stream, upon which callbacks are
// executed. It is used by the notification service and the bot registry service to track the state of
// relevant streams. It is essentially a wrapper around StreamView, to apply events, and to execute callbacks.
// OnViewLoaded is executed upon TrackedStreamView creation when the constructed view is fully reified.
// onNewEvent is called whenever a new event is added to the view, ensuring that the onNewEVent callback is
// never called twice.
func NewTrackedStreamView(
	ctx context.Context,
	streamID shared.StreamId,
	cfg crypto.OnChainConfiguration,
	stream *StreamAndCookie,
	onViewLoaded func(view *StreamView) error,
	onNewEvent func(ctx context.Context, view *StreamView, event *ParsedEvent) error,
) (TrackedStreamView, error) {
	view, err := MakeRemoteStreamView(ctx, stream)
	if err != nil {
		return nil, err
	}

	if err := onViewLoaded(view); err != nil {
		return nil, err
	}

	return &trackedStreamViewImpl{
		streamID:   streamID,
		cfg:        cfg,
		view:       view,
		onNewEvent: onNewEvent,
	}, nil
}

func (ts *trackedStreamViewImpl) ApplyBlock(
	miniblock *Miniblock,
) error {
	mb, err := NewMiniblockInfoFromProto(miniblock, NewParsedMiniblockInfoOpts())
	if err != nil {
		return err
	}

	return ts.applyBlock(mb, ts.cfg.Get())
}

func (ts *trackedStreamViewImpl) ApplyEvent(
	ctx context.Context,
	event *Envelope,
) error {
	parsedEvent, err := ParseEvent(event)
	if err != nil {
		return err
	}

	// add event calls the message listener that send notifications when needed
	return ts.addEvent(ctx, parsedEvent)
}

func (ts *trackedStreamViewImpl) applyBlock(
	miniblock *MiniblockInfo,
	cfg *crypto.OnChainSettings,
) error {
	if lastBlock := ts.view.LastBlock(); lastBlock != nil {
		if miniblock.Ref.Num <= lastBlock.Ref.Num {
			return nil
		}
	}

	view, _, err := ts.view.copyAndApplyBlock(miniblock, cfg)
	if err != nil {
		return err
	}

	ts.view = view
	return nil
}

func (ts *trackedStreamViewImpl) addEvent(ctx context.Context, event *ParsedEvent) error {
	if ts.view.minipool.events.Has(event.Hash) || event.Event.GetMiniblockHeader() != nil {
		return nil
	}

	view, err := ts.view.copyAndAddEvent(event)
	if err != nil {
		return err
	}
	ts.view = view

	return ts.SendEventNotification(ctx, event)
}

func (ts *trackedStreamViewImpl) SendEventNotification(ctx context.Context, event *ParsedEvent) error {
	if ts.view == nil {
		return nil
	}

	return ts.onNewEvent(ctx, ts.view, event)
}

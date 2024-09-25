package events

import (
	"bytes"
	"context"
	"sync"

	"github.com/ethereum/go-ethereum/common"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/utils"
)

// TrackedNotificationStreamView is part the notification service and put in the events package to provide access to
// some of the private types/methods of this package. It is a wrapper around streamViewImpl to apply events.
// In addition, it keeps track of which notifications are processed to prevent double event processing.
type (
	UserPreferencesStore interface {
		// BlockUser blocks the given blockedUser for the given user
		BlockUser(
			ctx context.Context,
			user common.Address,
			blockedUser common.Address,
		) error

		// UnblockUser unblocks the given blockedUser for the given user
		UnblockUser(
			ctx context.Context,
			user common.Address,
			blockedUser common.Address,
		) error
	}

	TrackedNotificationStreamView struct {
		streamID        shared.StreamId
		view            *streamViewImpl
		cfg             crypto.OnChainConfiguration
		listener        StreamEventListener
		muBlockedUsers  sync.RWMutex
		userPreferences UserPreferencesStore
	}

	StreamEventListener interface {
		// OnMessageEvent is called for each member, for each message event added to the stream
		OnMessageEvent(streamID shared.StreamId, streamMembers map[common.Address]struct{}, event *ParsedEvent)
	}
)

// NewNotificationsStreamTrackerFromStreamAndCookie constructs a TrackedNotificationStreamView instance from the given
// stream. It's expected that the stream cookie starts with a miniblock that contains a snapshot with stream members.
func NewNotificationsStreamTrackerFromStreamAndCookie(
	streamID shared.StreamId,
	cfg crypto.OnChainConfiguration,
	stream *StreamAndCookie,
	listener StreamEventListener,
	userPreferences UserPreferencesStore,
) (*TrackedNotificationStreamView, error) {
	// lint:ignore context.Background() is fine here
	view, err := MakeRemoteStreamView(context.Background(), &GetStreamResponse{
		Stream: stream,
	})

	if err != nil {
		return nil, err
	}

	return &TrackedNotificationStreamView{
		streamID:        streamID,
		cfg:             cfg,
		view:            view,
		listener:        listener,
		userPreferences: userPreferences,
	}, nil
}

func (ts *TrackedNotificationStreamView) HandleEvent(event *Envelope) error {
	parsedEvent, err := ParseEvent(event)
	if err != nil {
		return err
	}

	if parsedEvent.Event.GetMiniblockHeader() != nil { // clean up minipool
		return ts.applyMiniblockHeader(parsedEvent)
	}

	// add event calls the message listener that send notifications when needed
	return ts.addEvent(parsedEvent)
}

func (ts *TrackedNotificationStreamView) LatestSyncCookie() *SyncCookie {
	return ts.view.SyncCookie(common.Address{})
}

func (ts *TrackedNotificationStreamView) addEvent(event *ParsedEvent) error {
	view, err := ts.view.copyAndAddEvent(event)
	if err != nil {
		return err
	}
	ts.view = view

	// in case the event was blocking/unblocking a user update the users blocked list.
	if ts.streamID.Type() == shared.STREAM_USER_SETTINGS_BIN {
		if settings := event.Event.GetUserSettingsPayload(); settings != nil {
			if userBlock := settings.GetUserBlock(); userBlock != nil {
				userID := common.BytesToAddress(event.Event.CreatorAddress)
				blockedUser := common.BytesToAddress(userBlock.GetUserId())

				if userBlock.GetIsBlocked() {
					// lint:ignore context.Background() is fine here
					_ = ts.userPreferences.BlockUser(context.Background(), userID, blockedUser)
				} else {
					// lint:ignore context.Background() is fine here
					_ = ts.userPreferences.UnblockUser(context.Background(), userID, blockedUser)
				}
			}
		}

		return nil
	}

	// otherwise for each member that is a member of the stream, or for anyone that is mentioned
	participants := make(map[common.Address]struct{})
	for _, participant := range ts.view.snapshot.Members.Joined {
		participants[common.BytesToAddress(participant.UserAddress)] = struct{}{}
	}
	ts.listener.OnMessageEvent(ts.streamID, participants, event)

	return nil
}

func (ts *TrackedNotificationStreamView) applyMiniblockHeader(event *ParsedEvent) error {
	lastBlock := ts.view.LastBlock()
	header := event.Event.GetMiniblockHeader()

	if header.MiniblockNum != lastBlock.header().MiniblockNum+1 {
		return RiverError(
			Err_BAD_BLOCK,
			"streamViewImpl: block number mismatch",
			"expected",
			lastBlock.header().MiniblockNum+1,
			"actual",
			header.MiniblockNum,
		)
	}

	if !bytes.Equal(lastBlock.headerEvent.Hash[:], header.PrevMiniblockHash) {
		return RiverError(
			Err_BAD_BLOCK,
			"streamViewImpl: block hash mismatch",
			"expected",
			FormatHash(lastBlock.headerEvent.Hash),
			"actual",
			FormatHashFromBytes(header.PrevMiniblockHash),
		)
	}

	// drop events from minipool that are included in this miniblock
	remaining := make(map[common.Hash]*ParsedEvent, max(ts.view.minipool.events.Len()-len(header.EventHashes), 0))
	for k, v := range ts.view.minipool.events.Map {
		remaining[k] = v
	}

	for _, e := range header.EventHashes {
		h := common.BytesToHash(e)
		if _, ok := remaining[h]; ok {
			delete(remaining, h)
		}
	}

	minipoolEvents := utils.NewOrderedMap[common.Hash, *ParsedEvent](len(remaining))
	for _, e := range ts.view.minipool.events.Values {
		if _, ok := remaining[e.Hash]; ok {
			if !minipoolEvents.Set(e.Hash, e) {
				panic("duplicate values in map")
			}
		}
	}

	var startIndex int
	var snapshotIndex int
	var snapshot *Snapshot
	recencyConstraintsGenerations := int(ts.cfg.Get().RecencyConstraintsGen)
	if header.Snapshot != nil {
		snapshot = header.Snapshot
		startIndex = max(0, len(ts.view.blocks)-recencyConstraintsGenerations)
		snapshotIndex = len(ts.view.blocks) - startIndex
	} else {
		startIndex = 0
		snapshot = ts.view.snapshot
		snapshotIndex = ts.view.snapshotIndex
	}

	generation := header.MiniblockNum + 1
	eventNumOffset := header.EventNumOffset + int64(len(header.EventHashes)) + 1 // plus one for header

	miniblock := &MiniblockInfo{
		Hash:        event.Hash,
		Num:         header.MiniblockNum,
		headerEvent: event,
	}

	ts.view = &streamViewImpl{
		streamId:      ts.view.streamId,
		blocks:        append(ts.view.blocks[startIndex:], miniblock),
		minipool:      newMiniPoolInstance(minipoolEvents, generation, eventNumOffset),
		snapshot:      snapshot,
		snapshotIndex: snapshotIndex,
	}

	return nil
}

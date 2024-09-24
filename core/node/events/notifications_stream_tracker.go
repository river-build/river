package events

import (
	"bytes"
	"context"
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/utils"
)

// TrackedNotificationStreamView is part the notification service and put in the events package
// to provide access to some of the private types/methods of this package.
type TrackedNotificationStreamView struct {
	cfg  crypto.OnChainConfiguration
	view *streamViewImpl
}

// NotificationsStreamTrackerFromStreamAndCookie constructs a TrackedNotificationStreamView instance from the given
// stream. It's expected that the stream cookie starts from a miniblock that contains a snapshot.
func NotificationsStreamTrackerFromStreamAndCookie(
	cfg crypto.OnChainConfiguration,
	stream *StreamAndCookie,
) (*TrackedNotificationStreamView, error) {
	view, err := MakeRemoteStreamView(context.TODO(), &GetStreamResponse{
		Stream: stream,
	})
	if err != nil {
		return nil, err
	}
	return &TrackedNotificationStreamView{cfg: cfg, view: view}, nil
}

func (ts *TrackedNotificationStreamView) IsMember(member common.Address) (bool, error) {
	return ts.view.IsMember(member[:])
}

func (ts *TrackedNotificationStreamView) AddEvent(event *ParsedEvent) error {
	view, err := ts.view.copyAndAddEvent(event)
	if err != nil {
		return err
	}
	ts.view = view

	return nil
}

func (ts *TrackedNotificationStreamView) ApplyMiniblockHeader(header *MiniblockHeader) error {
	// TODO: this logic is mostly copied from streamViewImpl::copyAndApplyBlock.
	// Consider refactoring it that both view can use the same logic.

	lastBlock := ts.view.LastBlock()

	fmt.Printf("lastblock: %p / header: %p\n", lastBlock, header)

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

	miniblock := &MiniblockInfo{ // TODO: set these values
		//Hash        common.Hash
		Num: header.MiniblockNum,
		//headerEvent *ParsedEvent
		//events      []*ParsedEvent
		//Proto       *Miniblock
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

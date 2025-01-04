package events

import (
	"bytes"
	"encoding/hex"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
)

func Make_GenesisMiniblockHeader(parsedEvents []*ParsedEvent) (*MiniblockHeader, error) {
	if len(parsedEvents) <= 0 {
		return nil, RiverError(Err_STREAM_EMPTY, "no events to make genisis miniblock header")
	}
	if parsedEvents[0].Event.GetInceptionPayload() == nil {
		return nil, RiverError(Err_STREAM_NO_INCEPTION_EVENT, "first event must be inception event")
	}
	for _, event := range parsedEvents[1:] {
		if event.Event.GetInceptionPayload() != nil {
			return nil, RiverError(Err_BAD_EVENT, "inception event can only be first event")
		}
		if event.Event.GetMiniblockHeader() != nil {
			return nil, RiverError(Err_BAD_EVENT, "block header can't be a block event")
		}
	}

	snapshot, err := Make_GenesisSnapshot(parsedEvents)
	if err != nil {
		return nil, err
	}

	eventHashes := make([][]byte, len(parsedEvents))
	for i, event := range parsedEvents {
		eventHashes[i] = event.Hash.Bytes()
	}

	return &MiniblockHeader{
		MiniblockNum: 0,
		Timestamp:    NextMiniblockTimestamp(nil),
		EventHashes:  eventHashes,
		Snapshot:     snapshot,
		Content: &MiniblockHeader_None{
			None: &emptypb.Empty{},
		},
	}, nil
}

func MakeGenesisMiniblock(wallet *crypto.Wallet, genesisMiniblockEvents []*ParsedEvent) (*Miniblock, error) {
	header, err := Make_GenesisMiniblockHeader(genesisMiniblockEvents)
	if err != nil {
		return nil, err
	}

	headerEnvelope, err := MakeEnvelopeWithPayload(
		wallet,
		Make_MiniblockHeader(header),
		nil,
	)
	if err != nil {
		return nil, err
	}

	envelopes := make([]*Envelope, len(genesisMiniblockEvents))
	for i, e := range genesisMiniblockEvents {
		envelopes[i] = e.Envelope
	}

	return &Miniblock{
		Events: envelopes,
		Header: headerEnvelope,
	}, nil
}

func NextMiniblockTimestamp(prevBlockTimestamp *timestamppb.Timestamp) *timestamppb.Timestamp {
	now := timestamppb.Now()

	if prevBlockTimestamp != nil {
		if now.Seconds < prevBlockTimestamp.Seconds ||
			(now.Seconds == prevBlockTimestamp.Seconds && now.Nanos <= prevBlockTimestamp.Nanos) {
			now.Seconds = prevBlockTimestamp.Seconds + 1
			now.Nanos = 0
		}
	}

	return now
}

type MiniblockInfo struct {
	Ref                *MiniblockRef
	headerEvent        *ParsedEvent
	useGetterForEvents []*ParsedEvent // Use events(). Getter checks if events have been initialized.
	Proto              *Miniblock
}

func (b *MiniblockInfo) Events() []*ParsedEvent {
	if len(b.useGetterForEvents) == 0 && len(b.Proto.Events) > 0 {
		panic("DontParseEvents option was used, events are not initialized")
	}
	return b.useGetterForEvents
}

func (b *MiniblockInfo) HeaderEvent() *ParsedEvent {
	return b.headerEvent
}

func (b *MiniblockInfo) Header() *MiniblockHeader {
	return b.headerEvent.Event.GetMiniblockHeader()
}

func (b *MiniblockInfo) lastEvent() *ParsedEvent {
	events := b.Events()
	if len(events) > 0 {
		return events[len(events)-1]
	} else {
		return nil
	}
}

func (b *MiniblockInfo) IsSnapshot() bool {
	return b.Header().GetSnapshot() != nil
}

func (b *MiniblockInfo) asStorageMb() (*storage.WriteMiniblockData, error) {
	bytes, err := b.ToBytes()
	if err != nil {
		return nil, err
	}
	return b.asStorageMbWithData(bytes), nil
}

func (b *MiniblockInfo) asStorageMbWithData(bytes []byte) *storage.WriteMiniblockData {
	return &storage.WriteMiniblockData{
		Number:   b.Ref.Num,
		Hash:     b.Ref.Hash,
		Snapshot: b.IsSnapshot(),
		Data:     bytes,
	}
}

func (b *MiniblockInfo) forEachEvent(
	op func(e *ParsedEvent, minibockNum int64, eventNum int64) (bool, error),
) (bool, error) {
	blockNum := b.Header().MiniblockNum
	eventNum := b.Header().EventNumOffset
	for _, event := range b.Events() {
		c, err := op(event, blockNum, eventNum)
		eventNum++
		if err != nil || !c {
			return false, err
		}
	}

	c, err := op(b.headerEvent, blockNum, eventNum)
	if err != nil || !c {
		return false, err
	}
	return true, nil
}

func NewMiniblockFromBytesWithOpts(bytes []byte, opts NewMiniblockInfoFromProtoOpts) (*MiniblockInfo, error) {
	var pb Miniblock
	err := proto.Unmarshal(bytes, &pb)
	if err != nil {
		return nil, AsRiverError(err, Err_INVALID_ARGUMENT).
			Message("Failed to decode miniblock from bytes").
			Func("NewMiniblockInfoFromBytes")
	}

	return NewMiniblockInfoFromProto(&pb, opts)
}

func NewMiniblockInfoFromBytes(bytes []byte, expectedBlockNumber int64) (*MiniblockInfo, error) {
	var pb Miniblock
	err := proto.Unmarshal(bytes, &pb)
	if err != nil {
		return nil, AsRiverError(err, Err_INVALID_ARGUMENT).
			Message("Failed to decode miniblock from bytes").
			Func("NewMiniblockInfoFromBytes")
	}

	return NewMiniblockInfoFromProto(&pb, NewMiniblockInfoFromProtoOpts{ExpectedBlockNumber: expectedBlockNumber})
}

func NewMiniblockInfoFromBytesWithOpts(bytes []byte, opts NewMiniblockInfoFromProtoOpts) (*MiniblockInfo, error) {
	var pb Miniblock
	err := proto.Unmarshal(bytes, &pb)
	if err != nil {
		return nil, AsRiverError(err, Err_INVALID_ARGUMENT).
			Message("Failed to decode miniblock from bytes").
			Func("NewMiniblockInfoFromBytesWithOpts")
	}

	return NewMiniblockInfoFromProto(&pb, opts)
}

type NewMiniblockInfoFromProtoOpts struct {
	ExpectedBlockNumber               int64
	ExpectedLastMiniblockHash         common.Hash
	ExpectedEventNumOffset            int64
	ExpectedMinimumTimestampExclusive time.Time
	ExpectedPrevSnapshotMiniblockNum  int64
	DontParseEvents                   bool
}

// NewMiniblockInfoFromProto initializes a MiniblockInfo from a proto, applying validation based
// on whatever is set in the opts. If an empty opts is passed in, the method will still perform
// some minimal validation if the requested miniblock is block 0.
func NewMiniblockInfoFromProto(pb *Miniblock, opts NewMiniblockInfoFromProtoOpts) (*MiniblockInfo, error) {
	headerEvent, err := ParseEvent(pb.Header)
	if err != nil {
		return nil, err
	}

	blockHeader := headerEvent.Event.GetMiniblockHeader()
	if blockHeader == nil {
		return nil, RiverError(Err_BAD_EVENT, "header event must be a block header")
	}

	if opts.ExpectedBlockNumber >= 0 && blockHeader.MiniblockNum != int64(opts.ExpectedBlockNumber) {
		return nil, RiverError(Err_BAD_BLOCK_NUMBER, "block number does not equal expected").
			Func("NewMiniblockInfoFromProto").
			Tag("expected", opts.ExpectedBlockNumber).
			Tag("actual", blockHeader.MiniblockNum)
	}

	// Validate the number of events matches event hashes
	// We will validate that the hashes match if the events are parsed.
	if len(blockHeader.EventHashes) != len(pb.Events) {
		return nil, RiverError(
			Err_BAD_BLOCK,
			"Length of events in block does not match length of event hashes in header",
		).Func("NewMiniblockInfoFromProto").
			Tag("eventHashesLength", len(blockHeader.EventHashes)).
			Tag("eventsLength", len(pb.Events))
	}

	var events []*ParsedEvent
	if !opts.DontParseEvents {
		events, err = ParseEvents(pb.Events)
		if err != nil {
			return nil, err
		}

		// Validate event hashes match the hashes stored in the header.
		for i, event := range events {
			if event.Hash != common.Hash(blockHeader.EventHashes[i]) {
				return nil, RiverError(
					Err_BAD_BLOCK,
					"Block event hash did not match hash in header",
				).Func("NewMiniblockInfoFromProto").
					Tag("eventIndex", i).
					Tag("blockEventHash", event.Hash).
					Tag("headerEventHash", blockHeader.EventHashes[i])
			}
		}
	}

	if (opts.ExpectedLastMiniblockHash != common.Hash{}) {
		if !bytes.Equal(opts.ExpectedLastMiniblockHash[:], blockHeader.PrevMiniblockHash) {
			return nil, RiverError(
				Err_BAD_BLOCK,
				"Last miniblock hash does not equal expected",
			).Func("NewMiniblockInfoFromProto").
				Tag("expectedLastMiniblockHash", opts.ExpectedLastMiniblockHash).
				Tag("prevMiniblockHash", hex.EncodeToString(blockHeader.PrevMiniblockHash))
		}
	} else if blockHeader.MiniblockNum == 0 {
		if blockHeader.PrevMiniblockHash != nil {
			return nil, RiverError(
				Err_BAD_BLOCK,
				"Last miniblock hash for first block should be unset",
			).Func("NewMiniblockInfoFromProto").
				Tag("prevMiniblockHash", hex.EncodeToString(blockHeader.PrevMiniblockHash))
		}
	}

	if opts.ExpectedEventNumOffset > 0 {
		if opts.ExpectedEventNumOffset != blockHeader.EventNumOffset {
			return nil, RiverError(
				Err_BAD_BLOCK,
				"Miniblock header eventNumOffset does not equal expected",
			).Func("NewMiniblockInfoFromProto").
				Tag("expectedEventNumOffset", opts.ExpectedEventNumOffset).
				Tag("eventNumOffset", blockHeader.EventNumOffset)
		}
	} else if blockHeader.MiniblockNum == 0 && blockHeader.EventNumOffset != 0 {
		return nil, RiverError(
			Err_BAD_BLOCK,
			"Header of first miniblock eventNumOffset is not zero",
		).Func("NewMiniblockInfoFromProto").
			Tag("eventNumOffset", blockHeader.EventNumOffset)
	}

	if (opts.ExpectedMinimumTimestampExclusive != time.Time{}) {
		if !blockHeader.Timestamp.AsTime().After(opts.ExpectedMinimumTimestampExclusive) {
			return nil, RiverError(
				Err_BAD_BLOCK,
				"Expected header timestamp to occur after minimum time",
			).Func("NewMiniblockInfoFromProto").
				Tag("headerTimestamp", blockHeader.Timestamp.AsTime()).
				Tag("minimumTimeExclusive", opts.ExpectedMinimumTimestampExclusive)
		}
	}

	if opts.ExpectedPrevSnapshotMiniblockNum != 0 || blockHeader.MiniblockNum == 0 {
		if blockHeader.PrevSnapshotMiniblockNum != opts.ExpectedPrevSnapshotMiniblockNum {
			return nil, RiverError(
				Err_BAD_BLOCK,
				"Previous snapshot miniblock num did not match expected",
			).Func("NewMiniblockInfoFromProto").
				Tag("expectedPrevSnapshotMiniblockNum", opts.ExpectedPrevSnapshotMiniblockNum).
				Tag("prevSnapshotMiniblockNum", blockHeader.PrevSnapshotMiniblockNum)
		}
	}

	// TODO: snapshot validation if requested
	// (How to think about versioning?)

	return &MiniblockInfo{
		Ref: &MiniblockRef{
			Hash: headerEvent.Hash,
			Num:  blockHeader.MiniblockNum,
		},
		headerEvent:        headerEvent,
		useGetterForEvents: events,
		Proto:              pb,
	}, nil
}

func NewMiniblocksInfoFromProtos(pbs []*Miniblock, opts NewMiniblockInfoFromProtoOpts) ([]*MiniblockInfo, error) {
	var err error
	mbs := make([]*MiniblockInfo, len(pbs))
	for i, pb := range pbs {
		o := opts
		if o.ExpectedBlockNumber >= 0 {
			o.ExpectedBlockNumber += int64(i)
		}
		mbs[i], err = NewMiniblockInfoFromProto(pb, o)
		if err != nil {
			return nil, err
		}
	}
	return mbs, nil
}

func NewMiniblockInfoFromParsed(headerEvent *ParsedEvent, events []*ParsedEvent) (*MiniblockInfo, error) {
	if headerEvent.Event.GetMiniblockHeader() == nil {
		return nil, RiverError(Err_BAD_EVENT, "header event must be a block header")
	}

	envelopes := make([]*Envelope, len(events))
	for i, e := range events {
		envelopes[i] = e.Envelope
	}

	return &MiniblockInfo{
		Ref: &MiniblockRef{
			Hash: headerEvent.Hash,
			Num:  headerEvent.Event.GetMiniblockHeader().MiniblockNum,
		},
		headerEvent:        headerEvent,
		useGetterForEvents: events,
		Proto: &Miniblock{
			Header: headerEvent.Envelope,
			Events: envelopes,
		},
	}, nil
}

func NewMiniblockInfoFromHeaderAndParsed(
	wallet *crypto.Wallet,
	header *MiniblockHeader,
	events []*ParsedEvent,
) (*MiniblockInfo, error) {
	headerEvent, err := MakeParsedEventWithPayload(
		wallet,
		Make_MiniblockHeader(header),
		&MiniblockRef{
			Hash: common.BytesToHash(header.PrevMiniblockHash),
			Num:  max(header.MiniblockNum-1, 0),
		},
	)
	if err != nil {
		return nil, err
	}

	return NewMiniblockInfoFromParsed(headerEvent, events)
}

func (b *MiniblockInfo) ToBytes() ([]byte, error) {
	serialized, err := proto.Marshal(b.Proto)
	if err == nil {
		return serialized, nil
	}
	return nil, AsRiverError(err, Err_INTERNAL).
		Message("Failed to serialize miniblockinfo to bytes").
		Func("ToBytes")
}

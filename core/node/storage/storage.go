package storage

import (
	"context"

	"github.com/ethereum/go-ethereum/common"

	. "github.com/river-build/river/core/node/shared"
)

const (
	StreamStorageTypePostgres          = "postgres"
	NotificationStorageTypePostgres    = "postgres"
	RiverChainBlockLogIndexUnspecified = 9_999_999
)

type ReadStreamFromLastSnapshotResult struct {
	StartMiniblockNumber    int64
	SnapshotMiniblockOffset int
	Miniblocks              [][]byte
	MinipoolEnvelopes       [][]byte
}

type StreamStorage interface {
	// CreateStreamStorage creates a new stream with the given genesis miniblock at index 0.
	// Last snapshot minblock index is set to 0.
	// Minipool is set to generation number 1 (i.e. number of miniblock that is going to be produced next) and is empty.
	CreateStreamStorage(ctx context.Context, streamId StreamId, nodes []common.Address, genesisMiniblockHash common.Hash, genesisMiniblock []byte) error

	// ReadStreamFromLastSnapshot reads last stream miniblocks and guarantees that last snapshot miniblock is included.
	// It attempts to read at least numToRead miniblocks, but may return less if there are not enough miniblocks in storage,
	// or more, if there are more miniblocks since the last snapshot.
	// Also returns minipool envelopes for the current minipool.
	ReadStreamFromLastSnapshot(
		ctx context.Context,
		streamId StreamId,
		numToRead int,
	) (*ReadStreamFromLastSnapshotResult, error)

	// ReadMiniblocks returns miniblocks with miniblockNum or "generation" from fromInclusive, to toExlusive.
	ReadMiniblocks(ctx context.Context, streamId StreamId, fromInclusive int64, toExclusive int64) ([][]byte, error)

	// ReadMiniblocksByStream calls onEachMb for each selected miniblock
	ReadMiniblocksByStream(ctx context.Context, streamId StreamId, onEachMb func(blockdata []byte, seqNum int) error) error

	// WriteEvent adds event to the given minipool.
	// Current generation of minipool should match minipoolGeneration,
	// and there should be exactly minipoolSlot events in the minipool.
	WriteEvent(
		ctx context.Context,
		streamId StreamId,
		minipoolGeneration int64,
		minipoolSlot int,
		envelope []byte,
	) error

	// WriteMiniblockCandidate adds a proposal candidate for future miniblock.
	WriteMiniblockCandidate(
		ctx context.Context,
		streamId StreamId,
		blockHash common.Hash,
		blockNumber int64,
		miniblock []byte,
	) error

	ReadMiniblockCandidate(
		ctx context.Context,
		streamId StreamId,
		blockHash common.Hash,
		blockNumber int64,
	) ([]byte, error)

	// WriteMiniblocks writes miniblocks to the stream storage and creates new minipool.
	//
	// WriteMiniblocks checks that storage is in the consistent state matching the arguments.
	//
	// Old minipool is deleted, new miniblocks are inserted, new minipool is created,
	// latest snapshot generation record is updated if required and old miniblock candidates are deleted.
	//
	// While miniblock number and minipool generations arguments are redundant to each other,
	// they are used to confirm intention of the calling code and to make correctness checks easier.
	WriteMiniblocks(
		ctx context.Context,
		streamId StreamId,
		miniblocks []*WriteMiniblockData,
		newMinipoolGeneration int64,
		newMinipoolEnvelopes [][]byte,
		prevMinipoolGeneration int64,
		prevMinipoolSize int,
	) error

	// CreateStreamArchiveStorage creates a new archive storage for the given stream.
	// Unlike regular CreateStreamStorage, only entry in es table and partition table for miniblocks are created.
	CreateStreamArchiveStorage(
		ctx context.Context,
		streamId StreamId,
	) error

	// GetMaxArchivedMiniblockNumber returns the maximum miniblock number that has been archived for the given stream.
	// If stream record is created, but no miniblocks are archived, returns -1.
	GetMaxArchivedMiniblockNumber(ctx context.Context, streamId StreamId) (int64, error)

	// WriteArchiveMiniblocks writes miniblocks to the archive storage.
	// Miniblocks are written starting from startMiniblockNum.
	// It checks that startMiniblockNum - 1 miniblock exists in storage.
	WriteArchiveMiniblocks(
		ctx context.Context,
		streamId StreamId,
		startMiniblockNum int64,
		miniblocks [][]byte,
	) error

	DebugReadStreamData(
		ctx context.Context,
		streamId StreamId,
	) (*DebugReadStreamDataResult, error)

	// GetLastMiniblockNumber returns the last miniblock number for the given stream from storage.
	GetLastMiniblockNumber(ctx context.Context, streamID StreamId) (int64, error)

	// AllStreamsMetaData returns all available stream metadata. Stream metadata is a local copy
	// of streams data as stored in the River chain stream registry. Its purpose is to provide a
	// fast local cache of stream data allowing the node to only fetch changes that happened since
	// the last time this local copy was updated. Each metadata record contains the River chain
	// block number and log index that indicates when the last time the record was updated from
	// chain.
	AllStreamsMetaData(ctx context.Context) (map[StreamId]*StreamMetadata, int64, error)

	// UpdateStreamsMetaData updates for all given streams their metadata.
	// This performs an upsert on the given `upserts` allowing for new streams to be inserted and
	// existing streams to be updated. Records in the given `removals` collection are deleted.
	UpdateStreamsMetaData(
		ctx context.Context,
		streams map[StreamId]*StreamMetadata,
		removals []StreamId,
	) error

	Close(ctx context.Context)
}

type WriteMiniblockData struct {
	Number   int64
	Hash     common.Hash
	Snapshot bool
	Data     []byte
}

type MiniblockData struct {
	StreamID      StreamId
	Number        int64
	MiniBlockInfo []byte
}

type MiniblockDescriptor struct {
	MiniblockNumber int64
	Data            []byte
	Hash            common.Hash // Only set for miniblock candidates
}

type EventDescriptor struct {
	Generation int64
	Slot       int64
	Data       []byte
}

type DebugReadStreamDataResult struct {
	StreamId                   StreamId
	LatestSnapshotMiniblockNum int64
	Miniblocks                 []MiniblockDescriptor
	Events                     []EventDescriptor
	MbCandidates               []MiniblockDescriptor
}

// StreamMetadata represents stream metadata.
type StreamMetadata struct {
	// StreamId is the unique stream identifier
	StreamId StreamId
	// Nodes that this stream is managed by.
	Nodes []common.Address
	// MiniblockHash contains the latest miniblock hash for this stream as locally known.
	MiniblockHash common.Hash
	// MiniblockNumber contains the latest miniblock number for this stream as locally known.
	MiniblockNumber int64
	// IsSealed indicates that no more blocks can be added to the stream.
	IsSealed bool
	// dirty is an internal bool indicating if the record was changed
	dirty bool
}

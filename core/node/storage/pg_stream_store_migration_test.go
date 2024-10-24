package storage

import (
	"strings"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/require"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/base/test"
	"github.com/river-build/river/core/node/infra"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/testutils"
	"github.com/river-build/river/core/node/testutils/dbtestutils"
)

// Set up streams in various states before a migration and validate they read and mutate correctly
// after the migration.
// After migration, we should able to:
// - ReadStreamFromLastSnapshot, DebugReadStreamData
// - WriteEvent, with appropriate changes in stream state
// - ReadMiniblocks
// - Read, write, and promote miniblock candidates, with appropriate changes in stream state
// - ImportMiniblocks on top of the stream
func TestLegacyStreamDataAfterStoreMigration(t *testing.T) {
	ctx, ctxCloser := test.NewTestContext()
	defer ctxCloser()

	dbCfg, dbSchemaName, dbCloser, err := dbtestutils.ConfigureDB(ctx)
	if err != nil {
		panic(err)
	}
	// Delete schema
	defer dbCloser()

	dbCfg.StartupDelay = 2 * time.Millisecond
	dbCfg.Extra = strings.Replace(dbCfg.Extra, "pool_max_conns=1000", "pool_max_conns=10", 1)

	pool, err := CreateAndValidatePgxPool(
		ctx,
		dbCfg,
		dbSchemaName,
		nil,
	)
	require.NoError(t, err)

	deprecatedStore, err := NewDeprecatedPostgresStreamStore(
		ctx,
		pool,
		GenShortNanoid(),
		make(chan error, 1),
		infra.NewMetricsFactory(nil, "", ""),
	)
	require.NoError(t, err)

	streamId1 := testutils.FakeStreamId(STREAM_CHANNEL_BIN)
	streamId2 := testutils.FakeStreamId(STREAM_CHANNEL_BIN)
	streamId3 := testutils.FakeStreamId(STREAM_CHANNEL_BIN)

	// Set up a stream with a genesis miniblock. This stream will have a single miniblock and en
	// empty minipool.
	// example streams:
	// stream 1: genesis miniblock, empty minipool
	// stream 2: genesis miniblock, miniblock candidate, single event in the minipool
	// stream 3: stream with multiple blocks and a snapshot, candidates, events in the pool

	// Stream 1 setup
	genesisMiniblock := []byte("genesisMiniblock")
	err = deprecatedStore.CreateStreamStorage(ctx, streamId1, genesisMiniblock)
	require.NoError(t, err)

	// Stream 2 setup
	err = deprecatedStore.CreateStreamStorage(ctx, streamId2, []byte("genesisMiniblock2"))
	require.NoError(t, err)

	blockHash := common.BytesToHash([]byte("st"))
	err = deprecatedStore.WriteMiniblockCandidate(ctx, streamId2, blockHash, 1, []byte("stream2_candidate_hash"))
	require.NoError(t, err)

	err = deprecatedStore.WriteEvent(ctx, streamId2, 1, 0, []byte("event0"))
	require.NoError(t, err)

	// Stream 3 setup
	err = deprecatedStore.CreateStreamStorage(ctx, streamId3, []byte("genesisMiniblock3"))
	require.NoError(t, err)

	stream3Blocks := []MiniblockDescriptor{
		{
			MiniblockNumber: 1,
			Data:            []byte("block1_data"),
			Hash:            common.BytesToHash([]byte("hash1")),
		},
		{
			MiniblockNumber: 2,
			Data:            []byte("block2_data"),
			Hash:            common.BytesToHash([]byte("hash2")),
		},
		{
			MiniblockNumber: 3,
			Data:            []byte("block3_data"),
			Hash:            common.BytesToHash([]byte("hash3")),
		},
		{
			MiniblockNumber: 4,
			Data:            []byte("block4_data"),
			Hash:            common.BytesToHash([]byte("hash4")),
		},
	}
	for _, candidate := range stream3Blocks {
		err = deprecatedStore.WriteMiniblockCandidate(
			ctx,
			streamId3,
			candidate.Hash,
			candidate.MiniblockNumber,
			candidate.Data,
		)
		require.NoError(t, err)

		// Leave block 4 as a candidate, do not promote.
		if candidate.MiniblockNumber == 4 {
			break
		}

		// Snapshot block 2, leave block 4 as a candidate
		err = deprecatedStore.PromoteMiniblockCandidate(
			ctx,
			streamId3,
			candidate.MiniblockNumber,
			candidate.Hash,
			candidate.MiniblockNumber == 2,
			[][]byte{},
		)
		require.NoError(t, err)
	}

	require.NoError(t, deprecatedStore.WriteEvent(ctx, streamId3, 4, 0, []byte("event0")))
	require.NoError(t, deprecatedStore.WriteEvent(ctx, streamId3, 4, 1, []byte("event1")))

	deprecatedStore.Close(ctx)

	// Create store
	pool, err = CreateAndValidatePgxPool(
		ctx,
		dbCfg,
		dbSchemaName,
		nil,
	)
	require.NoError(t, err)
	store, err := NewPostgresStreamStore(
		ctx,
		pool,
		GenShortNanoid(),
		make(chan error, 1),
		infra.NewMetricsFactory(nil, "", ""),
	)
	require.NoError(t, err, "Unable to create postgres store")
	defer store.Close(ctx)

	// Stream 1 check: one miniblock, empty minipool
	checkStreamState(
		t,
		ctx,
		store,
		&DebugReadStreamDataResult{
			StreamId:                   streamId1,
			LatestSnapshotMiniblockNum: 0,
			Migrated:                   false,
			Miniblocks: []MiniblockDescriptor{
				{
					MiniblockNumber: 0,
					Data:            genesisMiniblock,
				},
			},
			Events: []EventDescriptor{
				{
					Generation: 1,
					Slot:       -1,
				},
			},
		},
	)

	// Add events and check stream state in storage
	err = store.WriteEvent(ctx, streamId1, 1, 0, []byte("event0"))
	require.NoError(t, err)
	err = store.WriteEvent(ctx, streamId1, 1, 1, []byte("event1"))
	require.NoError(t, err)

	// Check constraints are still applied to unmigrated streams:
	// Bad generation
	err = store.WriteEvent(ctx, streamId1, 5, 2, []byte("wrong generation"))
	require.ErrorContains(t, err, "Wrong event generation in minipool")
	// Bad slot number
	err = store.WriteEvent(ctx, streamId1, 1, 5, []byte("bad slot number"))
	require.ErrorContains(t, err, "Wrong number of records in minipool")

	checkStreamState(
		t,
		ctx,
		store,
		&DebugReadStreamDataResult{
			StreamId:                   streamId1,
			LatestSnapshotMiniblockNum: 0,
			Migrated:                   false,
			Miniblocks: []MiniblockDescriptor{
				{
					MiniblockNumber: 0,
					Data:            genesisMiniblock,
				},
			},
			Events: []EventDescriptor{
				{
					Generation: 1,
					Slot:       -1,
				},
				{
					Generation: 1,
					Slot:       0,
					Data:       []byte("event0"),
				},
				{
					Generation: 1,
					Slot:       1,
					Data:       []byte("event1"),
				},
			},
		},
	)

	// Write miniblock candidates
	candidateHash1 := common.BytesToHash([]byte("block_hash1"))
	candidateHash2 := common.BytesToHash([]byte("block_hash2"))
	candidateHash3 := common.BytesToHash([]byte("block_hash3"))
	candidateHash4 := common.BytesToHash([]byte("block_hash4"))
	err = store.WriteMiniblockCandidate(ctx, streamId1, candidateHash1, 1, []byte("miniblock1_candidate0"))
	require.NoError(t, err)
	err = store.WriteMiniblockCandidate(ctx, streamId1, candidateHash2, 1, []byte("miniblock1_candidate1"))
	require.NoError(t, err)
	err = store.WriteMiniblockCandidate(ctx, streamId1, candidateHash3, 2, []byte("miniblock2_candidate0"))
	require.NoError(t, err)
	err = store.WriteMiniblockCandidate(ctx, streamId1, candidateHash4, 0, []byte("bad_block_number"))
	require.ErrorContains(t, err, "Miniblock proposal blockNumber mismatch")

	checkStreamState(
		t,
		ctx,
		store,
		&DebugReadStreamDataResult{
			StreamId:                   streamId1,
			LatestSnapshotMiniblockNum: 0,
			Migrated:                   false,
			Miniblocks: []MiniblockDescriptor{
				{
					MiniblockNumber: 0,
					Data:            genesisMiniblock,
				},
			},
			Events: []EventDescriptor{
				{
					Generation: 1,
					Slot:       -1,
				},
				{
					Generation: 1,
					Slot:       0,
					Data:       []byte("event0"),
				},
				{
					Generation: 1,
					Slot:       1,
					Data:       []byte("event1"),
				},
			},
			MbCandidates: []MiniblockDescriptor{
				{
					MiniblockNumber: 1,
					Data:            []byte("miniblock1_candidate0"),
					Hash:            candidateHash1,
				},
				{
					MiniblockNumber: 1,
					Data:            []byte("miniblock1_candidate1"),
					Hash:            candidateHash2,
				},
				{
					MiniblockNumber: 2,
					Data:            []byte("miniblock2_candidate0"),
					Hash:            candidateHash3,
				},
			},
		},
	)

	// Promote a new miniblock
	err = store.PromoteMiniblockCandidate(
		ctx,
		streamId1,
		1,
		candidateHash2,
		true,
		[][]byte{
			// Retain event 1
			[]byte("event1"),
		},
	)
	require.NoError(t, err)

	checkStreamState(
		t,
		ctx,
		store,
		&DebugReadStreamDataResult{
			StreamId:                   streamId1,
			LatestSnapshotMiniblockNum: 1,
			Migrated:                   false,
			Miniblocks: []MiniblockDescriptor{
				{
					MiniblockNumber: 0,
					Data:            genesisMiniblock,
				},
				{
					MiniblockNumber: 1,
					Data:            []byte("miniblock1_candidate1"),
				},
			},
			Events: []EventDescriptor{
				{
					Generation: 2,
					Slot:       -1,
				},
				{
					Generation: 2,
					Slot:       0,
					Data:       []byte("event1"),
				},
			},
			MbCandidates: []MiniblockDescriptor{
				{
					MiniblockNumber: 2,
					Data:            []byte("miniblock2_candidate0"),
					Hash:            candidateHash3,
				},
			},
		},
	)

	// Import miniblocks
	err = store.ImportMiniblocks(
		ctx,
		[]*MiniblockData{
			{
				StreamID:      streamId1,
				Number:        2,
				MiniBlockInfo: []byte("block2"),
			},
			{
				StreamID:      streamId1,
				Number:        3,
				MiniBlockInfo: []byte("block3"),
			},
		},
	)
	require.NoError(t, err, "Error importing miniblocks")

	checkStreamState(
		t,
		ctx,
		store,
		&DebugReadStreamDataResult{
			StreamId:                   streamId1,
			LatestSnapshotMiniblockNum: 1,
			Migrated:                   false,
			Miniblocks: []MiniblockDescriptor{
				{
					MiniblockNumber: 0,
					Data:            genesisMiniblock,
				},
				{
					MiniblockNumber: 1,
					Data:            []byte("miniblock1_candidate1"),
				},
				{
					MiniblockNumber: 2,
					Data:            []byte("block2"),
				},
				{
					MiniblockNumber: 3,
					Data:            []byte("block3"),
				},
			},
			Events: []EventDescriptor{
				{
					Generation: 4,
					Slot:       -1,
				},
			},
			// TODO: this is a bug, candidates < the current committed block # should be dropped
			// whenever blocks are imported.
			MbCandidates: []MiniblockDescriptor{
				{
					MiniblockNumber: 2,
					Data:            []byte("miniblock2_candidate0"),
					Hash:            candidateHash3,
				},
			},
		},
	)
}

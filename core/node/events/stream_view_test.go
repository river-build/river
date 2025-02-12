package events

import (
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/proto"

	. "github.com/towns-protocol/towns/core/node/base"
	"github.com/towns-protocol/towns/core/node/base/test"
	"github.com/towns-protocol/towns/core/node/crypto"
	. "github.com/towns-protocol/towns/core/node/protocol"
	. "github.com/towns-protocol/towns/core/node/shared"
	"github.com/towns-protocol/towns/core/node/storage"
)

func parsedEvent(t *testing.T, envelope *Envelope) *ParsedEvent {
	parsed, err := ParseEvent(envelope)
	assert.NoError(t, err)
	return parsed
}

func TestLoad(t *testing.T) {
	ctx, cancel := test.NewTestContext()
	defer cancel()
	userWallet, _ := crypto.NewWallet(ctx)
	nodeWallet, _ := crypto.NewWallet(ctx)
	params := &StreamCacheParams{
		Wallet: nodeWallet,
	}
	streamId := UserStreamIdFromAddr(userWallet.Address)

	userAddress := userWallet.Address[:]

	inception, err := MakeEnvelopeWithPayload(
		userWallet,
		Make_UserPayload_Inception(streamId, nil),
		nil,
	)
	assert.NoError(t, err)
	join, err := MakeEnvelopeWithPayload(
		userWallet,
		Make_UserPayload_Membership(MembershipOp_SO_JOIN, streamId, nil, nil),
		nil,
	)
	assert.NoError(t, err)
	miniblockHeader, err := Make_GenesisMiniblockHeader([]*ParsedEvent{parsedEvent(t, inception), parsedEvent(t, join)})
	assert.NoError(t, err)
	miniblockHeaderProto, err := MakeEnvelopeWithPayload(
		userWallet,
		Make_MiniblockHeader(miniblockHeader),
		nil,
	)
	assert.NoError(t, err)

	miniblockProto := &Miniblock{
		Header: miniblockHeaderProto,
		Events: []*Envelope{inception, join},
	}
	miniblockProtoBytes, err := proto.Marshal(miniblockProto)
	assert.NoError(t, err)

	view, err := MakeStreamView(
		ctx,
		&storage.ReadStreamFromLastSnapshotResult{
			Miniblocks: [][]byte{miniblockProtoBytes},
		},
	)

	assert.NoError(t, err)

	assert.Equal(t, streamId, *view.StreamId())

	ip := view.InceptionPayload()
	ipStreamId, err := StreamIdFromBytes(ip.GetStreamId())
	assert.NoError(t, err)
	assert.NotNil(t, ip)
	assert.Equal(t, parsedEvent(t, inception).Event.GetInceptionPayload().GetStreamId(), ip.GetStreamId())
	assert.Equal(t, streamId, ipStreamId)

	joined, err := view.IsMember(userAddress) // joined is only valid on user, space and channel views
	assert.NoError(t, err)
	assert.True(t, joined)

	last := view.LastEvent()
	assert.NotNil(t, last)
	assert.Equal(t, join.Hash, last.Hash[:])

	miniEnvelopes := view.MinipoolEnvelopes()
	assert.Equal(t, 0, len(miniEnvelopes))

	count1 := 0
	newEnvelopesHashes := make([]common.Hash, 0)
	_ = view.forEachEvent(0, func(e *ParsedEvent, minibockNum int64, eventNum int64) (bool, error) {
		assert.Equal(t, int64(count1), eventNum)
		count1++
		newEnvelopesHashes = append(newEnvelopesHashes, e.Hash)
		return true, nil
	})

	assert.Equal(t, 3, len(newEnvelopesHashes))
	assert.Equal(
		t,
		[]common.Hash{
			common.BytesToHash(inception.Hash),
			common.BytesToHash(join.Hash),
			common.BytesToHash(miniblockHeaderProto.Hash),
		},
		newEnvelopesHashes,
	)

	cookie := view.SyncCookie(nodeWallet.Address)
	cookieStreamId, err := StreamIdFromBytes(cookie.StreamId)
	assert.NoError(t, err)
	assert.NotNil(t, cookie)
	assert.Equal(t, streamId, cookieStreamId)
	assert.Equal(t, int64(1), cookie.MinipoolGen)
	assert.Equal(t, int64(0), cookie.MinipoolSlot)

	// Check minipool, should be empty
	assert.Equal(t, 0, len(view.minipool.events.Values))

	cfg := crypto.DefaultOnChainSettings()

	// check for invalid config
	num := cfg.MinSnapshotEvents.ForType(0)
	assert.EqualValues(t, num, 100) // hard coded default

	// check snapshot generation
	assert.Equal(t, false, view.shouldSnapshot(cfg))

	// check per stream snapshot generation
	cfg.MinSnapshotEvents.User = 2
	assert.EqualValues(t, 2, cfg.MinSnapshotEvents.ForType(STREAM_USER_BIN))
	assert.Equal(t, false, view.shouldSnapshot(cfg))

	// add one more event (just join again)
	join2, err := MakeEnvelopeWithPayload(
		userWallet,
		Make_UserPayload_Membership(MembershipOp_SO_JOIN, streamId, nil, nil),
		view.LastBlock().Ref,
	)
	assert.NoError(t, err)
	nextEvent := parsedEvent(t, join2)
	err = view.ValidateNextEvent(ctx, cfg, nextEvent, time.Now())
	assert.NoError(t, err)
	view, err = view.copyAndAddEvent(nextEvent)
	assert.NoError(t, err)

	// with one new event, we shouldn't snapshot yet
	assert.Equal(t, false, view.shouldSnapshot(cfg))

	// and miniblocks should have nil snapshots
	resp, err := view.ProposeNextMiniblock(ctx, cfg, &ProposeMiniblockRequest{
		StreamId:          streamId[:],
		NewMiniblockNum:   view.minipool.generation,
		PrevMiniblockHash: view.LastBlock().Ref.Hash[:],
	})
	require.NoError(t, err)
	require.Len(t, resp.MissingEvents, view.minipool.events.Len())
	mbCandidate, err := view.MakeMiniblockCandidate(ctx, params, mbProposalFromProto(resp.Proposal))
	require.NoError(t, err)
	assert.Nil(t, mbCandidate.headerEvent.Event.GetMiniblockHeader().Snapshot)

	// add another join event
	join3, err := MakeEnvelopeWithPayload(
		userWallet,
		Make_UserPayload_Membership(MembershipOp_SO_JOIN, streamId, nil, nil),
		view.LastBlock().Ref,
	)
	assert.NoError(t, err)
	nextEvent = parsedEvent(t, join3)
	assert.NoError(t, err)
	err = view.ValidateNextEvent(ctx, cfg, nextEvent, time.Now())
	assert.NoError(t, err)
	view, err = view.copyAndAddEvent(nextEvent)
	assert.NoError(t, err)
	// with two new events, we should snapshot
	assert.Equal(t, true, view.shouldSnapshot(cfg))
	assert.Equal(t, 1, len(view.blocks))
	assert.Equal(t, 2, len(view.blocks[0].Events()))

	// and miniblocks should have non - nil snapshots
	resp, err = view.ProposeNextMiniblock(ctx, cfg, &ProposeMiniblockRequest{
		StreamId:          streamId[:],
		NewMiniblockNum:   view.minipool.generation,
		PrevMiniblockHash: view.LastBlock().Ref.Hash[:],
		LocalEventHashes:  view.minipool.eventHashesAsBytes(),
	})
	require.NoError(t, err)
	require.Len(t, resp.MissingEvents, 0)
	mbCandidate, err = view.MakeMiniblockCandidate(ctx, params, mbProposalFromProto(resp.Proposal))
	require.NoError(t, err)
	miniblockHeader = mbCandidate.headerEvent.Event.GetMiniblockHeader()
	assert.NotNil(t, miniblockHeader.Snapshot)

	// check count2
	count2 := 0
	err = view.forEachEvent(0, func(e *ParsedEvent, minibockNum int64, eventNum int64) (bool, error) {
		assert.Equal(t, int64(count2), eventNum)
		if count2 < 3 {
			assert.Equal(t, int64(0), minibockNum)
		} else {
			assert.Equal(t, int64(1), minibockNum)
		}
		count2++
		return true, nil
	})
	assert.NoError(t, err)
	assert.Equal(t, int64(3), miniblockHeader.EventNumOffset) // 3 events in the genisis miniblock
	assert.Equal(t, 2, len(miniblockHeader.EventHashes))      // 2 join events added in test
	assert.Equal(t, 5, count2)                                // we should iterate over all of them

	// test copy and apply block
	// how many blocks do we currently have?
	assert.Equal(t, len(view.blocks), 1)
	// create a new block
	miniblockHeaderEvent, err := MakeParsedEventWithPayload(
		userWallet,
		Make_MiniblockHeader(miniblockHeader),
		view.LastBlock().Ref,
	)
	assert.NoError(t, err)
	miniblock, err := NewMiniblockInfoFromParsed(miniblockHeaderEvent, mbCandidate.Events())
	assert.NoError(t, err)
	// with 5 generations (5 blocks kept in memory)
	newSV1, newEvents, err := view.CopyAndApplyBlock(miniblock, cfg)
	assert.NoError(t, err)
	assert.Equal(t, len(newSV1.blocks), 2) // we should have both blocks in memory
	assert.Empty(t, newEvents)

	// with 0 generations (0 in memory block history)
	cfg.RecencyConstraintsGen = 0
	newSV2, newEvents, err := view.CopyAndApplyBlock(miniblock, cfg)
	assert.NoError(t, err)
	assert.Equal(t, len(newSV2.blocks), 1) // we should only have the latest block in memory
	assert.Empty(t, newEvents)
	// add an event with an old hash
	join4, err := MakeEnvelopeWithPayload(
		userWallet,
		Make_UserPayload_Membership(MembershipOp_SO_LEAVE, streamId, nil, nil),
		newSV1.blocks[0].Ref,
	)
	assert.NoError(t, err)
	nextEvent = parsedEvent(t, join4)
	assert.NoError(t, err)
	err = newSV1.ValidateNextEvent(ctx, cfg, nextEvent, time.Now())
	assert.NoError(t, err)
	_, err = newSV1.copyAndAddEvent(nextEvent)
	assert.NoError(t, err)
	// wait 2 second
	time.Sleep(2 * time.Second)

	// try with tighter recency constraints
	cfg.RecencyConstraintsGen = 5
	cfg.RecencyConstraintsAge = 1 * time.Second

	err = newSV1.ValidateNextEvent(ctx, cfg, nextEvent, time.Now())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "BAD_PREV_MINIBLOCK_HASH")
}

func toBytes(t *testing.T, mb *MiniblockInfo) []byte {
	mbBytes, err := mb.ToBytes()
	require.NoError(t, err)
	return mbBytes
}

func TestMbHashConstraints(t *testing.T) {
	ctx, cancel := test.NewTestContext()
	defer cancel()
	require := require.New(t)
	userWallet, _ := crypto.NewWallet(ctx)
	nodeWallet, _ := crypto.NewWallet(ctx)
	streamId := UserSettingStreamIdFromAddr(userWallet.Address)

	timeNow := time.Now()
	var mbBytes [][]byte
	var mbs []*MiniblockInfo

	genMb := MakeGenesisMiniblockForUserSettingsStream(t, userWallet, nodeWallet, streamId)
	mbBytes = append(mbBytes, toBytes(t, genMb))
	mbs = append(mbs, genMb)

	prevMb := genMb
	for range 10 {
		mb := MakeTestBlockForUserSettingsStream(t, userWallet, nodeWallet, prevMb)
		mbBytes = append(mbBytes, toBytes(t, mb))
		mbs = append(mbs, mb)
		prevMb = mb
	}

	view, err := MakeStreamView(
		ctx,
		&storage.ReadStreamFromLastSnapshotResult{
			Miniblocks: mbBytes,
		},
	)
	require.NoError(err)

	cfg := crypto.DefaultOnChainSettings()

	for i, mb := range mbs {
		err = view.ValidateNextEvent(
			ctx,
			cfg,
			MakeEvent(
				t,
				userWallet,
				Make_UserSettingsPayload_FullyReadMarkers(&UserSettingsPayload_FullyReadMarkers{}),
				mb.Ref,
			),
			timeNow,
		)
		// TODO: this should only be 5 last blocks
		require.NoError(err, "Any block recent enough should be good %d", i)
	}

	for i, mb := range mbs {
		err = view.ValidateNextEvent(
			ctx,
			cfg,
			MakeEvent(
				t,
				userWallet,
				Make_UserSettingsPayload_FullyReadMarkers(&UserSettingsPayload_FullyReadMarkers{}),
				mb.Ref,
			),
			timeNow.Add(60*time.Second),
		)
		// only 2 last blocks are good enough if all blocks are old.
		if i <= 9 {
			require.Error(err, "Shouldn't be able to add with too old block %d", i)
			require.EqualValues(AsRiverError(err).Code, Err_BAD_PREV_MINIBLOCK_HASH)
		} else {
			require.NoError(err, "Should be able to add with last block ref %d", i)
		}
	}

	newMb := MakeTestBlockForUserSettingsStream(t, userWallet, nodeWallet, prevMb)
	err = view.ValidateNextEvent(
		ctx,
		cfg,
		MakeEvent(
			t,
			userWallet,
			Make_UserSettingsPayload_FullyReadMarkers(&UserSettingsPayload_FullyReadMarkers{}),
			newMb.Ref,
		),
		timeNow,
	)
	require.Error(err)
	require.EqualValues(AsRiverError(err).Code, Err_MINIBLOCK_TOO_NEW)
}

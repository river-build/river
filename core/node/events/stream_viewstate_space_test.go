package events

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/proto"

	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
	"github.com/river-build/river/core/node/testutils"
)

func makeEnvelopeWithPayload_T(
	t *testing.T,
	wallet *crypto.Wallet,
	payload protocol.IsStreamEvent_Payload,
	prevMiniblock *MiniblockRef,
) *protocol.Envelope {
	envelope, err := MakeEnvelopeWithPayload(wallet, payload, prevMiniblock)
	require.NoError(t, err)
	return envelope
}

func makeTestSpaceStream(
	t *testing.T,
	userWallet *crypto.Wallet,
	spaceId StreamId,
	streamSettings *protocol.StreamSettings,
) ([]*ParsedEvent, *protocol.Miniblock) {
	userAddess := userWallet.Address.Bytes()
	if streamSettings == nil {
		streamSettings = &protocol.StreamSettings{
			DisableMiniblockCreation: true,
		}
	}
	inception := makeEnvelopeWithPayload_T(
		t,
		userWallet,
		Make_SpacePayload_Inception(
			spaceId,
			streamSettings,
		),
		nil,
	)
	join := makeEnvelopeWithPayload_T(
		t,
		userWallet,
		Make_MemberPayload_Membership(protocol.MembershipOp_SO_JOIN, userAddess, userAddess, nil),
		nil,
	)

	events := []*ParsedEvent{
		parsedEvent(t, inception),
		parsedEvent(t, join),
	}
	mb, err := MakeGenesisMiniblock(userWallet, events)
	require.NoError(t, err)
	return events, mb
}

func makeTestChannelStream(
	t *testing.T,
	wallet *crypto.Wallet,
	userId string,
	channelStreamId StreamId,
	spaceSpaceId StreamId,
	streamSettings *protocol.StreamSettings,
) ([]*ParsedEvent, *protocol.Miniblock) {
	if streamSettings == nil {
		streamSettings = &protocol.StreamSettings{
			DisableMiniblockCreation: true,
		}
	}
	inception := makeEnvelopeWithPayload_T(
		t,
		wallet,
		Make_ChannelPayload_Inception(
			channelStreamId,
			spaceSpaceId,
			streamSettings,
		),
		nil,
	)
	join := makeEnvelopeWithPayload_T(
		t,
		wallet,
		Make_ChannelPayload_Membership(protocol.MembershipOp_SO_JOIN, userId, userId, &spaceSpaceId),
		nil,
	)
	events := []*ParsedEvent{
		parsedEvent(t, inception),
		parsedEvent(t, join),
	}
	mb, err := MakeGenesisMiniblock(wallet, events)
	require.NoError(t, err)
	return events, mb
}

func joinSpace_T(
	t *testing.T,
	wallet *crypto.Wallet,
	ctx context.Context,
	syncStream SyncStream,
	users []string,
) {
	stream := syncStream.(*streamImpl)
	for _, user := range users {
		err := stream.AddEvent(
			ctx,
			parsedEvent(
				t,
				makeEnvelopeWithPayload_T(
					t,
					wallet,
					Make_SpacePayload_Membership(
						protocol.MembershipOp_SO_JOIN,
						user,
						user,
					),
					stream.view().LastBlock().Ref,
				),
			),
		)
		require.NoError(t, err)
	}
}

func joinChannel_T(
	t *testing.T,
	wallet *crypto.Wallet,
	ctx context.Context,
	syncStream SyncStream,
	users []string,
) {
	stream := syncStream.(*streamImpl)
	for _, user := range users {
		err := stream.AddEvent(
			ctx,
			parsedEvent(
				t,
				makeEnvelopeWithPayload_T(
					t,
					wallet,
					Make_ChannelPayload_Membership(
						protocol.MembershipOp_SO_JOIN,
						user,
						user,
						stream.view().StreamParentId(),
					),
					stream.view().LastBlock().Ref,
				),
			),
		)
		require.NoError(t, err)
	}
}

func leaveChannel_T(
	t *testing.T,
	wallet *crypto.Wallet,
	ctx context.Context,
	syncStream SyncStream,
	users []string,
) {
	stream := syncStream.(*streamImpl)
	for _, user := range users {
		err := stream.AddEvent(
			ctx,
			parsedEvent(
				t,
				makeEnvelopeWithPayload_T(
					t,
					wallet,
					Make_ChannelPayload_Membership(
						protocol.MembershipOp_SO_LEAVE,
						user,
						user,
						nil,
					),
					stream.view().LastBlock().Ref,
				),
			),
		)
		require.NoError(t, err)
	}
}

func TestSpaceViewState(t *testing.T) {
	ctx, tt := makeCacheTestContext(t, testParams{
		defaultMinEventsPerSnapshot: 2,
	})
	_ = tt.initCache(0, &MiniblockProducerOpts{
		TestDisableMbProdcutionOnBlock: true,
	})

	user1Wallet, _ := crypto.NewWallet(ctx)
	user2Wallet, _ := crypto.NewWallet(ctx)
	user3Wallet, _ := crypto.NewWallet(ctx)

	// create a stream
	spaceStreamId := testutils.FakeStreamId(STREAM_SPACE_BIN)
	user2Id, err := AddressHex(user2Wallet.Address.Bytes())
	require.NoError(t, err)
	user3Id, err := AddressHex(user3Wallet.Address.Bytes())
	require.NoError(t, err)

	_, mb := makeTestSpaceStream(t, user1Wallet, spaceStreamId, nil)
	s, _ := tt.createStream(spaceStreamId, mb)
	stream := s.(*streamImpl)
	require.NotNil(t, stream)
	// refresh view
	view0, err := stream.GetView(ctx)
	require.NoError(t, err)
	// check that users 2 and 3 are not joined yet,
	checkUserJoined(t, view0.(JoinableStreamView), user1Wallet, true)
	checkUserJoined(t, view0.(JoinableStreamView), user2Wallet, false)
	checkUserJoined(t, view0.(JoinableStreamView), user3Wallet, false)
	// add two more membership events
	// user_2
	joinSpace_T(t, user2Wallet, ctx, stream, []string{user2Id})
	// user_3
	joinSpace_T(t, user3Wallet, ctx, stream, []string{user3Id})
	// get a new view
	view1, err := stream.GetView(ctx)
	require.NoError(t, err)
	// users are not joined yet, since joins and processed on mb boundaries
	checkUserJoined(t, view1.(JoinableStreamView), user1Wallet, true)
	checkUserJoined(t, view1.(JoinableStreamView), user2Wallet, false)
	checkUserJoined(t, view1.(JoinableStreamView), user3Wallet, false)
	require.Equal(t, 1, len(stream.view().blocks))

	// make a miniblock
	_ = tt.makeMiniblock(0, spaceStreamId, false)
	// check that we have 2 blocks
	require.Equal(t, 2, len(stream.view().blocks))
	// refresh view
	view2, err := stream.GetView(ctx)
	require.NoError(t, err)
	// check that users are joined
	checkUserJoined(t, view2.(JoinableStreamView), user1Wallet, true)
	checkUserJoined(t, view2.(JoinableStreamView), user2Wallet, true)
	checkUserJoined(t, view2.(JoinableStreamView), user3Wallet, true)
	// now, turn that block into bytes, then load it back into a view
	miniblocks := stream.view().MiniblocksFromLastSnapshot()
	require.Equal(t, 1, len(miniblocks))
	miniblock := miniblocks[0]
	miniblockProtoBytes, err := proto.Marshal(miniblock)
	require.NoError(t, err)

	// load up a brand new view from the latest snapshot result
	var view3 StreamView
	view3, err = MakeStreamView(
		ctx,
		&storage.ReadStreamFromLastSnapshotResult{
			StartMiniblockNumber: 1,
			Miniblocks:           [][]byte{miniblockProtoBytes},
		},
	)
	require.NoError(t, err)
	require.NotNil(t, view3)

	// check that users are joined when loading from the snapshot
	checkUserJoined(t, view3.(JoinableStreamView), user1Wallet, true)
	checkUserJoined(t, view3.(JoinableStreamView), user2Wallet, true)
	checkUserJoined(t, view3.(JoinableStreamView), user3Wallet, true)
}

func checkUserJoined(
	t *testing.T,
	view JoinableStreamView,
	userWallet *crypto.Wallet,
	expected bool,
) {
	t.Helper()
	joined, err := view.IsMember(userWallet.Address.Bytes())
	require.NoError(t, err, "IsMember failed")
	if expected {
		require.True(t, joined, "User should be joined")
	} else {
		require.False(t, joined, "User should not be joined")
	}
}

func TestChannelViewState_JoinedMembers(t *testing.T) {
	ctx, tt := makeCacheTestContext(t, testParams{
		replFactor:                  1,
		defaultMinEventsPerSnapshot: 2,
	})
	_ = tt.initCache(0, nil)

	userWallet, _ := crypto.NewWallet(ctx)
	aliceWallet, _ := crypto.NewWallet(ctx)
	bobWallet, _ := crypto.NewWallet(ctx)
	carolWallet, _ := crypto.NewWallet(ctx)
	alice, err := AddressHex(aliceWallet.Address.Bytes())
	require.NoError(t, err)
	bob, err := AddressHex(bobWallet.Address.Bytes())
	require.NoError(t, err)
	carol, err := AddressHex(carolWallet.Address.Bytes())
	require.NoError(t, err)
	spaceStreamId := testutils.FakeStreamId(STREAM_SPACE_BIN)
	channelStreamId := testutils.FakeStreamId(STREAM_CHANNEL_BIN)

	// create a space stream and add the members
	_, mb := makeTestSpaceStream(t, userWallet, spaceStreamId, nil)
	sStream, _ := tt.createStream(spaceStreamId, mb)
	spaceStream := sStream.(*streamImpl)
	joinSpace_T(t, userWallet, ctx, spaceStream, []string{bob, carol})
	// create a channel stream and add the members
	_, mb = makeTestChannelStream(t, userWallet, alice, channelStreamId, spaceStreamId, nil)
	cStream, _ := tt.createStream(channelStreamId, mb)
	channelStream := cStream.(*streamImpl)
	joinChannel_T(t, userWallet, ctx, channelStream, []string{alice, bob, carol})
	// make a miniblock
	_ = tt.makeMiniblock(0, channelStreamId, false)
	// get the miniblock's last snapshot and convert it into bytes
	miniblocks := channelStream.view().MiniblocksFromLastSnapshot()
	miniblock := miniblocks[0]
	miniblockProtoBytes, _ := proto.Marshal(miniblock)
	// create a stream view from the miniblock bytes
	var streamView StreamView
	streamView, err = MakeStreamView(
		ctx,
		&storage.ReadStreamFromLastSnapshotResult{
			StartMiniblockNumber: 1,
			Miniblocks:           [][]byte{miniblockProtoBytes},
		},
	)
	require.NoError(t, err)

	/* Act */
	// create a channel view from the stream view
	channelView := streamView.(JoinableStreamView)
	allJoinedMembers, err := channelView.GetChannelMembers()

	/* Assert */
	require.NoError(t, err)
	require.Equal(t, allJoinedMembers.Cardinality(), 3)
	require.Equal(t, allJoinedMembers.Contains(alice), true)
	require.Equal(t, allJoinedMembers.Contains(bob), true)
	require.Equal(t, allJoinedMembers.Contains(carol), true)
}

func TestChannelViewState_RemainingMembers(t *testing.T) {
	ctx, tt := makeCacheTestContext(t, testParams{
		replFactor:                  1,
		defaultMinEventsPerSnapshot: 2,
	})
	_ = tt.initCache(0, nil)

	userWallet, _ := crypto.NewWallet(ctx)
	aliceWallet, _ := crypto.NewWallet(ctx)
	bobWallet, _ := crypto.NewWallet(ctx)
	carolWallet, _ := crypto.NewWallet(ctx)
	alice, err := AddressHex(aliceWallet.Address.Bytes())
	require.NoError(t, err)
	bob, err := AddressHex(bobWallet.Address.Bytes())
	require.NoError(t, err)
	carol, err := AddressHex(carolWallet.Address.Bytes())
	require.NoError(t, err)
	spaceStreamId := testutils.FakeStreamId(STREAM_SPACE_BIN)
	channelStreamId := testutils.FakeStreamId(STREAM_CHANNEL_BIN)

	// create a space stream and add the members
	_, mb := makeTestSpaceStream(t, userWallet, spaceStreamId, nil)
	sStream, _ := tt.createStream(spaceStreamId, mb)
	spaceStream := sStream.(*streamImpl)
	joinSpace_T(t, userWallet, ctx, spaceStream, []string{bob, carol})
	// create a channel stream and add the members
	_, mb = makeTestChannelStream(t, userWallet, alice, channelStreamId, spaceStreamId, nil)
	cStream, _ := tt.createStream(channelStreamId, mb)
	channelStream := cStream.(*streamImpl)
	joinChannel_T(t, userWallet, ctx, channelStream, []string{alice, bob, carol})
	// bob leaves the channel
	leaveChannel_T(t, userWallet, ctx, channelStream, []string{bob})
	// make a miniblock
	_ = tt.makeMiniblock(0, channelStreamId, false)
	// get the miniblock's last snapshot and convert it into bytes
	miniblocks := channelStream.view().MiniblocksFromLastSnapshot()
	miniblock := miniblocks[0]
	miniblockProtoBytes, _ := proto.Marshal(miniblock)
	// create a stream view from the miniblock bytes
	var streamView StreamView
	streamView, err = MakeStreamView(
		ctx,
		&storage.ReadStreamFromLastSnapshotResult{
			StartMiniblockNumber: 1,
			Miniblocks:           [][]byte{miniblockProtoBytes},
		},
	)
	require.NoError(t, err)

	/* Act */
	// create a channel view from the stream view
	channelView := streamView.(JoinableStreamView)
	allJoinedMembers, err := channelView.GetChannelMembers()

	/* Assert */
	require.NoError(t, err)
	require.Equal(t, 2, allJoinedMembers.Cardinality())
	require.Equal(t, true, allJoinedMembers.Contains(alice))
	require.Equal(t, false, allJoinedMembers.Contains(bob))
	require.Equal(t, true, allJoinedMembers.Contains(carol))
}

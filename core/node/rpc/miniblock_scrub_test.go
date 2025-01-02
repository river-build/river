package rpc

import (
	"context"
	"testing"

	"connectrpc.com/connect"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/proto"

	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	"github.com/river-build/river/core/node/scrub"
	"github.com/river-build/river/core/node/shared"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/storage"
	"github.com/river-build/river/core/node/testutils"
	// "github.com/river-build/river/core/node/testutils"
)

func addMessageToChannel(
	ctx context.Context,
	client protocolconnect.StreamServiceClient,
	wallet *crypto.Wallet,
	text string,
	channelId shared.StreamId,
	channelHash *MiniblockRef,
	require *require.Assertions,
) {
	message, err := events.MakeEnvelopeWithPayload(
		wallet,
		events.Make_ChannelPayload_Message(text),
		channelHash,
	)
	require.NoError(err)

	_, err = client.AddEvent(
		ctx,
		connect.NewRequest(
			&protocol.AddEventRequest{
				StreamId: channelId[:],
				Event:    message,
			},
		),
	)
	require.NoError(err)
}

func TestMiniblockScrubber(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})
	reports := make(chan *scrub.MiniblockScrubReport)
	client := tester.testClient(0)

	ctx := tester.ctx
	require := tester.require

	scrubber := scrub.NewMiniblockScrubber(
		tester.nodes[0].service.Storage(),
		1,
		reports,
	)
	defer close(reports)
	defer scrubber.Close()

	wallet, _ := crypto.NewWallet(ctx)

	resuser, _, err := createUser(ctx, wallet, client, nil)
	require.NoError(err)
	require.NotNil(resuser)
	userStreamId, err := StreamIdFromBytes(resuser.StreamId)
	require.NoError(err)

	// Miniblock scrub of user stream succeeds and report matches latest state of
	// the stream.
	scrubber.ScheduleStreamMiniblocksScrub(ctx, userStreamId, 0)
	report := <-reports
	require.Equal(userStreamId, report.StreamId)
	require.NoError(report.ScrubError)
	require.Equal(resuser.MinipoolGen-1, report.LatestBlockScrubbed)
	require.Equal(int64(-1), report.FirstCorruptBlock)

	_, _, err = createUserMetadataStream(ctx, wallet, client, nil)
	require.NoError(err)

	spaceId := testutils.FakeStreamId(STREAM_SPACE_BIN)
	space, _, err := createSpace(ctx, wallet, client, spaceId, nil)
	require.NoError(err)
	require.NotNil(space)

	channelId := testutils.FakeStreamId(STREAM_CHANNEL_BIN)
	channel, channelHash, err := createChannel(
		ctx,
		wallet,
		client,
		spaceId,
		channelId,
		&protocol.StreamSettings{DisableMiniblockCreation: true}, // manually control miniblock creation
	)
	require.NoError(err)
	require.NotNil(channel)
	b0ref, err := makeMiniblock(ctx, client, channelId, false, -1)
	require.NoError(err)
	require.Equal(int64(0), b0ref.Num)

	wallet2, _ := crypto.NewWallet(ctx)
	createUserAndAddToChannel(require, ctx, client, wallet2, spaceId, channelId)
	addMessageToChannel(ctx, client, wallet, "hi!", channelId, channelHash, require)
	addMessageToChannel(ctx, client, wallet2, "hello!", channelId, channelHash, require)
	addMessageToChannel(ctx, client, wallet, "hey how are you?", channelId, channelHash, require)
	addMessageToChannel(ctx, client, wallet2, "another message", channelId, channelHash, require)

	b1ref, err := makeMiniblock(ctx, client, channelId, true, 0)
	require.NoError(err)
	require.Equal(int64(1), b1ref.Num)

	addMessageToChannel(ctx, client, wallet, "hi!", channelId, channelHash, require)
	addMessageToChannel(ctx, client, wallet2, "hello!", channelId, channelHash, require)
	addMessageToChannel(ctx, client, wallet, "hey how are you?", channelId, channelHash, require)
	addMessageToChannel(ctx, client, wallet2, "another message", channelId, channelHash, require)

	b2ref, err := makeMiniblock(ctx, client, channelId, false, 0)
	require.NoError(err)
	require.Equal(int64(2), b2ref.Num)

	// Miniblock scrub of channel
	scrubber.ScheduleStreamMiniblocksScrub(ctx, channelId, 0)
	report = <-reports

	require.Equal(channelId, report.StreamId)
	require.NoError(report.ScrubError)
	require.Equal(int64(2), report.LatestBlockScrubbed)
	require.Equal(int64(-1), report.FirstCorruptBlock)

	// Starting at any miniblock number should produce the same report.
	scrubber.ScheduleStreamMiniblocksScrub(ctx, channelId, 1)
	report = <-reports

	require.Equal(channelId, report.StreamId)
	require.NoError(report.ScrubError)
	require.Equal(int64(2), report.LatestBlockScrubbed)
	require.Equal(int64(-1), report.FirstCorruptBlock)

	scrubber.ScheduleStreamMiniblocksScrub(ctx, channelId, 2)
	report = <-reports

	require.Equal(channelId, report.StreamId)
	require.NoError(report.ScrubError)
	require.Equal(int64(2), report.LatestBlockScrubbed)
	require.Equal(int64(-1), report.FirstCorruptBlock)

	scrubber.ScheduleStreamMiniblocksScrub(ctx, channelId, 2)
	report = <-reports

	require.Equal(channelId, report.StreamId)
	require.NoError(report.ScrubError)
	require.Equal(int64(2), report.LatestBlockScrubbed)
	require.Equal(int64(-1), report.FirstCorruptBlock)

	// Reading with a start block past the stream length produces an error
	require.ErrorContains(
		scrubber.ScheduleStreamMiniblocksScrub(ctx, channelId, 3),
		"Miniblock has not caught up to fromBlockNum",
	)

	store := tester.nodes[0].service.Storage()
	blocks, err := store.ReadMiniblocks(ctx, channelId, 0, 3)
	require.NoError(err)
	require.Len(blocks, 3)

	store.(*storage.PostgresStreamStore).DeleteStream(ctx, channelId)

	// Parse miniblocks in order to re-write them
	mb0, err := events.NewMiniblockInfoFromBytes(blocks[0], 0)
	require.NoError(err)
	require.NotNil(mb0)

	mb1, err := events.NewMiniblockInfoFromBytes(blocks[1], 1)
	require.NoError(err)
	require.NotNil(mb1)

	mb2, err := events.NewMiniblockInfoFromBytes(blocks[2], 2)
	require.NoError(err)
	require.NotNil(mb2)

	// Pop a couple of events from block 1 to invalidate the event hashes in the
	// header.
	var pb protocol.Miniblock
	err = proto.Unmarshal(blocks[1], &pb)
	require.NoError(err)
	pb.Events = pb.Events[0 : len(pb.Events)-2]
	blocks[1], err = proto.Marshal(&pb)
	require.NoError(err)

	// re-write the stream with corrupt block 1
	require.NoError(store.CreateStreamStorage(ctx, channelId, blocks[0]))
	require.NoError(
		store.WriteMiniblocks(
			ctx,
			channelId,
			[]*storage.WriteMiniblockData{
				{
					Number:   1,
					Hash:     mb1.Ref.Hash,
					Snapshot: mb1.IsSnapshot(),
					Data:     blocks[1],
				},
				{
					Number:   2,
					Hash:     mb2.Ref.Hash,
					Snapshot: mb2.IsSnapshot(),
					Data:     blocks[2],
				},
			},
			3,
			[][]byte{},
			1,
			0,
		),
	)

	// Parsing block two should cause an error because block 1 cannot be parsed.
	// However we will not consider the stream corrupt, because we are not considering
	// block 1.
	scrubber.ScheduleStreamMiniblocksScrub(ctx, channelId, 2)
	report = <-reports

	expectedErrString := "NewMiniblockInfoFromProto: (38:BAD_BLOCK) Length of events in block does not match length of event hashes in header"
	require.Equal(channelId, report.StreamId)
	require.ErrorContains(report.ScrubError, expectedErrString)
	require.Equal(int64(1), report.LatestBlockScrubbed)
	require.Equal(int64(-1), report.FirstCorruptBlock)

	// Before block 2 - we will evaluate block 1 as corrupt and report it as so.
	scrubber.ScheduleStreamMiniblocksScrub(ctx, channelId, 0)
	report = <-reports

	require.Equal(channelId, report.StreamId)
	require.ErrorContains(report.ScrubError, expectedErrString)
	require.Equal(int64(0), report.LatestBlockScrubbed)
	require.Equal(int64(1), report.FirstCorruptBlock)
}

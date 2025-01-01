package rpc

import (
	"context"
	"testing"

	"connectrpc.com/connect"
	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	"github.com/river-build/river/core/node/scrub"
	"github.com/river-build/river/core/node/shared"
	. "github.com/river-build/river/core/node/shared"
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
}

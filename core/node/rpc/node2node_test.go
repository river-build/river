package rpc

import (
	"fmt"
	"strings"
	"testing"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"

	"github.com/river-build/river/core/node/events"
	. "github.com/river-build/river/core/node/protocol"
	. "github.com/river-build/river/core/node/shared"
)

func TestSaveEphemeralMiniblock(t *testing.T) {
	tt := newServiceTester(t, serviceTesterOpts{numNodes: 1, start: true})

	alice := tt.newTestClient(0)
	_ = alice.createUserStream()
	spaceId, _ := alice.createSpace()
	channelId, _ := alice.createChannel(spaceId)

	mediaStreamId, err := StreamIdFromString(STREAM_MEDIA_PREFIX + strings.Repeat("0", 62))
	tt.require.NoError(err)

	const chunks = 10
	inception, err := events.MakeEnvelopeWithPayload(
		alice.wallet,
		events.Make_MediaPayload_Inception(&MediaPayload_Inception{
			StreamId:   mediaStreamId[:],
			ChannelId:  channelId[:],
			SpaceId:    spaceId[:],
			UserId:     alice.userId[:],
			ChunkCount: chunks,
		}),
		nil,
	)
	tt.require.NoError(err)

	// Create ephemeral media stream
	asResp, err := alice.client.CreateMediaStream(alice.ctx, connect.NewRequest(&CreateMediaStreamRequest{
		Events:   []*Envelope{inception},
		StreamId: mediaStreamId[:],
	}))
	tt.require.NoError(err)

	mb := &MiniblockRef{
		Hash: common.BytesToHash(asResp.Msg.Stream.NextCreationCookie.PrevMiniblockHash),
		Num:  0,
	}
	prevHash := mb.Hash[:]
	mediaChunks := make([][]byte, chunks)
	for i := 0; i < chunks; i++ {
		// Create media chunk event
		mediaChunks[i] = []byte("chunk " + fmt.Sprint(i))
		mp := events.Make_MediaPayload_Chunk(mediaChunks[i], int32(i))
		envelope, err := events.MakeEnvelopeWithPayload(alice.wallet, mp, mb)
		tt.require.NoError(err)

		header, err := events.MakeEnvelopeWithPayload(alice.wallet, events.Make_MiniblockHeader(&MiniblockHeader{
			MiniblockNum:             int64(i + 1),
			PrevMiniblockHash:        prevHash[:],
			Timestamp:                nil,
			EventHashes:              nil,
			Snapshot:                 nil,
			EventNumOffset:           0,
			PrevSnapshotMiniblockNum: 0,
			Content:                  nil,
		}), mb)
		tt.require.NoError(err)

		_, err = alice.node2nodeClient.SaveEphemeralMiniblock(alice.ctx, connect.NewRequest(&SaveEphemeralMiniblockRequest{
			StreamId: mediaStreamId[:],
			Miniblock: &Miniblock{
				Events: []*Envelope{envelope},
				Header: header,
			},
		}))
		tt.require.NoError(err)

		prevHash = header.Hash
	}

	// Get Miniblocks for the given stream
	resp, err := alice.client.GetMiniblocks(alice.ctx, connect.NewRequest(&GetMiniblocksRequest{
		StreamId:      mediaStreamId[:],
		FromInclusive: 0,
		ToExclusive:   chunks * 2,
	}))
	tt.require.NoError(err)
	tt.require.NotNil(resp)

	for _, mb := range resp.Msg.GetMiniblocks() {
		pe, err := events.ParseEvent(mb.GetEvents()[0])
		tt.require.NoError(err)
		fmt.Printf("Miniblock: %T\n", pe.Event.GetPayload())
	}
}

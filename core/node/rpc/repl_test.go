package rpc_test

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"os"
	"strconv"
	"testing"

	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/events"
	"github.com/river-build/river/core/node/nodes"
	"github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/protocol/protocolconnect"
	. "github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/node/testutils"
	"golang.org/x/net/http2"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/common"
	eth_crypto "github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/proto"
)

func TestReplCreate(t *testing.T) {
	tt := newServiceTester(t, serviceTesterOpts{numNodes: 5, replicationFactor: 5, start: true})
	ctx := tt.ctx
	require := tt.require

	client := tt.testClient(2)

	wallet, err := crypto.NewWallet(ctx)
	require.NoError(err)
	streamId, _, _, err := createUserSettingsStream(
		ctx,
		wallet,
		client,
		nil,
	)
	require.NoError(err)

	// Get the stream from each node.
	for i := 0; i < 5; i++ {
		node := tt.nodes[i]
		stream, err := node.GetStream(ctx, streamId)
		require.NoError(err)
		require.NotNil(stream)
	}
}
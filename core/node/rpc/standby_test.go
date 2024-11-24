package rpc

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/contracts/river"
	. "github.com/river-build/river/core/node/base"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/rpc/statusinfo"
)

func stanbyStartOpts() startOpts {
	return startOpts{
		configUpdater: func(config *config.Config) {
			config.StandByOnStart = true
		},
	}
}

func getNodeStatus(t *testing.T, ctx context.Context, url string) (*statusinfo.StatusResponse, error) {
	url = url + "/status"
	client := testHttpClient(t, ctx)
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, errors.New("status request failed")
	}
	var status statusinfo.StatusResponse
	err = json.NewDecoder(resp.Body).Decode(&status)
	if err != nil {
		return nil, err
	}
	return &status, nil
}

func requireStatus(t *testing.T, ctx context.Context, url string, expected string) {
	require.EventuallyWithT(
		t,
		func(tt *assert.CollectT) {
			st, err := getNodeStatus(t, ctx, url)
			assert.NoError(tt, err)
			assert.Equal(tt, expected, st.Status)
		},
		20*time.Second,
		10*time.Millisecond,
	)
}

func TestStandbySingle(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1})
	require := tester.require

	tester.initNodeRecords(0, 1, river.NodeStatus_Operational)
	tester.startNodes(0, 1, stanbyStartOpts())

	st, err := getNodeStatus(t, tester.ctx, tester.nodes[0].url)
	require.NoError(err)
	require.Equal("OK", st.Status)
}

func TestStandbyEvictionByNlbSwitch(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1})
	require := tester.require

	redirector := tester.nodes[0].listener
	tester.nodes[0].listener = nil
	var redirectAddr atomic.Pointer[string]

	firstListener, err := net.Listen("tcp", "localhost:0")
	require.NoError(err)
	t.Cleanup(func() { _ = firstListener.Close() })
	firstAddr := firstListener.Addr().String()
	firstUrl := "http://" + firstAddr
	redirectAddr.Store(&firstAddr)

	go redirect(t, redirector, &redirectAddr)

	opts := stanbyStartOpts()
	opts.listeners = []net.Listener{firstListener}
	tester.initNodeRecords(0, 1, river.NodeStatus_Operational)
	tester.startNodes(0, 1, opts)

	first := tester.nodes[0].service

	// Setup shutdown monitor
	exitStatus := make(chan error)
	go func() {
		firstExit := <-first.ExitSignal()
		first.Close()
		exitStatus <- firstExit
	}()

	secondListener, err := net.Listen("tcp", "localhost:0")
	require.NoError(err)
	t.Cleanup(func() { _ = secondListener.Close() })
	secondAddr := secondListener.Addr().String()
	secondUrl := "http://" + secondAddr

	// Start the second node with same address
	opts.listeners = []net.Listener{secondListener}
	go func() { require.NoError(tester.startSingle(0, opts)) }()

	// First node should be operational
	st1, err := getNodeStatus(t, tester.ctx, firstUrl)
	require.NoError(err)
	require.Equal("OK", st1.Status)

	// Also check through redirector URL
	st2, err := getNodeStatus(t, tester.ctx, tester.nodes[0].url)
	require.NoError(err)
	require.Equal("OK", st2.Status)
	require.Equal(st1.InstanceId, st2.InstanceId)

	requireStatus(t, tester.ctx, secondUrl, "STANDBY")

	// Emulate NLB switch
	time.Sleep(50 * time.Millisecond) // Give some time for second instance to poll
	redirectAddr.Store(&secondAddr)
	requireStatus(t, tester.ctx, secondUrl, "OK")

	// Get status again through redirector URL
	st3, err := getNodeStatus(t, tester.ctx, tester.nodes[0].url)
	require.NoError(err)
	require.Equal("OK", st3.Status)
	require.NotEqual(st1.InstanceId, st3.InstanceId)

	// First node should be evicted
	firstErr := <-exitStatus
	require.Error(firstErr)
	require.Equal(Err_RESOURCE_EXHAUSTED, AsRiverError(firstErr).Code)
}

func TestStandbyEvictionByUrlUpdate(t *testing.T) {
	tester := newServiceTester(t, serviceTesterOpts{numNodes: 1})
	require := tester.require

	firstListener := tester.nodes[0].listener
	firstAddr := firstListener.Addr().String()
	firstUrl := "http://" + firstAddr

	opts := stanbyStartOpts()
	opts.listeners = []net.Listener{firstListener}
	tester.initNodeRecords(0, 1, river.NodeStatus_Operational)
	tester.startNodes(0, 1, opts)

	first := tester.nodes[0].service

	// Setup shutdown monitor
	exitStatus := make(chan error)
	go func() {
		firstExit := <-first.ExitSignal()
		first.Close()
		exitStatus <- firstExit
	}()

	secondListener, err := net.Listen("tcp", "localhost:0")
	require.NoError(err)
	secondAddr := secondListener.Addr().String()
	secondUrl := "http://" + secondAddr

	// Start the second node with same address
	opts.listeners = []net.Listener{secondListener}
	go func() {
		require.NoError(tester.startSingle(0, opts))
	}()

	// First node should be operational
	st1, err := getNodeStatus(t, tester.ctx, firstUrl)
	require.NoError(err)
	require.Equal("OK", st1.Status)

	requireStatus(t, tester.ctx, secondUrl, "STANDBY")

	// While in practice this is not how this should happen (NLB should be used),
	// standby mode should work even if URL is updated.
	require.NoError(tester.btc.UpdateNodeUrl(tester.ctx, 0, secondUrl))
	requireStatus(t, tester.ctx, secondUrl, "OK")

	st3, err := getNodeStatus(t, tester.ctx, secondUrl)
	require.NoError(err)
	require.Equal("OK", st3.Status)
	require.NotEqual(st1.InstanceId, st3.InstanceId)

	// First node should be evicted
	firstErr := <-exitStatus
	require.Error(firstErr)
	require.Equal(Err_RESOURCE_EXHAUSTED, AsRiverError(firstErr).Code)
}

func redirect(t *testing.T, listener net.Listener, redirectAddress *atomic.Pointer[string]) {
	t.Cleanup(func() { _ = listener.Close() })

	for {
		conn, err := listener.Accept()
		if err != nil {
			if errors.Is(err, net.ErrClosed) {
				return
			}
			require.FailNow(t, "Failed to accept connection", "error", err)
			return
		}
		t.Cleanup(func() { _ = conn.Close() })

		addr := *redirectAddress.Load()
		go handleConnection(t, conn, addr)
	}
}

func handleConnection(t *testing.T, sourceConn net.Conn, targetAddr string) {
	targetConn, err := net.Dial("tcp", targetAddr)
	if err != nil {
		require.FailNow(t, "Failed to connect to target", "error", err)
		return
	}
	t.Cleanup(func() { _ = targetConn.Close() })

	// Copy sourceConn's data to targetConn
	go func() { _, _ = io.Copy(targetConn, sourceConn) }()
	// Copy targetConn's data back to sourceConn
	_, _ = io.Copy(sourceConn, targetConn)
}

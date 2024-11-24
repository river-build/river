package testutils

import (
	"context"
	"crypto/tls"
	"net"
	"net/http"
	"testing"

	"golang.org/x/net/http2"
)

func MakeTestHttpClientMaker(t *testing.T) func(context.Context) (*http.Client, error) {
	return func(context.Context) (*http.Client, error) {
		client := &http.Client{
			Transport: &http2.Transport{
				// So http2.Transport doesn't complain the URL scheme isn't 'https'
				AllowHTTP: true,
				// Pretend we are dialing a TLS endpoint. (Note, we ignore the passed tls.Config)
				DialTLSContext: func(ctx context.Context, network, addr string, cfg *tls.Config) (net.Conn, error) {
					var d net.Dialer
					return d.DialContext(ctx, network, addr)
				},
			},
		}
		t.Cleanup(func() {
			client.CloseIdleConnections()
		})
		return client, nil
	}
}

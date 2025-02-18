package bot_registry

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"strings"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/golang-jwt/jwt/v4"
	"github.com/towns-protocol/towns/core/node/bot_registry/bot_client"
	"github.com/towns-protocol/towns/core/node/crypto"
	"github.com/towns-protocol/towns/core/node/testutils/testcert"
	"github.com/towns-protocol/towns/core/node/utils"
)

type TestBotServer struct {
	t              *testing.T
	httpServer     *http.Server
	listener       net.Listener
	url            string
	botWallet      *crypto.Wallet
	hs256SecretKey []byte
}

// validateSignature verifies that the incoming request has a HS256-encoded jwt auth token stored
// in the header with the appropriate audience, signed by the expected secret key.
func validateSignature(req *http.Request, secretKey []byte, botId common.Address) error {
	authorization := req.Header.Get("Authorization")
	if authorization == "" {
		return fmt.Errorf("Unauthenticated")
	}

	const bearerPrefix = "Bearer "
	if !strings.HasPrefix(authorization, bearerPrefix) {
		return fmt.Errorf("invalid authorization header format")
	}

	tokenStr := strings.TrimPrefix(authorization, bearerPrefix)
	if tokenStr == "" {
		return fmt.Errorf("token missing from authorization header")
	}

	token, err := jwt.Parse(
		tokenStr,
		func(token *jwt.Token) (interface{}, error) {
			return secretKey, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}),
	)
	if err != nil {
		return fmt.Errorf("error parsing jwt token: %w", err)
	}

	if !token.Valid {
		return fmt.Errorf("invalid jwt token")
	}

	var mapClaims jwt.MapClaims
	var ok bool
	if mapClaims, ok = token.Claims.(jwt.MapClaims); !ok {
		return fmt.Errorf("jwt token is missing claims")
	}

	if !mapClaims.VerifyAudience(hex.EncodeToString(botId[:]), true) {
		return fmt.Errorf("invalid jwt token audience; should be bot public address")
	}

	return mapClaims.Valid()
}

func NewTestBotServer(t *testing.T, botWallet *crypto.Wallet, hs256SecretKey []byte) *TestBotServer {
	listener, url := testcert.MakeTestListener(t)

	b := &TestBotServer{
		t:              t,
		listener:       listener,
		url:            url,
		botWallet:      botWallet,
		hs256SecretKey: hs256SecretKey,
	}

	return b
}

func (b *TestBotServer) Url() string {
	return b.url
}

func (b *TestBotServer) Close() {
	if b.httpServer != nil {
		b.httpServer.Close()
	}
	if b.listener != nil {
		b.listener.Close()
	}
}

func (b *TestBotServer) rootHandler(w http.ResponseWriter, r *http.Request) {
	// Ensure that the request method is POST.
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := validateSignature(r, b.hs256SecretKey, b.botWallet.Address); err != nil {
		http.Error(w, "JWT Signature Invalid", http.StatusForbidden)
	}

	// Check that the Content-Type is application/json.
	if r.Header.Get("Content-Type") != "application/json" {
		http.Error(w, "Content-Type must be application/json", http.StatusUnsupportedMediaType)
		return
	}

	// Decode the JSON request body into the Payload struct.
	var payload bot_client.BotServiceRequestPayload
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close() // Ensure the body is closed once we're done.

	if err := decoder.Decode(&payload); err != nil {
		http.Error(w, fmt.Sprintf("Error decoding JSON: %v", err), http.StatusBadRequest)
		return
	}

	// For demonstration, print the received payload.
	// log := logging.DefaultZapLogger(zapcore.DebugLevel)
	// log.Infow("Received payload", "payload", payload)

	// Send a response back.
	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{"status": "ready"}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		b.t.Errorf("Error encoding bot service response: %v", err)
	}
}

func (b *TestBotServer) Serve(ctx context.Context) error {
	mux := http.NewServeMux()

	// Register the handler for the root path
	mux.HandleFunc("/", b.rootHandler)

	b.httpServer = &http.Server{
		Handler: mux,
		BaseContext: func(listener net.Listener) context.Context {
			return ctx
		},
		// Uncomment for http server logs
		ErrorLog: utils.NewHttpLogger(ctx),
	}

	if err := b.httpServer.Serve(b.listener); err != http.ErrServerClosed {
		return err
	}
	return nil
}

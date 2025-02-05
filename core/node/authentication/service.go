package authentication

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"math/big"
	"strings"
	"sync"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"github.com/golang-jwt/jwt/v4"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/river-build/river/core/config"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/logging"
	. "github.com/river-build/river/core/node/protocol"
)

const (
	challengeLength = 16
)

type (
	UserIDCtxKey            struct{}
	authenticationChallenge struct {
		challengePrefix string
		userID          common.Address
		expires         time.Time
	}
)

func (c authenticationChallenge) Verify(
	ctx context.Context,
	challenge [challengeLength]byte,
	signature []byte,
	delegateSig []byte,
	delegateExpiryEpochMs int64,
) error {
	// ensure that the auth challenge nor the delegateExpiryEpoch hasn't expired.
	now := time.Now()
	if now.After(c.expires) ||
		(len(delegateSig) > 0 && delegateExpiryEpochMs > 0 && now.After(time.Unix(delegateExpiryEpochMs/1000, 0))) {
		return RiverError(
			Err_UNAUTHENTICATED,
			"authentication expired",
			"expires",
			c.expires,
			"delegateExpiryEpochMs",
			delegateExpiryEpochMs,
		)
	}

	// ensure that the signature that was calculated with:
	// ecdsa_sign(client_key, ETH_SIGN(sha256(PREFIX || user_id || expiration || challenge)))
	// with ETH_SIGN prefix the sha256 digest with \x19Ethereum Signed Message:\n<length>
	// was created with the private key of c.userID
	var (
		buf     bytes.Buffer
		expires = big.NewInt(c.expires.Unix())
	)

	buf.WriteString(c.challengePrefix)
	buf.Write(c.userID.Bytes())
	buf.Write(expires.Bytes())
	buf.Write(challenge[:])
	hash := sha256.Sum256(buf.Bytes())

	signerPubKey, err := crypto.RecoverEthereumMessageSignerPublicKey(hash[:], signature)
	if err != nil {
		return RiverError(Err_UNAUTHENTICATED, "error recovering signer public key", "user", c.userID, "error", err)
	}

	signerAddress := crypto.PublicKeyToAddress(signerPubKey)

	if len(delegateSig) == 0 {
		if c.userID == signerAddress {
			return nil
		} else {
			return RiverError(Err_UNAUTHENTICATED, "user id mismatch", "user", c.userID, "signer", signerAddress)
		}
	}

	return crypto.CheckDelegateSig(c.userID[:], signerPubKey, delegateSig, delegateExpiryEpochMs)
}

type AuthServiceMixin struct {
	authConfig                    *config.AuthenticationConfig
	sessionTokenSigningKey        any
	sessionTokenSigningAlgo       string
	pendingAuthenticationRequests sync.Map
	challengePrefix               string
}

func (s *AuthServiceMixin) ShortServiceName() string {
	return strings.ToLower(s.challengePrefix[:2])
}

func (s *AuthServiceMixin) Init(challengePrefix string, config *config.AuthenticationConfig) error {
	if len(challengePrefix) < 2 || len(challengePrefix) > 32 {
		return RiverError(Err_INVALID_ARGUMENT, "Challenge prefix length is out of range", "prefix", challengePrefix)
	}

	s.authConfig = config

	// set defaults
	if s.authConfig.ChallengeTimeout <= 0 {
		s.authConfig.ChallengeTimeout = 30 * time.Second
	}
	if s.authConfig.SessionToken.Lifetime <= 0 {
		s.authConfig.SessionToken.Lifetime = 30 * time.Minute
	}

	if len(s.authConfig.SessionToken.Key.Key) != 64 {
		return RiverError(Err_BAD_CONFIG, "Invalid session token key length",
			"len", len(s.authConfig.SessionToken.Key.Key)).
			Func("NewService")
	}

	key, err := hex.DecodeString(s.authConfig.SessionToken.Key.Key)
	if err != nil {
		return RiverError(Err_BAD_CONFIG, "Invalid session token key (not hex)").Func("NewService")
	}

	if len(key) != 32 {
		return RiverError(Err_BAD_CONFIG, "Invalid session token key decoded length").Func("NewService")
	}

	s.sessionTokenSigningAlgo = s.authConfig.SessionToken.Key.Algorithm
	s.sessionTokenSigningKey = key
	s.challengePrefix = challengePrefix

	return nil
}

func (s *AuthServiceMixin) StartAuthentication(
	_ context.Context,
	req *connect.Request[StartAuthenticationRequest],
) (*connect.Response[StartAuthenticationResponse], error) {
	var (
		msg           = req.Msg
		authChallenge = &authenticationChallenge{
			challengePrefix: s.challengePrefix,
			userID:          common.BytesToAddress(msg.GetUserId()),
			expires:         time.Now().Add(s.authConfig.ChallengeTimeout),
		}
		challenge [challengeLength]byte
	)

	if authChallenge.userID == (common.Address{}) {
		return nil, RiverError(Err_INVALID_ARGUMENT, "invalid user id")
	}

	_, err := rand.Read(challenge[:])
	if err != nil {
		return nil, AsRiverError(err, Err_INTERNAL).
			Message("Unable to generate authentication challenge")
	}

	s.pendingAuthenticationRequests.Store(challenge, authChallenge)

	return connect.NewResponse(&StartAuthenticationResponse{
		UserId:     authChallenge.userID[:],
		Challenge:  challenge[:],
		Expiration: timestamppb.New(authChallenge.expires),
	}), nil
}

func (s *AuthServiceMixin) FinishAuthentication(
	ctx context.Context,
	req *connect.Request[FinishAuthenticationRequest],
) (*connect.Response[FinishAuthenticationResponse], error) {
	var (
		msg       = req.Msg
		userID    = common.BytesToAddress(msg.GetUserId())
		challenge [challengeLength]byte
	)

	if len(msg.GetChallenge()) != challengeLength {
		return nil, RiverError(Err_NOT_FOUND, "invalid challenge", "user", userID)
	}

	copy(challenge[:], msg.GetChallenge())

	raw, found := s.pendingAuthenticationRequests.Load(challenge)
	if !found {
		return nil, RiverError(Err_NOT_FOUND, "no pending authentication challenge", "user", userID)
	}

	// challenge is valid for one attempt, user must start a new authentication process for a second attempt
	s.pendingAuthenticationRequests.Delete(challenge)

	// make sure that the caller has access to the private key from which user id was derived
	chal := raw.(*authenticationChallenge)
	err := chal.Verify(ctx, challenge, msg.GetSignature(), msg.GetDelegateSig(), msg.GetDelegateExpiryEpochMs())
	if err != nil {
		return nil, RiverError(Err_PERMISSION_DENIED, "bad signature", "user", userID, "error", err)
	}

	// create a JWT session token that the client can use to make notification service rpc and send it to the client
	now := time.Now()
	shortServiceName := s.ShortServiceName()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"aud": shortServiceName,
		"iss": shortServiceName,
		"sub": userID.String(),
		"exp": now.Add(s.authConfig.SessionToken.Lifetime).Unix(),
	})

	sessionToken, err := token.SignedString(s.sessionTokenSigningKey)
	if err != nil {
		logging.FromCtx(ctx).Errorw("Unable to sign session token", "err", err)
		return nil, AsRiverError(err, Err_INTERNAL).Tag("user", userID)
	}

	return connect.NewResponse(&FinishAuthenticationResponse{SessionToken: sessionToken}), nil
}

type jwtAuthenticationInterceptor struct {
	shortServiceName           string
	sessionTokenSigningKeyAlgo string
	sessionTokenSigningKey     interface{}
	publicRoutes               []string
}

func NewAuthenticationInterceptor(
	shortServiceName string,
	sessionTokenSigningKeyAlgo string,
	sessionTokenSigningKey string,
	publicRoutes ...string,
) (connect.Interceptor, error) {
	if len(shortServiceName) < 2 {
		return nil, RiverError(
			Err_INVALID_ARGUMENT,
			"ShortServiceName must be at least 2 characters long",
		).Func("NewAuthenticationInterceptor")
	}
	key, err := hex.DecodeString(sessionTokenSigningKey)
	if err != nil {
		return nil, RiverError(Err_BAD_CONFIG, "Invalid session token key").Func("NewAuthenticationInterceptor")
	}

	if len(key) != 32 {
		return nil, RiverError(Err_BAD_CONFIG, "Invalid session token key length").Func("NewAuthenticationInterceptor")
	}

	return &jwtAuthenticationInterceptor{
		shortServiceName:           shortServiceName,
		sessionTokenSigningKeyAlgo: sessionTokenSigningKeyAlgo,
		sessionTokenSigningKey:     key,
		publicRoutes:               publicRoutes,
	}, nil
}

func (i *jwtAuthenticationInterceptor) authorize(sessionTokenString string) (common.Address, error) {
	token, err := jwt.Parse(sessionTokenString, func(token *jwt.Token) (interface{}, error) {
		return i.sessionTokenSigningKey, nil
	}, jwt.WithJSONNumber(), jwt.WithValidMethods([]string{"HS256"}))
	if err != nil {
		return common.Address{}, RiverError(Err_UNAUTHENTICATED, "Invalid session token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return common.Address{}, RiverError(Err_UNAUTHENTICATED, "Invalid session token")
	}

	if claims["aud"] != i.shortServiceName {
		return common.Address{}, RiverError(Err_UNAUTHENTICATED, "Invalid session token audience")
	}

	if claims["iss"] != i.shortServiceName {
		return common.Address{}, RiverError(Err_UNAUTHENTICATED, "Invalid session token issuer")
	}

	expiredNumber, ok := claims["exp"].(json.Number)
	if !ok {
		return common.Address{}, RiverError(Err_UNAUTHENTICATED, "Invalid session token exp")
	}

	expired, err := expiredNumber.Int64()
	if err != nil {
		return common.Address{}, RiverError(Err_UNAUTHENTICATED, "Invalid session token exp")
	}

	if time.Now().After(time.Unix(expired, 0)) {
		return common.Address{}, RiverError(Err_UNAUTHENTICATED, "Session token expired")
	}

	subStr, ok := claims["sub"].(string)
	if !ok {
		return common.Address{}, RiverError(Err_UNAUTHENTICATED, "Invalid session token subject")
	}

	return common.HexToAddress(subStr), nil
}

func (i *jwtAuthenticationInterceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(
		ctx context.Context,
		req connect.AnyRequest,
	) (connect.AnyResponse, error) {
		// calls to the authentication service are unauthenticated
		if strings.HasPrefix(req.Spec().Procedure, "/river.AuthenticationService/") {
			return next(ctx, req)
		}

		// Allow public routes to pass through the interceptor
		for _, route := range i.publicRoutes {
			if strings.HasPrefix(req.Spec().Procedure, route) {
				return next(ctx, req)
			}
		}

		authHeader := req.Header().Get("Authorization")
		if authHeader == "" {
			return nil, RiverError(Err_UNAUTHENTICATED, "missing session token")
		}

		userID, err := i.authorize(authHeader)
		if err != nil {
			return nil, err
		}

		logging.FromCtx(ctx).Infow("userId", "userId", userID)

		return next(context.WithValue(ctx, UserIDCtxKey{}, userID), req)
	}
}

func (i *jwtAuthenticationInterceptor) WrapStreamingClient(
	next connect.StreamingClientFunc,
) connect.StreamingClientFunc {
	return func(
		ctx context.Context,
		spec connect.Spec,
	) connect.StreamingClientConn {
		return next(ctx, spec)
	}
}

func (i *jwtAuthenticationInterceptor) WrapStreamingHandler(
	next connect.StreamingHandlerFunc,
) connect.StreamingHandlerFunc {
	return func(
		ctx context.Context,
		conn connect.StreamingHandlerConn,
	) error {
		sessionToken := conn.RequestHeader().Get("Authorization")
		userID, err := i.authorize(sessionToken)
		if err != nil {
			return err
		}

		return next(context.WithValue(ctx, UserIDCtxKey{}, userID), conn)
	}
}

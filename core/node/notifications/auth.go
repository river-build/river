package notifications

import (
	"bytes"
	"context"
	"crypto/sha256"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/crypto"
	. "github.com/river-build/river/core/node/protocol"
)

const (
	challengePrefix = "NS_AUTH:"
	challengeLength = 16
)

type (
	UserIDCtxKey            struct{}
	authenticationChallenge struct {
		userID  common.Address
		expires time.Time
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

	buf.WriteString(challengePrefix)
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

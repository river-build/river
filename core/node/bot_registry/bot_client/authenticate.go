package bot_client

import (
	"encoding/hex"
	"net/http"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/golang-jwt/jwt"
	"github.com/google/uuid"
	"github.com/towns-protocol/towns/core/node/base"
	"github.com/towns-protocol/towns/core/node/protocol"
)

func signRequest(req *http.Request, secretKey []byte, botId common.Address) error {
	// Create a new token object, specifying signing method and claims.
	// You can customize these claims as needed.
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["exp"] = time.Now().Add(1 * time.Hour).Unix() // token expires in 1 hour
	claims["iat"] = time.Now().Unix()                    // issued at
	claims["aud"] = hex.EncodeToString(botId[:])
	// A bot server may optionally use the jti to prevent replay attacks
	claims["jti"] = uuid.NewString()

	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return base.RiverError(protocol.Err_INTERNAL, "Unable to sign jwt token for bot request").
			Tag("botId", botId)
	}

	// Attach the token to the Authorization header.
	req.Header.Set("Authorization", "Bearer "+tokenString)

	return nil
}

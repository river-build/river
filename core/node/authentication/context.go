package authentication

import (
	"context"

	"github.com/ethereum/go-ethereum/common"
)

type userIDCtxKey struct{}

func contextWithAuthenticatedUser(ctx context.Context, userId common.Address) context.Context {
	return context.WithValue(ctx, userIDCtxKey{}, userId)
}

func UserFromAuthenticatedContext(ctx context.Context) common.Address {
	val := ctx.Value(userIDCtxKey{})
	// If the user id is unset, return the zero address.
	if val == nil {
		return common.Address{}
	}

	return val.(common.Address)
}

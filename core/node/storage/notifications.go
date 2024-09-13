package storage

import (
	"context"
	"encoding/json"

	"github.com/ethereum/go-ethereum/common"
)

type NotificationsStorage interface {
	SetSettings(ctx context.Context, userID common.Address, settings json.RawMessage) error
	GetSettings(ctx context.Context, userID common.Address) (json.RawMessage, error)
}

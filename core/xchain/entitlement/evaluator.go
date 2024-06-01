package entitlement

import (
	"context"

	"github.com/river-build/river/core/node/config"
)

type Evaluator struct {
	clients         BlockchainClientPool
	contractVersion config.ContractVersion
}

func NewEvaluatorFromConfig(ctx context.Context, cfg *config.Config) (*Evaluator, error) {
	clients, err := NewBlockchainClientPool(ctx, cfg)
	if err != nil {
		return nil, err
	}
	return &Evaluator{
		clients:         clients,
		contractVersion: cfg.GetContractVersion(),
	}, nil
}

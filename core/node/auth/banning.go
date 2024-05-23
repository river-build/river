package auth

import (
	"context"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/node/contracts/base"
)

type Banning interface {
	IsBanned(ctx context.Context, wallets []common.Address) (bool, error)
}

type banning struct {
	contract *base.Banning
	address  common.Address
}

func (b *banning) IsBanned(ctx context.Context, wallets []common.Address) (bool, error) {
	// TODO: Implement this
	return false, nil
}

func NewBanning(
	ctx context.Context,
	version string,
	address common.Address,
	backend bind.ContractBackend,
) (Banning, error) {
	contract, err := base.NewBanning(address, backend)
	if err != nil {
		return nil, err
	}

	return &banning{
		contract: contract,
		address:  address,
	}, nil
}

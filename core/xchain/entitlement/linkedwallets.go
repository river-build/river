package entitlement

import (
	"context"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/river-build/river/core/node/dlog"
	shared_infra "github.com/river-build/river/core/node/infra"
	"github.com/river-build/river/core/xchain/contracts"
)

type WrappedWalletLink interface {
	GetRootKeyForWallet(ctx context.Context, wallet common.Address) (common.Address, error)
	GetWalletsByRootKey(ctx context.Context, rootKey common.Address) ([]common.Address, error)
}

type wrappedWalletLink struct {
	contract *contracts.IWalletLink
}

func (w *wrappedWalletLink) GetRootKeyForWallet(ctx context.Context, wallet common.Address) (common.Address, error) {
	return w.contract.GetRootKeyForWallet(&bind.CallOpts{Context: ctx}, wallet)
}

func (w *wrappedWalletLink) GetWalletsByRootKey(ctx context.Context, rootKey common.Address) ([]common.Address, error) {
	return w.contract.GetWalletsByRootKey(&bind.CallOpts{Context: ctx}, rootKey)
}

func NewWrappedWalletLink(contract *contracts.IWalletLink) WrappedWalletLink {
	return &wrappedWalletLink{
		contract: contract,
	}
}

func GetLinkedWallets(
	ctx context.Context,
	wallet common.Address,
	walletLink WrappedWalletLink,
) ([]common.Address, error) {
	log := dlog.FromCtx(ctx)

	start := time.Now()
	rootKey, err := walletLink.GetRootKeyForWallet(ctx, wallet)
	shared_infra.StoreExecutionTimeMetrics("GetRootKeyForWallet", shared_infra.CONTRACT_CALLS_CATEGORY, start)
	if err != nil {
		log.Error("Failed to GetRootKeyForWallet", "err", err, "wallet", wallet.Hex())
		//xchain_infra.GetRootKeyForWalletCalls.FailInc()
		return nil, err
	}
	//xchain_infra.GetRootKeyForWalletCalls.PassInc()

	var zero common.Address
	if rootKey == zero {
		log.Debug("Wallet not linked to any root key, trying as root key", "wallet", wallet.Hex())
		rootKey = wallet
	}

	start = time.Now()
	wallets, err := walletLink.GetWalletsByRootKey(ctx, rootKey)
	shared_infra.StoreExecutionTimeMetrics("GetWalletsByRootKey", shared_infra.CONTRACT_CALLS_CATEGORY, start)
	if err != nil {
		//xchain_infra.GetWalletsByRootKeyCalls.FailInc()
		return nil, err
	}
	//xchain_infra.GetWalletsByRootKeyCalls.PassInc()

	if len(wallets) == 0 {
		log.Debug("No linked wallets found", "rootKey", rootKey.Hex())
		return []common.Address{wallet}, nil
	}

	// Make sure the root wallet is included in the returned list of linked wallets. This will not
	// be the case when the wallet passed to the check is the root wallet.
	containsRootWallet := false
	for _, w := range wallets {
		if w == rootKey {
			containsRootWallet = true
			break
		}
	}
	if !containsRootWallet {
		wallets = append(wallets, rootKey)
	}

	log.Debug("Linked wallets", "rootKey", rootKey.Hex(), "wallets", wallets)

	return wallets, nil
}

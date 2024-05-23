package auth

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/config"
	"github.com/river-build/river/core/node/crypto"
	"github.com/river-build/river/core/node/dlog"
	"github.com/river-build/river/core/node/infra"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/xchain/entitlement"

	"github.com/ethereum/go-ethereum/common"
)

type ChainAuth interface {
	IsEntitled(ctx context.Context, cfg *config.Config, args *ChainAuthArgs) error
}

var everyone = common.HexToAddress("0x1") // This represents an Ethereum address of "0x1"

func NewChainAuthArgsForSpace(spaceId shared.StreamId, userId string, permission Permission) *ChainAuthArgs {
	return &ChainAuthArgs{
		kind:       chainAuthKindSpace,
		spaceId:    spaceId,
		principal:  common.HexToAddress(userId),
		permission: permission,
	}
}

func NewChainAuthArgsForChannel(
	spaceId shared.StreamId,
	channelId shared.StreamId,
	userId string,
	permission Permission,
) *ChainAuthArgs {
	return &ChainAuthArgs{
		kind:       chainAuthKindChannel,
		spaceId:    spaceId,
		channelId:  channelId,
		principal:  common.HexToAddress(userId),
		permission: permission,
	}
}

func NewChainAuthArgsForIsSpaceMember(spaceId shared.StreamId, userId string) *ChainAuthArgs {
	return &ChainAuthArgs{
		kind:      chainAuthKindIsSpaceMember,
		spaceId:   spaceId,
		principal: common.HexToAddress(userId),
	}
}

type chainAuthKind int

const (
	chainAuthKindSpace chainAuthKind = iota
	chainAuthKindChannel
	chainAuthKindSpaceEnabled
	chainAuthKindChannelEnabled
	chainAuthKindIsSpaceMember
)

type ChainAuthArgs struct {
	kind          chainAuthKind
	spaceId       shared.StreamId
	channelId     shared.StreamId
	principal     common.Address
	permission    Permission
	linkedWallets string // a serialized list of linked wallets to comply with the cache key constraints
}

func (args *ChainAuthArgs) withLinkedWallets(linkedWallets []common.Address) *ChainAuthArgs {
	ret := *args
	var builder strings.Builder
	for i, addr := range linkedWallets {
		if i > 0 {
			builder.WriteString(",")
		}
		builder.WriteString(addr.Hex())
	}
	ret.linkedWallets = builder.String()
	return &ret
}

func newArgsForEnabledSpace(spaceId shared.StreamId) *ChainAuthArgs {
	return &ChainAuthArgs{
		kind:    chainAuthKindSpaceEnabled,
		spaceId: spaceId,
	}
}

func newArgsForEnabledChannel(spaceId shared.StreamId, channelId shared.StreamId) *ChainAuthArgs {
	return &ChainAuthArgs{
		kind:      chainAuthKindChannelEnabled,
		spaceId:   spaceId,
		channelId: channelId,
	}
}

const (
	DEFAULT_REQUEST_TIMEOUT_MS = 5000
	DEFAULT_MAX_WALLETS        = 10
)

var (
	isEntitledToChannelCacheHit  = infra.NewSuccessMetrics("is_entitled_to_channel_cache_hit", contractCalls)
	isEntitledToChannelCacheMiss = infra.NewSuccessMetrics("is_entitled_to_channel_cache_miss", contractCalls)
	isEntitledToSpaceCacheHit    = infra.NewSuccessMetrics("is_entitled_to_space_cache_hit", contractCalls)
	isEntitledToSpaceCacheMiss   = infra.NewSuccessMetrics("is_entitled_to_space_cache_miss", contractCalls)
	isSpaceEnabledCacheHit       = infra.NewSuccessMetrics("is_space_enabled_cache_hit", contractCalls)
	isSpaceEnabledCacheMiss      = infra.NewSuccessMetrics("is_space_enabled_cache_miss", contractCalls)
	isChannelEnabledCacheHit     = infra.NewSuccessMetrics("is_channel_enabled_cache_hit", contractCalls)
	isChannelEnabledCacheMiss    = infra.NewSuccessMetrics("is_channel_enabled_cache_miss", contractCalls)
	entitlementCacheHit          = infra.NewSuccessMetrics("entitlement_cache_hit", contractCalls)
	entitlementCacheMiss         = infra.NewSuccessMetrics("entitlement_cache_miss", contractCalls)
)

type chainAuth struct {
	blockchain              *crypto.Blockchain
	spaceContract           SpaceContract
	walletLinkContract      WalletLinkContract
	linkedWalletsLimit      int
	contractCallsTimeoutMs  int
	entitlementCache        *entitlementCache
	entitlementManagerCache *entitlementCache
}

var _ ChainAuth = (*chainAuth)(nil)

func NewChainAuth(
	ctx context.Context,
	blockchain *crypto.Blockchain,
	architectCfg *config.ContractConfig,
	linkedWalletsLimit int,
	contractCallsTimeoutMs int,
) (*chainAuth, error) {
	// instantiate contract facets from diamond configuration
	spaceContract, err := NewSpaceContractV3(ctx, architectCfg, blockchain.Client)
	if err != nil {
		return nil, err
	}

	walletLinkContract, err := NewWalletLink(ctx, architectCfg, blockchain.Client)
	if err != nil {
		return nil, err
	}

	entitlementCache, err := newEntitlementCache(ctx, blockchain.Config)
	if err != nil {
		return nil, err
	}

	// seperate cache for entitlement manager as the timeouts are shorter
	entitlementManagerCache, err := newEntitlementManagerCache(ctx, blockchain.Config)
	if err != nil {
		return nil, err
	}

	if linkedWalletsLimit <= 0 {
		linkedWalletsLimit = DEFAULT_MAX_WALLETS
	}
	if contractCallsTimeoutMs <= 0 {
		contractCallsTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
	}

	return &chainAuth{
		blockchain:              blockchain,
		spaceContract:           spaceContract,
		walletLinkContract:      walletLinkContract,
		linkedWalletsLimit:      linkedWalletsLimit,
		contractCallsTimeoutMs:  contractCallsTimeoutMs,
		entitlementCache:        entitlementCache,
		entitlementManagerCache: entitlementManagerCache,
	}, nil
}

func (ca *chainAuth) IsEntitled(ctx context.Context, cfg *config.Config, args *ChainAuthArgs) error {
	// TODO: counter for cache hits here?
	result, _, err := ca.entitlementCache.executeUsingCache(
		ctx,
		cfg,
		args,
		ca.checkEntitlement,
	)
	if err != nil {
		return AsRiverError(err).Func("IsEntitled")
	}
	if !result.IsAllowed() {
		return RiverError(
			Err_PERMISSION_DENIED,
			"IsEntitled failed",
			"spaceId",
			args.spaceId,
			"channelId",
			args.channelId,
			"userId",
			args.principal,
			"permission",
			args.permission.String(),
		).Func("IsAllowed")
	}
	return nil
}

func (ca *chainAuth) areLinkedWalletsEntitled(
	ctx context.Context,
	cfg *config.Config,
	args *ChainAuthArgs,
) (bool, error) {
	log := dlog.FromCtx(ctx)
	if args.kind == chainAuthKindSpace {
		log.Debug("isWalletEntitled", "kind", "space", "args", args)
		return ca.isEntitledToSpace(ctx, cfg, args)
	} else if args.kind == chainAuthKindChannel {
		log.Debug("isWalletEntitled", "kind", "channel", "args", args)
		return ca.isEntitledToChannel(ctx, cfg, args)
	} else if args.kind == chainAuthKindIsSpaceMember {
		log.Debug("isWalletEntitled", "kind", "isSpaceMember", "args", args)
		return true, nil // is space member is checked by the calling code in checkEntitlement
	} else {
		return false, RiverError(Err_INTERNAL, "Unknown chain auth kind").Func("isWalletEntitled")
	}
}

func (ca *chainAuth) isSpaceEnabledUncached(
	ctx context.Context,
	cfg *config.Config,
	args *ChainAuthArgs,
) (CacheResult, error) {
	// This is awkward as we want enabled to be cached for 15 minutes, but the API returns the inverse
	isDisabled, err := ca.spaceContract.IsSpaceDisabled(ctx, args.spaceId)
	return &boolCacheResult{allowed: !isDisabled}, err
}

func (ca *chainAuth) checkSpaceEnabled(ctx context.Context, cfg *config.Config, spaceId shared.StreamId) error {
	isEnabled, cacheHit, err := ca.entitlementCache.executeUsingCache(
		ctx,
		cfg,
		newArgsForEnabledSpace(spaceId),
		ca.isSpaceEnabledUncached,
	)
	if err != nil {
		return err
	}
	if cacheHit {
		isSpaceEnabledCacheHit.PassInc()
	} else {
		isSpaceEnabledCacheMiss.PassInc()
	}

	if isEnabled.IsAllowed() {
		return nil
	} else {
		return RiverError(Err_SPACE_DISABLED, "Space is disabled", "spaceId", spaceId).Func("isEntitledToSpace")
	}
}

func (ca *chainAuth) isChannelEnabledUncached(
	ctx context.Context,
	cfg *config.Config,
	args *ChainAuthArgs,
) (CacheResult, error) {
	// This is awkward as we want enabled to be cached for 15 minutes, but the API returns the inverse
	isDisabled, err := ca.spaceContract.IsChannelDisabled(ctx, args.spaceId, args.channelId)
	return &boolCacheResult{allowed: !isDisabled}, err
}

func (ca *chainAuth) checkChannelEnabled(
	ctx context.Context,
	cfg *config.Config,
	spaceId shared.StreamId,
	channelId shared.StreamId,
) error {
	isEnabled, cacheHit, err := ca.entitlementCache.executeUsingCache(
		ctx,
		cfg,
		newArgsForEnabledChannel(spaceId, channelId),
		ca.isChannelEnabledUncached,
	)
	if err != nil {
		return err
	}
	if cacheHit {
		isChannelEnabledCacheHit.PassInc()
	} else {
		isChannelEnabledCacheMiss.PassInc()
	}

	if isEnabled.IsAllowed() {
		return nil
	} else {
		return RiverError(Err_CHANNEL_DISABLED, "Channel is disabled", "spaceId", spaceId, "channelId", channelId).Func("checkChannelEnabled")
	}
}

// CacheResult is the result of a cache lookup.
// allowed means that this value should be cached
// not that the caller is allowed to access the permission
type entitlementCacheResult struct {
	allowed         bool
	entitlementData []Entitlement
	owner           common.Address
}

func (scr *entitlementCacheResult) IsAllowed() bool {
	return scr.allowed
}

// If entitlements are found for the permissions, they are returned and the allowed flag is set true so the results may be cached.
// If the call fails or the space is not found, the allowed flag is set to false so the negative caching time applies.
func (ca *chainAuth) getSpaceEntitlementsForPermissionUncached(
	ctx context.Context,
	cfg *config.Config,
	args *ChainAuthArgs,
) (CacheResult, error) {
	log := dlog.FromCtx(ctx)
	entitlementData, owner, err := ca.spaceContract.GetSpaceEntitlementsForPermission(
		ctx,
		args.spaceId,
		args.permission,
	)

	log.Debug("getSpaceEntitlementsForPermissionUncached", "args", args, "entitlementData", entitlementData)
	if err != nil {
		return &entitlementCacheResult{
				allowed: false,
			}, AsRiverError(
				err,
			).Func("getSpaceEntitlementsForPermision").
				Message("Failed to get space entitlements")
	}
	return &entitlementCacheResult{allowed: true, entitlementData: entitlementData, owner: owner}, nil
}

// If entitlements are found for the permissions, they are returned and the allowed flag is set true so the results may be cached.
// If the call fails or the space is not found, the allowed flag is set to false so the negative caching time applies.
func (ca *chainAuth) getChannelEntitlementsForPermissionUncached(
	ctx context.Context,
	cfg *config.Config,
	args *ChainAuthArgs,
) (CacheResult, error) {
	log := dlog.FromCtx(ctx)
	entitlementData, owner, err := ca.spaceContract.GetChannelEntitlementsForPermission(
		ctx,
		args.spaceId,
		args.channelId,
		args.permission,
	)

	log.Debug("getChannelEntitlementsForPermissionUncached", "args", args, "entitlementData", entitlementData)
	if err != nil {
		return &entitlementCacheResult{
				allowed: false,
			}, AsRiverError(
				err,
			).Func("getChannelEntitlementsForPermission").
				Message("Failed to get channel entitlements")
	}
	return &entitlementCacheResult{allowed: true, entitlementData: entitlementData, owner: owner}, nil
}

func (ca *chainAuth) isEntitledToChannelUncached(ctx context.Context, cfg *config.Config, args *ChainAuthArgs) (CacheResult, error) {
	log := dlog.FromCtx(ctx)
	log.Debug("isEntitledToChannelUncached", "args", args)

	// For read and write permissions, fetch the entitlements and evaluate them locally.
	if (args.permission == PermissionRead) || (args.permission == PermissionWrite) {
		result, cacheHit, err := ca.entitlementManagerCache.executeUsingCache(
			ctx,
			cfg,
			args,
			ca.getChannelEntitlementsForPermissionUncached,
		)
		if err != nil {
			return &boolCacheResult{
					allowed: false,
				}, AsRiverError(
					err,
				).Func("isEntitledToChannel").
					Message("Failed to get channel entitlements")
		}

		if cacheHit {
			entitlementCacheHit.PassInc()
		} else {
			entitlementCacheMiss.PassInc()
		}

		temp := (result.(*timestampedCacheValue).Result())

		wallets := deserializeWallets(args.linkedWallets)
		for _, wallet := range wallets {
			// Space owner has su over all channel operations.
			if wallet == temp.(*entitlementCacheResult).owner {
				log.Debug("owner is entitled to channel", "spaceId", args.spaceId, "channelId", args.channelId, "userId", args.principal)
				return &boolCacheResult{allowed: true}, nil
			}
		}

		entitlementData := temp.(*entitlementCacheResult) // Assuming result is of *entitlementCacheResult type
		allowed, err := ca.evaluateEntitlementData(ctx, entitlementData.entitlementData, cfg, args)
		if err != nil {
			return &boolCacheResult{allowed: false}, AsRiverError(err).Func("isEntitledToChannel")
		}
		return &boolCacheResult{allowed}, nil

		// TODO: check user bans
	}

	// For other permissions, defer the entitlement check to the space contract.
	allowed, err := ca.spaceContract.IsEntitledToChannel(
		ctx,
		args.spaceId,
		args.channelId,
		args.principal,
		args.permission,
	)
	return &boolCacheResult{allowed: allowed}, err
}

func deserializeWallets(serialized string) []common.Address {
	addressStrings := strings.Split(serialized, ",")
	linkedWallets := make([]common.Address, len(addressStrings))
	for i, addrStr := range addressStrings {
		linkedWallets[i] = common.HexToAddress(addrStr)
	}
	return linkedWallets
}

func (ca *chainAuth) evaluateEntitlementData(ctx context.Context, entitlements []Entitlement, cfg *config.Config, args *ChainAuthArgs) (bool, error) {
	log := dlog.FromCtx(ctx).With("function", "evaluateEntitlementData")
	log.Debug("evaluateEntitlementData", "args", args)
	for _, ent := range entitlements {
		log.Debug("entitlement", "entitlement", ent)
		if ent.entitlementType == "RuleEntitlement" {
			re := ent.ruleEntitlement
			log.Debug("RuleEntitlement", "ruleEntitlement", re)
			result, err := entitlement.EvaluateRuleData(ctx, cfg, deserializeWallets(args.linkedWallets), re)

			if err != nil {
				return false, err
			}
			if result {
				log.Debug("rule entitlement is true", "spaceId", args.spaceId)
				return true, nil
			} else {
				log.Debug("rule entitlement is false", "spaceId", args.spaceId)
			}
		} else if ent.entitlementType == "UserEntitlement" {
			for _, user := range ent.userEntitlement {
				if user == everyone {
					log.Debug("everyone is entitled to space", "spaceId", args.spaceId)
					return true, nil
				} else if user == args.principal {
					log.Debug("user is entitled to space", "spaceId", args.spaceId, "userId", args.principal)
					return true, nil
				}
			}
		} else {
			log.Warn("Invalid entitlement type", "entitlement", ent)
		}
	}
	return false, nil
}

func (ca *chainAuth) isEntitledToSpaceUncached(
	ctx context.Context,
	cfg *config.Config,
	args *ChainAuthArgs,
) (CacheResult, error) {
	log := dlog.FromCtx(ctx)
	log.Debug("isEntitledToSpaceUncached", "args", args)
	result, cacheHit, err := ca.entitlementManagerCache.executeUsingCache(
		ctx,
		cfg,
		args,
		ca.getSpaceEntitlementsForPermissionUncached,
	)
	if err != nil {
		return &boolCacheResult{
				allowed: false,
			}, AsRiverError(
				err,
			).Func("isEntitledToSpace").
				Message("Failed to get space entitlements")
	}

	if cacheHit {
		entitlementCacheHit.PassInc()
	} else {
		entitlementCacheMiss.PassInc()
	}

	temp := (result.(*timestampedCacheValue).Result())

	wallets := deserializeWallets(args.linkedWallets)

	for _, wallet := range wallets {
		if wallet == temp.(*entitlementCacheResult).owner {
			log.Debug(
				"owner is entitled to space",
				"spaceId",
				args.spaceId,
				"userId",
				wallet,
				"principal",
				args.principal,
			)
			return &boolCacheResult{allowed: true}, nil
		}
	}

	entitlementData := temp.(*entitlementCacheResult) // Assuming result is of *entitlementCacheResult type
	allowed, err := ca.evaluateEntitlementData(ctx, entitlementData.entitlementData, cfg, args)
	if err != nil {
		return &boolCacheResult{allowed: false}, AsRiverError(err).Func("isEntitledToSpace")
	} else {
		return &boolCacheResult{allowed}, nil
	}
}

func (ca *chainAuth) isEntitledToSpace(ctx context.Context, cfg *config.Config, args *ChainAuthArgs) (bool, error) {
	if args.kind != chainAuthKindSpace {
		return false, RiverError(Err_INTERNAL, "Wrong chain auth kind")
	}

	isEntitled, cacheHit, err := ca.entitlementCache.executeUsingCache(ctx, cfg, args, ca.isEntitledToSpaceUncached)
	if err != nil {
		return false, err
	}
	if cacheHit {
		isEntitledToSpaceCacheHit.PassInc()
	} else {
		isEntitledToSpaceCacheMiss.PassInc()
	}

	return isEntitled.IsAllowed(), nil
}

func (ca *chainAuth) isEntitledToChannel(ctx context.Context, cfg *config.Config, args *ChainAuthArgs) (bool, error) {
	if args.kind != chainAuthKindChannel {
		return false, RiverError(Err_INTERNAL, "Wrong chain auth kind")
	}

	isEntitled, cacheHit, err := ca.entitlementCache.executeUsingCache(ctx, cfg, args, ca.isEntitledToChannelUncached)
	if err != nil {
		return false, err
	}
	if cacheHit {
		isEntitledToChannelCacheHit.PassInc()
	} else {
		isEntitledToChannelCacheMiss.PassInc()
	}

	return isEntitled.IsAllowed(), nil
}

func (ca *chainAuth) getLinkedWallets(ctx context.Context, rootKey common.Address) ([]common.Address, error) {
	log := dlog.FromCtx(ctx)

	if ca.walletLinkContract == nil {
		log.Warn("Wallet link contract is not setup properly, returning root key only")
		return []common.Address{rootKey}, nil
	}

	// get all the wallets for the root key.
	wallets, err := ca.walletLinkContract.GetWalletsByRootKey(ctx, rootKey)
	if err != nil {
		log.Error("error getting all wallets", "rootKey", rootKey.Hex(), "error", err)
		return nil, err
	}

	log.Debug("allRelevantWallets", "wallets", wallets)

	return wallets, nil
}

func (ca *chainAuth) checkMembership(
	ctx context.Context,
	address common.Address,
	spaceId shared.StreamId,
	results chan<- bool,
	wg *sync.WaitGroup,
) {
	log := dlog.FromCtx(ctx)
	defer wg.Done()
	isMember, err := ca.spaceContract.IsMember(ctx, spaceId, address)
	if err != nil {
		log.Warn("Error checking membership", "err", err, "address", address.Hex(), "spaceId", spaceId)
	} else if isMember {
		results <- true
	} else {
		log.Warn("User is not a member of the space", "userId", address.Hex(), "spaceId", spaceId)
	}
}

/** checkEntitlement checks if the user is entitled to the space / channel.
 * It checks the entitlments for the root key and all the wallets linked to it in parallel.
 * If any of the wallets is entitled, the user is entitled and all inflight requests are cancelled.
 * If any of the operations fail before getting positive result, the whole operation fails.
 * A prerequisite for this function is that one of the linked wallets is a member of the space.
 */
func (ca *chainAuth) checkEntitlement(
	ctx context.Context,
	cfg *config.Config,
	args *ChainAuthArgs,
) (CacheResult, error) {
	log := dlog.FromCtx(ctx)

	ctx, cancel := context.WithTimeout(ctx, time.Millisecond*time.Duration(ca.contractCallsTimeoutMs))
	defer cancel()

	if args.kind == chainAuthKindSpace || args.kind == chainAuthKindIsSpaceMember {
		err := ca.checkSpaceEnabled(ctx, cfg, args.spaceId)
		if err != nil {
			return &boolCacheResult{allowed: false}, nil
		}
	} else if args.kind == chainAuthKindChannel {
		err := ca.checkChannelEnabled(ctx, cfg, args.spaceId, args.channelId)
		if err != nil {
			return &boolCacheResult{allowed: false}, nil
		}
	} else {
		return &boolCacheResult{allowed: false}, RiverError(Err_INTERNAL, "Unknown chain auth kind").Func("isWalletEntitled")
	}

	// Get all linked wallets.
	wallets, err := ca.getLinkedWallets(ctx, args.principal)
	if err != nil {
		return &boolCacheResult{allowed: false}, err
	}

	// Add the root key to the list of wallets.
	wallets = append(wallets, args.principal)
	args = args.withLinkedWallets(wallets)

	isMemberCtx, isMemberCancel := context.WithCancel(ctx)
	defer isMemberCancel()
	isMemberResults := make(chan bool, 1)
	var isMemberWg sync.WaitGroup

	for _, address := range wallets {
		isMemberWg.Add(1)
		go ca.checkMembership(isMemberCtx, address, args.spaceId, isMemberResults, &isMemberWg)
	}

	// Wait for at least one true result or all to complete
	go func() {
		isMemberWg.Wait()
		close(isMemberResults)
	}()

	isMember := false

	for result := range isMemberResults {
		if result {
			isMember = true
			isMemberCancel() // Cancel all other goroutines
			break
		}
	}

	if !isMember {
		log.Warn("User is not a member of the space", "userId", args.principal, "spaceId", args.spaceId)
		return &boolCacheResult{allowed: false}, nil
	}

	// Now that we know the user is a member of the space, we can check entitlements.
	if len(wallets) > ca.linkedWalletsLimit {
		log.Error("too many wallets linked to the root key", "rootKey", args.principal, "wallets", len(wallets))
		return &boolCacheResult{
				allowed: false,
			}, fmt.Errorf(
				"too many wallets linked to the root key: %d",
				len(wallets)-1,
			)
	}

	result, err := ca.areLinkedWalletsEntitled(ctx, cfg, args)
	if err != nil {
		return &boolCacheResult{allowed: false}, err
	}

	return &boolCacheResult{allowed: result}, nil
}

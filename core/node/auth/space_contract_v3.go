package auth

import (
	"context"
	"encoding/json"
	"math/big"
	"strings"
	"sync"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"

	"github.com/river-build/river/core/config"
	"github.com/river-build/river/core/contracts/base"
	. "github.com/river-build/river/core/node/base"
	"github.com/river-build/river/core/node/dlog"
	. "github.com/river-build/river/core/node/protocol"
	"github.com/river-build/river/core/node/shared"
	"github.com/river-build/river/core/xchain/bindings/erc721"
	"github.com/river-build/river/core/xchain/bindings/ierc5313"
)

type Space struct {
	address         common.Address
	managerContract *base.EntitlementsManager
	queryContract   *base.EntitlementDataQueryable
	banning         Banning
	pausable        *base.Pausable
	channels        *base.Channels
}

type SpaceContractV3 struct {
	architect  *base.Architect
	chainCfg   *config.ChainConfig
	backend    bind.ContractBackend
	spaces     map[shared.StreamId]*Space
	spacesLock sync.Mutex
}

var EMPTY_ADDRESS = common.Address{}

func NewSpaceContractV3(
	ctx context.Context,
	architectCfg *config.ContractConfig,
	chainCfg *config.ChainConfig,
	backend bind.ContractBackend,
	// walletLinkingCfg *config.ContractConfig,
) (SpaceContract, error) {
	architect, err := base.NewArchitect(architectCfg.Address, backend)
	if err != nil {
		return nil, err
	}

	spaceContract := &SpaceContractV3{
		architect: architect,
		chainCfg:  chainCfg,
		backend:   backend,
		spaces:    make(map[shared.StreamId]*Space),
	}

	return spaceContract, nil
}

func (sc *SpaceContractV3) IsMember(
	ctx context.Context,
	spaceId shared.StreamId,
	user common.Address,
) (bool, error) {
	space, err := sc.getSpace(ctx, spaceId)
	if err != nil {
		return false, err
	}

	spaceAsErc271, err := erc721.NewErc721(space.address, sc.backend)
	if err != nil {
		return false, err
	}

	isMember, err := spaceAsErc271.BalanceOf(nil, user)
	if err != nil {
		return false, err
	}
	return isMember.Cmp(big.NewInt(0)) > 0, err
}

func (sc *SpaceContractV3) IsEntitledToSpace(
	ctx context.Context,
	spaceId shared.StreamId,
	user common.Address,
	permission Permission,
) (bool, error) {
	// get the space entitlements and check if user is entitled.
	space, err := sc.getSpace(ctx, spaceId)
	if err != nil {
		return false, err
	}
	isEntitled, err := space.managerContract.IsEntitledToSpace(
		&bind.CallOpts{Context: ctx},
		user,
		permission.String(),
	)
	return isEntitled, err
}

func (sc *SpaceContractV3) marshalEntitlements(
	ctx context.Context,
	entitlementData []base.IEntitlementDataQueryableBaseEntitlementData,
) ([]Entitlement, error) {
	log := dlog.FromCtx(ctx)
	entitlements := make([]Entitlement, len(entitlementData))

	for i, entitlement := range entitlementData {
		if entitlement.EntitlementType == "RuleEntitlement" {
			entitlements[i].entitlementType = entitlement.EntitlementType
			log.Info("Entitlement data", "entitlement_data", entitlement.EntitlementData)
			// Parse the ABI definition
			parsedABI, err := base.IEntitlementGatedMetaData.GetAbi()
			if err != nil {
				log.Error("Failed to parse ABI", "error", err)
				return nil, err
			}

			var ruleData base.IRuleEntitlementRuleData

			unpackedData, err := parsedABI.Unpack("getRuleData", entitlement.EntitlementData)
			if err != nil {
				log.Warn(
					"Failed to unpack rule data",
					"error",
					err,
					"entitlement",
					entitlement,
					"entitlement_data",
					entitlement.EntitlementData,
					"len(entitlement.EntitlementData)",
					len(entitlement.EntitlementData),
				)
			}

			if len(unpackedData) > 0 {
				// Marshal into JSON, because for some UnpackIntoInterface doesn't work when unpacking diretly into a struct
				jsonData, err := json.Marshal(unpackedData[0])
				if err != nil {
					log.Warn("Failed to marshal data to JSON", "error", err, "unpackedData", unpackedData)
				}

				err = json.Unmarshal(jsonData, &ruleData)
				if err != nil {
					log.Warn(
						"Failed to unmarshal JSON to struct",
						"error",
						err,
						"jsonData",
						jsonData,
						"ruleData",
						ruleData,
					)
				}
			} else {
				log.Warn("No data unpacked", "unpackedData", unpackedData)
			}

			entitlements[i].ruleEntitlement = &ruleData

		} else if entitlement.EntitlementType == "UserEntitlement" {
			entitlements[i].entitlementType = entitlement.EntitlementType
			abiDef := `[{"name":"getAddresses","outputs":[{"type":"address[]","name":"out"}],"constant":true,"payable":false,"type":"function"}]`

			// Parse the ABI definition
			parsedABI, err := abi.JSON(strings.NewReader(abiDef))
			if err != nil {
				return nil, err
			}
			var addresses []common.Address
			// Unpack the data
			err = parsedABI.UnpackIntoInterface(&addresses, "getAddresses", entitlement.EntitlementData)
			if err != nil {
				return nil, err
			}
			entitlements[i].userEntitlement = addresses
		} else {
			return nil, RiverError(Err_UNKNOWN, "Invalid entitlement type").Tag("entitlement_type", entitlement.EntitlementType)
		}
	}
	return entitlements, nil
}

func (sc *SpaceContractV3) IsBanned(
	ctx context.Context,
	spaceId shared.StreamId,
	linkedWallets []common.Address,
) (bool, error) {
	log := dlog.FromCtx(ctx).With("function", "SpaceContractV3.IsBanned")
	space, err := sc.getSpace(ctx, spaceId)
	if err != nil {
		log.Warn("Failed to get space", "space_id", spaceId, "error", err)
		return false, err
	}
	return space.banning.IsBanned(ctx, linkedWallets)
}

/**
 * GetChannelEntitlementsForPermission returns the entitlements for the given permission for a channel.
 * The entitlements are returned as a list of `Entitlement`s.
 * Each Entitlement object contains the entitlement type and the entitlement data.
 * The entitlement data is either a RuleEntitlement or a UserEntitlement.
 * The RuleEntitlement contains the rule data.
 * The UserEntitlement contains the list of user addresses.
 */
func (sc *SpaceContractV3) GetChannelEntitlementsForPermission(
	ctx context.Context,
	spaceId shared.StreamId,
	channelId shared.StreamId,
	permission Permission,
) ([]Entitlement, common.Address, error) {
	log := dlog.FromCtx(ctx)
	// get the channel entitlements and check if user is entitled.
	space, err := sc.getSpace(ctx, spaceId)
	if err != nil {
		log.Warn("Failed to get space", "space_id", spaceId, "error", err)
		return nil, EMPTY_ADDRESS, err
	}

	// get owner address - owner has all permissions
	spaceAsIerc5313, err := ierc5313.NewIerc5313(space.address, sc.backend)
	if err != nil {
		log.Warn("Failed to get spaceAsIerc5313", "space_id", spaceId, "error", err)
		return nil, EMPTY_ADDRESS, err
	}

	owner, err := spaceAsIerc5313.Owner(nil)
	if err != nil {
		log.Warn("Failed to get owner", "space_id", spaceId, "error", err)
		return nil, EMPTY_ADDRESS, err
	}

	entitlementData, err := space.queryContract.GetChannelEntitlementDataByPermission(
		&bind.CallOpts{Context: ctx},
		channelId,
		permission.String(),
	)
	log.Info(
		"Got channel entitlement data",
		"err",
		err,
		"entitlement_data",
		entitlementData,
		"space_id",
		spaceId,
		"channel_id",
		channelId,
		"permission",
		permission.String(),
	)
	if err != nil {
		return nil, EMPTY_ADDRESS, err
	}

	entitlements, err := sc.marshalEntitlements(ctx, entitlementData)
	if err != nil {
		return nil, EMPTY_ADDRESS, err
	}

	return entitlements, owner, nil
}

/**
 * GetSpaceEntitlementsForPermission returns the entitlements for the given permission.
 * The entitlements are returned as a list of `Entitlement`s.
 * Each Entitlement object contains the entitlement type and the entitlement data.
 * The entitlement data is either a RuleEntitlement or a UserEntitlement.
 * The RuleEntitlement contains the rule data.
 * The UserEntitlement contains the list of user addresses.
 * The owner of the space is also returned.
 */
func (sc *SpaceContractV3) GetSpaceEntitlementsForPermission(
	ctx context.Context,
	spaceId shared.StreamId,
	permission Permission,
) ([]Entitlement, common.Address, error) {
	log := dlog.FromCtx(ctx)
	// get the space entitlements and check if user is entitled.
	space, err := sc.getSpace(ctx, spaceId)
	if err != nil {
		log.Warn("Failed to get space", "space_id", spaceId, "error", err)
		return nil, EMPTY_ADDRESS, err
	}

	spaceAsIerc5313, err := ierc5313.NewIerc5313(space.address, sc.backend)
	if err != nil {
		log.Warn("Failed to get spaceAsIerc5313", "space_id", spaceId, "error", err)
		return nil, EMPTY_ADDRESS, err
	}

	owner, err := spaceAsIerc5313.Owner(nil)
	if err != nil {
		log.Warn("Failed to get owner", "space_id", spaceId, "error", err)
		return nil, EMPTY_ADDRESS, err
	}

	entitlementData, err := space.queryContract.GetEntitlementDataByPermission(
		&bind.CallOpts{Context: ctx},
		permission.String(),
	)
	log.Info(
		"Got entitlement data",
		"err",
		err,
		"entitlement_data",
		entitlementData,
		"space_id",
		spaceId,
		"permission",
		permission.String(),
	)
	if err != nil {
		return nil, EMPTY_ADDRESS, err
	}

	entitlements, err := sc.marshalEntitlements(ctx, entitlementData)
	if err != nil {
		return nil, EMPTY_ADDRESS, err
	}

	log.Debug(
		"Returning entitlements",
		"entitlements",
		entitlements,
		"space_id",
		spaceId,
		"permission",
		permission.String(),
	)

	return entitlements, owner, nil
}

func (sc *SpaceContractV3) IsEntitledToChannel(
	ctx context.Context,
	spaceId shared.StreamId,
	channelId shared.StreamId,
	user common.Address,
	permission Permission,
) (bool, error) {
	// get the space entitlements and check if user is entitled to the channel
	space, err := sc.getSpace(ctx, spaceId)
	if err != nil {
		return false, err
	}
	// channel entitlement check
	isEntitled, err := space.managerContract.IsEntitledToChannel(
		&bind.CallOpts{Context: ctx},
		channelId,
		user,
		permission.String(),
	)
	return isEntitled, err
}

func (sc *SpaceContractV3) IsSpaceDisabled(ctx context.Context, spaceId shared.StreamId) (bool, error) {
	space, err := sc.getSpace(ctx, spaceId)
	if err != nil {
		return false, err
	}

	isDisabled, err := space.pausable.Paused(nil)
	return isDisabled, err
}

func (sc *SpaceContractV3) IsChannelDisabled(
	ctx context.Context,
	spaceId shared.StreamId,
	channelId shared.StreamId,
) (bool, error) {
	space, err := sc.getSpace(ctx, spaceId)
	if err != nil {
		return false, err
	}

	channel, err := space.channels.GetChannel(
		&bind.CallOpts{Context: ctx},
		channelId,
	)
	if err != nil {
		return false, err
	}

	return channel.Disabled, nil
}

func (sc *SpaceContractV3) getSpace(ctx context.Context, spaceId shared.StreamId) (*Space, error) {
	sc.spacesLock.Lock()
	defer sc.spacesLock.Unlock()
	if sc.spaces[spaceId] == nil {
		// use the networkId to fetch the space's contract address
		address, err := shared.AddressFromSpaceId(spaceId)
		if err != nil || address == EMPTY_ADDRESS {
			return nil, err
		}
		managerContract, err := base.NewEntitlementsManager(address, sc.backend)
		if err != nil {
			return nil, err
		}
		queryContract, err := base.NewEntitlementDataQueryable(address, sc.backend)
		if err != nil {
			return nil, err
		}
		pausable, err := base.NewPausable(address, sc.backend)
		if err != nil {
			return nil, err
		}
		banning, err := NewBanning(ctx, sc.chainCfg, address, sc.backend)
		if err != nil {
			return nil, err
		}
		channels, err := base.NewChannels(address, sc.backend)
		if err != nil {
			return nil, err
		}

		// cache the space
		sc.spaces[spaceId] = &Space{
			address:         address,
			managerContract: managerContract,
			queryContract:   queryContract,
			banning:         banning,
			pausable:        pausable,
			channels:        channels,
		}
	}
	return sc.spaces[spaceId], nil
}

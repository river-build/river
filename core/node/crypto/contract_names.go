package crypto

import (
	"encoding/hex"
	"fmt"

	"github.com/ethereum/go-ethereum/accounts/abi"

	"github.com/river-build/river/core/contracts/base"
	"github.com/river-build/river/core/contracts/river"
	"github.com/river-build/river/core/xchain/bindings/erc1155"
	"github.com/river-build/river/core/xchain/bindings/erc20"
	"github.com/river-build/river/core/xchain/bindings/erc721"
)

// ContractNameMap maps selectors found in contract ABI code to the contract's method name.
// This class can support multiple contracts but is best used for a single diamond since it
// can only store a maximum of 1 entry per selector.
type ContractNameMap interface {
	RegisterABI(contractName string, abi *abi.ABI)
	GetMethodName(selector string) (string, bool)
}

type contractNameMap struct {
	abis          []*abi.ABI
	selectorNames map[string]string
}

func (cnm *contractNameMap) RegisterABI(contractName string, abi *abi.ABI) {
	cnm.abis = append(cnm.abis, abi)
	for _, method := range abi.Methods {
		encoded := hex.EncodeToString(method.ID)
		cnm.selectorNames[encoded] = fmt.Sprintf("%s.%s", contractName, method.Name)
	}
}

func (cnm *contractNameMap) GetMethodName(selector string) (string, bool) {
	name, ok := cnm.selectorNames[selector]
	return name, ok
}

func NewContractNameMap() ContractNameMap {
	return &contractNameMap{
		selectorNames: map[string]string{},
	}
}

var _ ContractNameMap = (*contractNameMap)(nil)

var (
	baseNameMap  = NewContractNameMap()
	riverNameMap = NewContractNameMap()
)

func init() {
	// Selectors for base contracts.
	abi, _ := base.ArchitectMetaData.GetAbi()
	baseNameMap.RegisterABI("Architect", abi)
	abi, _ = base.BanningMetaData.GetAbi()
	baseNameMap.RegisterABI("Banning", abi)
	abi, _ = base.ChannelsMetaData.GetAbi()
	baseNameMap.RegisterABI("Channels", abi)
	abi, _ = base.EntitlementDataQueryableMetaData.GetAbi()
	baseNameMap.RegisterABI("EntitlementDataQueryable", abi)
	abi, _ = base.EntitlementsManagerMetaData.GetAbi()
	baseNameMap.RegisterABI("EntitlementsManager", abi)
	abi, _ = base.Erc721aQueryableMetaData.GetAbi()
	baseNameMap.RegisterABI("Erc721aQueryable", abi)
	abi, _ = base.IEntitlementCheckerMetaData.GetAbi()
	baseNameMap.RegisterABI("IEntitlementChecker", abi)
	abi, _ = base.IEntitlementGatedMetaData.GetAbi()
	baseNameMap.RegisterABI("IEntitlementGated", abi)
	abi, _ = base.IEntitlementMetaData.GetAbi()
	baseNameMap.RegisterABI("IEntitlement", abi)
	abi, _ = base.IRolesMetaData.GetAbi()
	baseNameMap.RegisterABI("IRoles", abi)
	abi, _ = base.PausableMetaData.GetAbi()
	baseNameMap.RegisterABI("Pausable", abi)
	abi, _ = base.RuleEntitlementMetaData.GetAbi()
	baseNameMap.RegisterABI("RuleEntitlement", abi)
	abi, _ = base.RuleEntitlementV2MetaData.GetAbi()
	baseNameMap.RegisterABI("RuleEntitlementV2", abi)
	abi, _ = base.WalletLinkMetaData.GetAbi()
	baseNameMap.RegisterABI("WalletLink", abi)

	// Entitlement-related. These may also occur on other chains.
	abi, _ = erc721.Erc721MetaData.GetAbi()
	baseNameMap.RegisterABI("Erc721", abi)
	abi, _ = erc1155.Erc1155MetaData.GetAbi()
	baseNameMap.RegisterABI("Erc1155", abi)
	abi, _ = erc20.Erc20MetaData.GetAbi()
	baseNameMap.RegisterABI("Erc20", abi)
	abi, _ = base.ICrossChainEntitlementMetaData.GetAbi()
	baseNameMap.RegisterABI("ICrossChainEntitlement", abi)

	// Selectors for river contracts.
	abi, _ = river.NodeRegistryV1MetaData.GetAbi()
	riverNameMap.RegisterABI("NodeRegistry", abi)
	abi, _ = river.OperatorRegistryV1MetaData.GetAbi()
	riverNameMap.RegisterABI("OperatorRegistry", abi)
	abi, _ = river.RiverConfigV1MetaData.GetAbi()
	riverNameMap.RegisterABI("RiverConfig", abi)
	abi, _ = river.StreamRegistryV1MetaData.GetAbi()
	riverNameMap.RegisterABI("StreamRegistry", abi)
}

func GetSelectorMethodName(selector string) (string, bool) {
	name, ok := baseNameMap.GetMethodName(selector)
	if ok {
		return name, true
	}

	return riverNameMap.GetMethodName(selector)
}

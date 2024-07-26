#!/bin/bash -ue
cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
cd ..

if [ -z ${ABIGEN_VERSION+x} ]; then
  ABIGEN_VERSION="v1.13.10"
fi

generate_go() {
    local DIR=$1
    local PACKAGE=$2
    local CONTRACT=$3
    local GO_NAME=$4

    local OUT_DIR="core/contracts/${DIR}"
    mkdir -p "${OUT_DIR}"

    go run github.com/ethereum/go-ethereum/cmd/abigen@${ABIGEN_VERSION} \
        --abi contracts/out/${CONTRACT}.sol/${CONTRACT}.abi.json \
        --bin contracts/out/${CONTRACT}.sol/${CONTRACT}.bin \
        --pkg "${PACKAGE}" \
        --type "${GO_NAME}" \
        --out "${OUT_DIR}/${GO_NAME}.go"
}

generate_go_nested() {
    local DIR=$1
    local PACKAGE=$2
    local SOURCE_FILE=$3
    local CONTRACT=$4
    local GO_NAME=$5

    local OUT_DIR="core/contracts/${DIR}"
    mkdir -p "${OUT_DIR}"

    go run github.com/ethereum/go-ethereum/cmd/abigen@${ABIGEN_VERSION} \
        --abi contracts/out/${SOURCE_FILE}.sol/${CONTRACT}.abi.json \
        --bin contracts/out/${SOURCE_FILE}.sol/${CONTRACT}.bin \
        --pkg "${PACKAGE}" \
        --type "${GO_NAME}" \
        --out "${OUT_DIR}/${GO_NAME}.go"
}


# Base (and other) contracts interfaces
generate_go base base IArchitect architect
generate_go_nested base base IArchitect IArchitectV2 architect_v2
generate_go base base Channels channels
generate_go base base IEntitlementsManager entitlements_manager
generate_go base base IEntitlementDataQueryable entitlement_data_queryable
generate_go base base IERC721AQueryable erc721a_queryable
generate_go base base IPausable pausable
generate_go base base IBanning banning
generate_go base base IWalletLink wallet_link
generate_go base base IRuleEntitlement rule_entitlement
generate_go_nested base base IRuleEntitlement IRuleEntitlementV2 rule_entitlement_v2
generate_go base base IEntitlementChecker i_entitlement_checker
generate_go base base IEntitlementGated i_entitlement_gated
generate_go base base IEntitlement i_entitlement
generate_go base base ICustomEntitlement i_custom_entitlement

# Full Base (and other) contracts for deployment from tests
generate_go base/deploy deploy MockCustomEntitlement mock_custom_entitlement
generate_go base/deploy deploy MockEntitlementGated mock_entitlement_gated
generate_go base/deploy deploy MockEntitlementChecker mock_entitlement_checker
generate_go base/deploy deploy EntitlementChecker entitlement_checker
generate_go base/deploy deploy WalletLink wallet_link
generate_go base/deploy deploy MockERC20 mock_erc20
generate_go base/deploy deploy MockERC721 mock_erc721
generate_go base/deploy deploy MockWalletLink mock_wallet_link

# River contracts interfaces
generate_go river river INodeRegistry node_registry_v1
generate_go river river IStreamRegistry stream_registry_v1
generate_go river river IOperatorRegistry operator_registry_v1
generate_go river river IRiverConfig river_config_v1

# Full River contracts for deployment from tests
generate_go river/deploy deploy MockRiverRegistry mock_river_registry

# Each contract will contain a definition of all types it uses as parameters or return types
# of methods, even if that struct was defined in another contract, and this sometimes results
# in duplicate struct declarations. Here, we remove the duplicate struct declarations from the
# generated files.

mkdir -p bin
go build -o bin/gen-bindings-remove-struct scripts/gen-bindings-remove-struct.go
./bin/gen-bindings-remove-struct core/contracts/base/architect.go IRuleEntitlementBaseCheckOperation,IRuleEntitlementBaseLogicalOperation,IRuleEntitlementBaseOperation,IRuleEntitlementBaseRuleData
./bin/gen-bindings-remove-struct core/contracts/base/entitlements_manager.go IRuleEntitlementBaseCheckOperation,IRuleEntitlementBaseLogicalOperation,IRuleEntitlementBaseOperation,IRuleEntitlementBaseRuleData
./bin/gen-bindings-remove-struct core/contracts/base/i_entitlement_gated.go IRuleEntitlementBaseCheckOperation,IRuleEntitlementBaseLogicalOperation,IRuleEntitlementBaseOperation,IRuleEntitlementBaseRuleData
./bin/gen-bindings-remove-struct core/contracts/base/deploy/mock_wallet_link.go IWalletLinkBaseLinkedWallet
./bin/gen-bindings-remove-struct core/contracts/base/architect_v2.go IArchitectBaseChannelInfo,IArchitectBaseMembership,IArchitectBaseMembershipRequirements,IArchitectBaseSpaceInfo,IMembershipBaseMembership,IRuleEntitlementBaseCheckOperation,IRuleEntitlementBaseLogicalOperation,IRuleEntitlementBaseOperation,IRuleEntitlementBaseRuleData
./bin/gen-bindings-remove-struct core/contracts/base/rule_entitlement_v2.go IRuleEntitlementBaseLogicalOperation,IRuleEntitlementBaseOperation
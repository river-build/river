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

# Base (and other) contracts interfaces
generate_go base base IArchitect architect
generate_go base base Channels channels
generate_go base base IEntitlementsManager entitlements_manager
generate_go base base IEntitlementDataQueryableV2 entitlement_data_queryable_v2
generate_go base base IERC721AQueryable erc721a_queryable
generate_go base base IPausable pausable
generate_go base base IBanning banning
generate_go base base IWalletLink wallet_link
generate_go base base IRuleEntitlementV2 rule_entitlement_v2
generate_go base base IEntitlementChecker i_entitlement_checker
generate_go base base IEntitlementGatedV2 i_entitlement_gated_v2
generate_go base base IEntitlement i_entitlement
generate_go base base ICustomEntitlement i_custom_entitlement

# Full Base (and other) contracts for deployment from tests
generate_go base/deploy deploy MockCustomEntitlement mock_custom_entitlement
generate_go base/deploy deploy MockEntitlementGatedV2 mock_entitlement_gated_v2
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

# The follwing structs get included multiple times in the generated code, this utility removes them from various files.
#
#		"IRuleEntitlementCheckOperation"
#		"IRuleEntitlementLogicalOperation"
#		"IRuleEntitlementOperation"
#		"IRuleEntitlementRuleData"
#		"IRuleEntitlementV2CheckOperation"
#		"IRuleEntitlementV2LogicalOperation"
#		"IRuleEntitlementV2Operation"
#		"IRuleEntitlementV2RuleData"

mkdir -p bin
go build -o bin/gen-bindings-remove-struct scripts/gen-bindings-remove-struct.go
./bin/gen-bindings-remove-struct core/contracts/base/architect.go IRuleEntitlementV2CheckOperation,IRuleEntitlementV2LogicalOperation,IRuleEntitlementV2Operation,IRuleEntitlementV2RuleData
./bin/gen-bindings-remove-struct core/contracts/base/entitlements_manager.go IRuleEntitlementCheckOperation,IRuleEntitlementLogicalOperation,IRuleEntitlementOperation,IRuleEntitlementRuleData,IRuleEntitlementV2CheckOperation,IRuleEntitlementV2LogicalOperation,IRuleEntitlementV2Operation,IRuleEntitlementV2RuleData
./bin/gen-bindings-remove-struct core/contracts/base/i_entitlement_gated_v2.go IRuleEntitlementCheckOperation,IRuleEntitlementLogicalOperation,IRuleEntitlementOperation,IRuleEntitlementRuleData,IRuleEntitlementV2CheckOperation,IRuleEntitlementV2LogicalOperation,IRuleEntitlementV2Operation,IRuleEntitlementV2RuleData
./bin/gen-bindings-remove-struct core/contracts/base/deploy/mock_entitlement_gated_v2.go IRuleEntitlementCheckOperation,IRuleEntitlementLogicalOperation,IRuleEntitlementOperation,IRuleEntitlementRuleData
./bin/gen-bindings-remove-struct core/contracts/base/deploy/mock_wallet_link.go IWalletLinkBaseLinkedWallet

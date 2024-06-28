#!/bin/bash
set -ueo pipefail
cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")"
cd ..

IGNORED="${1:-}"
FROZEN="${2:-}"
ABI_DIR="packages/generated/dev/abis"

forge build

CONTRACT_INTERFACES="(IDiamond|IDiamondCut|IArchitect|IProxyManager|IPausable|IEntitlementsManager|IChannel|IRoles|IMulticall|IRuleEntitlement|IWalletLink|INodeRegistry|IOperatorRegistry|IStreamRegistry|OwnableFacet|TokenPausableFacet|UserEntitlement|ISpaceOwner|MockERC721A|MembershipFacet|Member|IBanning|IPricingModules|ICustomEntitlement|MockEntitlementGated|PrepayFacet|IERC721AQueryable|IEntitlementDataQueryable|PlatformRequirementsFacet|IERC721A|INodeOperator,ISpaceDelegation,IEntitlementChecker|IERC5267)"

yarn typechain --target=ethers-v5 "contracts/out/**/?${CONTRACT_INTERFACES}.json" --out-dir "packages/generated/dev/typings"

mkdir -p $ABI_DIR && cp -a contracts/out/{Diamond,DiamondCutFacet,Architect,ProxyManager,IPausable,EntitlementsManager,Channels,Roles,IMulticall,OwnableFacet,WalletLink,NodeRegistry,OperatorRegistry,StreamRegistry,TokenPausableFacet,IRuleEntitlement,UserEntitlement,SpaceOwner,MockERC721A,MembershipFacet,Member,MockRiverRegistry,IBanning,IPricingModules,ICustomEntitlement,MockCustomEntitlement,MockEntitlementGated,PrepayFacet,IERC721AQueryable,IEntitlementDataQueryable,PlatformRequirementsFacet,IERC721A,INodeOperator,ISpaceDelegation,IEntitlementChecker,IERC5267}.sol/* "$ABI_DIR"

# Copy the json abis to TS files for type inference
for file in $ABI_DIR/*.abi.json; do
  filename=$(basename  "$file" .json)
  echo "export default $(cat $file) as const" > $ABI_DIR/$filename.ts
done

./scripts/gen-river-node-bindings.sh

DIFF_GLOB="$ABI_DIR/*.ts"

# Using the $FROZEN flag and git diff, we can check if this script generates any new files
# under the $ABI_DIR directory.
if [ "$FROZEN" = "--frozen" ]; then
  if git diff --quiet --exit-code -p $DIFF_GLOB; then
    echo "No new types generated by build-contract-types.sh"
  else
    echo "$(git diff -p $DIFF_GLOB)"
    echo "Error: build-contract-types.sh generated new types with the --frozen flag. Please re-run ./scripts/build-contract-types.sh to re-generate the files and commit the changes."
    exit 1
  fi
fi

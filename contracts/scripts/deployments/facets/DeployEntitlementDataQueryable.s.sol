// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";
import {EntitlementDataQueryable} from "contracts/src/spaces/facets/entitlements/extensions/EntitlementDataQueryable.sol";

contract DeployEntitlementDataQueryable is Deployer, FacetHelper {
  // FacetHelper
  constructor() {
    addSelector(
      EntitlementDataQueryable.getEntitlementDataByPermission.selector
    );
    addSelector(
      EntitlementDataQueryable.getChannelEntitlementDataByPermission.selector
    );
  }

  // Deploying
  function versionName() public pure override returns (string memory) {
    return "entitlementDataQueryable";
  }

  function __deploy(
    uint256 deployerPK,
    address
  ) public override returns (address) {
    vm.startBroadcast(deployerPK);
    EntitlementDataQueryable facet = new EntitlementDataQueryable();
    vm.stopBroadcast();
    return address(facet);
  }
}

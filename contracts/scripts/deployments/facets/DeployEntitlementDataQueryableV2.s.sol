// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";
import {EntitlementDataQueryableV2} from "contracts/src/spaces/facets/entitlements/extensions/EntitlementDataQueryableV2.sol";

contract DeployEntitlementDataQueryableV2 is Deployer, FacetHelper {
  // FacetHelper
  constructor() {
    addSelector(
      EntitlementDataQueryableV2.getEntitlementDataByPermission.selector
    );
    addSelector(
      EntitlementDataQueryableV2.getChannelEntitlementDataByPermission.selector
    );
    addSelector(
      EntitlementDataQueryableV2.getEntitlementDataByPermissionV2.selector
    );
    addSelector(
      EntitlementDataQueryableV2
        .getChannelEntitlementDataByPermissionV2
        .selector
    );
  }

  // Deploying
  function versionName() public pure override returns (string memory) {
    return "entitlementDataQueryableV2";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    EntitlementDataQueryableV2 facet = new EntitlementDataQueryableV2();
    vm.stopBroadcast();
    return address(facet);
  }
}

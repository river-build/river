// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";
import {EntitlementGatedV2} from "contracts/src/spaces/facets/gated/EntitlementGatedV2.sol";

contract DeployEntitlementGatedV2 is FacetHelper, Deployer {
  constructor() {
    addSelector(EntitlementGatedV2.postEntitlementCheckResult.selector);
    addSelector(EntitlementGatedV2.getRuleDataV2.selector);
    addSelector(EntitlementGatedV2.getRuleData.selector);
  }

  function initializer() public pure override returns (bytes4) {
    return EntitlementGatedV2.__EntitlementGatedV2_init.selector;
  }

  function versionName() public pure override returns (string memory) {
    return "entitlementGatedV2";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    EntitlementGatedV2 facet = new EntitlementGatedV2();
    vm.stopBroadcast();
    return address(facet);
  }
}

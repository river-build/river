// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.23;

import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {PoapEntitlementFactory} from "contracts/src/spaces/entitlements/poap/PoapEntitlementFactory.sol";

contract DeployPoapEntitlementFactory is Deployer {
  function versionName() public pure override returns (string memory) {
    return "DeployPoapEntitlementFactory";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.broadcast(deployer);

    PoapEntitlementFactory factory = new PoapEntitlementFactory();

    return address(factory);
  }
}

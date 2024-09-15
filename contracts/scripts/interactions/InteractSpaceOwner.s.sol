// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IGuardian} from "contracts/src/spaces/facets/guardian/IGuardian.sol";

// libraries

// contracts
import {Interaction} from "contracts/scripts/common/Interaction.s.sol";

contract InteractSpaceOwner is Interaction {
  function __interact(address deployer) internal override {
    address spaceOwner = getDeployment("spaceOwner");

    vm.broadcast(deployer);
    IGuardian(spaceOwner).setDefaultCooldown(5 minutes);
  }
}

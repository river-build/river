// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IArchitectBase} from "contracts/src/factory/facets/architect/IArchitect.sol";
import {ICreateSpace} from "contracts/src/factory/facets/create/ICreateSpace.sol";
import {SpaceHelper} from "contracts/test/spaces/SpaceHelper.sol";

// libraries

// contracts
import {Interaction} from "contracts/scripts/common/Interaction.s.sol";

// debugging

contract InteractCreateSpace is Interaction, SpaceHelper, IArchitectBase {
  function __interact(address deployer) internal override {
    address spaceFactory = getDeployment("spaceFactory");
    address dynamicPricing = getDeployment("tieredLogPricingV3");

    IArchitectBase.SpaceInfo memory userInfo = _createUserSpaceInfo(
      "test",
      new address[](0)
    );
    userInfo.membership.settings.pricingModule = dynamicPricing;

    vm.startBroadcast(deployer);
    ICreateSpace(spaceFactory).createSpace(userInfo);
    vm.stopBroadcast();
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

//interfaces
import {IArchitectBase} from "contracts/src/factory/facets/architect/IArchitect.sol";
import {IMembership} from "contracts/src/spaces/facets/membership/IMembership.sol";
import {IPricingModulesBase} from "contracts/src/factory/facets/architect/pricing/IPricingModules.sol";

//libraries

//contracts
import {SpaceHelper} from "contracts/test/spaces/SpaceHelper.sol";
import {Architect} from "contracts/src/factory/facets/architect/Architect.sol";
import {PricingModulesFacet} from "contracts/src/factory/facets/architect/pricing/PricingModulesFacet.sol";

// debuggging
import {console} from "forge-std/console.sol";

contract ForkCreateSpace is
  IArchitectBase,
  IPricingModulesBase,
  TestUtils,
  SpaceHelper
{
  function getDynamicPricingModule(
    address spaceFactory
  ) internal view returns (address) {
    PricingModulesFacet pricingModules = PricingModulesFacet(spaceFactory);
    PricingModule[] memory modules = pricingModules.listPricingModules();

    for (uint256 i = 0; i < modules.length; i++) {
      if (
        keccak256(abi.encodePacked(modules[i].name)) ==
        keccak256(abi.encodePacked("TieredLogPricingOracleV2"))
      ) {
        return modules[i].module;
      }
    }

    return address(0);
  }

  function test_createForkSpaceAlpha() external onlyForked {
    address founder = _randomAddress();
    address spaceFactory = 0xC09Ac0FFeecAaE5100158247512DC177AeacA3e3;

    Architect spaceArchitect = Architect(spaceFactory);

    SpaceInfo memory spaceInfo = _createEveryoneSpaceInfo("fork-space");
    address dynamicPricingModule = getDynamicPricingModule(spaceFactory);

    assertNotEq(dynamicPricingModule, address(0));

    spaceInfo.membership.settings.pricingModule = dynamicPricingModule;

    vm.prank(founder);
    address space = spaceArchitect.createSpace(spaceInfo);

    address pricingModule = IMembership(space).getMembershipPricingModule();
    assertEq(pricingModule, spaceInfo.membership.settings.pricingModule);
  }
}

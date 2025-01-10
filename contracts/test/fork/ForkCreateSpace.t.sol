// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

//interfaces
import {IArchitectBase} from "contracts/src/factory/facets/architect/IArchitect.sol";
import {ILegacyArchitect, ILegacyArchitectBase} from "contracts/test/mocks/legacy/IMockLegacyArchitect.sol";
import {IMembership} from "contracts/src/spaces/facets/membership/IMembership.sol";
import {IPricingModulesBase} from "contracts/src/factory/facets/architect/pricing/IPricingModules.sol";
import {ICreateSpace} from "contracts/src/factory/facets/create/ICreateSpace.sol";
import {IPlatformRequirements} from "contracts/src/factory/facets/platform/requirements/IPlatformRequirements.sol";

//libraries
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";
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
        keccak256(abi.encodePacked("TieredLogPricingOracleV3"))
      ) {
        return modules[i].module;
      }
    }

    return address(0);
  }

  function test_joinForkSpaceAlpha() external onlyForked {
    address space = 0x0ca3c941cF5d9229EDd9Be592C06AE59c6A8ACF0;
    address user = 0x696f2C1C73c8a6f39Dec5FD375C37b20a74D4C20;
    address spaceFactory = 0xC09Ac0FFeecAaE5100158247512DC177AeacA3e3;

    uint256 price = IMembership(space).getMembershipPrice();
    uint256 fee = IPlatformRequirements(spaceFactory).getMembershipFee();

    uint256 value = FixedPointMathLib.max(price, fee);

    vm.startPrank(user);
    IMembership(space).joinSpace{value: value}(user);
    vm.stopPrank();
  }

  function test_createForkSpaceAlpha() external onlyForked {
    address founder = _randomAddress();
    address spaceFactory = 0xC09Ac0FFeecAaE5100158247512DC177AeacA3e3;

    ILegacyArchitect legacyCreateSpace = ILegacyArchitect(spaceFactory);
    ICreateSpace createSpace = ICreateSpace(spaceFactory);

    ILegacyArchitectBase.SpaceInfo
      memory legacySpaceInfo = _createLegacySpaceInfo("fork-space");
    CreateSpace memory createSpaceInfo = _createSpaceWithPrepayInfo(
      "fork-space"
    );

    address dynamicPricingModule = getDynamicPricingModule(spaceFactory);

    console.log("Dynamic Pricing Module: %s", dynamicPricingModule);

    assertNotEq(dynamicPricingModule, address(0));

    legacySpaceInfo.membership.settings.pricingModule = dynamicPricingModule;
    createSpaceInfo.membership.settings.pricingModule = dynamicPricingModule;

    vm.startPrank(founder);
    address legacySpace = legacyCreateSpace.createSpace(legacySpaceInfo);
    address modernSpace = createSpace.createSpaceWithPrepay(createSpaceInfo);
    vm.stopPrank();

    address legacyPricingModule = IMembership(legacySpace)
      .getMembershipPricingModule();
    assertEq(
      legacyPricingModule,
      legacySpaceInfo.membership.settings.pricingModule
    );

    address modernPricingModule = IMembership(modernSpace)
      .getMembershipPricingModule();
    assertEq(
      modernPricingModule,
      createSpaceInfo.membership.settings.pricingModule
    );
  }

  function test_createForkSpaceOmega() external onlyForked {
    address founder = _randomAddress();
    address spaceFactory = 0x9978c826d93883701522d2CA645d5436e5654252;

    vm.prank(founder);
    (bool success, ) = spaceFactory.call(
      hex"cd55d94c0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000005c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000084e4654486f7573650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002e00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000003e80000000000000000000000000000000000000000000000000000000001e13380000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000390f6f5213fa097c6d68b2fcc8a40c08e28f46d500000000000000000000000000000000000000000000000000000000000000114e4654486f757365202d204d656d62657200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000064d454d42455200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000004526561640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000055772697465000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000552656163740000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000767656e6572616c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    );

    assertTrue(success, "createSpace failed");
  }
}

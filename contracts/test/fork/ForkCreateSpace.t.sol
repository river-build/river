// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

//interfaces
import {IArchitectBase} from "contracts/src/factory/facets/architect/IArchitect.sol";
import {IMembership} from "contracts/src/spaces/facets/membership/IMembership.sol";
import {IERC173} from "contracts/src/diamond/facets/ownable/IERC173.sol";
import {IPrepay} from "contracts/src/factory/facets/prepay/IPrepay.sol";

//libraries

//contracts
import {SpaceHelper} from "contracts/test/spaces/SpaceHelper.sol";
import {Architect} from "contracts/src/factory/facets/architect/Architect.sol";

contract ForkSpaceInteractions is IArchitectBase, TestUtils, SpaceHelper {
  address spaceFactory = 0x968696BC59431Ef085441641f550C8e2Eaca8BEd;

  function setUp() public onlyForked {}

  function test_createForkSpace() external onlyForked {
    address founder = _randomAddress();

    SpaceInfo memory spaceInfo = _createEveryoneSpaceInfo("fork-space");
    spaceInfo
      .membership
      .settings
      .pricingModule = 0xd6557a643427d36DBae33B69d30f54A17De606Ab;

    Architect spaceArchitect = Architect(spaceFactory);

    vm.prank(founder);
    address space = spaceArchitect.createSpace(spaceInfo);

    address pricingModule = IMembership(space).getMembershipPricingModule();
    assertEq(pricingModule, spaceInfo.membership.settings.pricingModule);
  }

  // function test_prepayFacet() external onlyForked {
  //   address space = 0xA8dCd52c87897220C8AF74Bee5A7F67C663c2B48;
  //   address owner = IERC173(space).owner();

  //   vm.prank(owner);
  //   IPrepay(spaceFactory).prepayMembership(space, 1);
  // }
}

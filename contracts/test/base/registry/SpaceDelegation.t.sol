// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IOwnableBase} from "contracts/src/diamond/facets/ownable/IERC173.sol";
import {ISpaceDelegationBase} from "contracts/src/base/registry/facets/delegation/ISpaceDelegation.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";
import {StakingRewards} from "contracts/src/base/registry/facets/distribution/v2/StakingRewards.sol";

// contracts
import {SpaceDelegationFacet} from "contracts/src/base/registry/facets/delegation/SpaceDelegationFacet.sol";
import {BaseRegistryTest} from "./BaseRegistry.t.sol";

contract SpaceDelegationTest is
  BaseRegistryTest,
  IOwnableBase,
  ISpaceDelegationBase
{
  using EnumerableSet for EnumerableSet.AddressSet;
  using FixedPointMathLib for uint256;

  SpaceDelegationFacet internal spaceDelegation;
  EnumerableSet.AddressSet internal spaceSet;
  EnumerableSet.AddressSet internal operatorSet;

  function setUp() public override {
    super.setUp();
    spaceDelegation = SpaceDelegationFacet(baseRegistry);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                       ADD DELEGATION                       */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_addSpaceDelegation_revertIf_invalidSpace() public {
    vm.expectRevert(SpaceDelegation__InvalidSpace.selector);
    spaceDelegation.addSpaceDelegation(address(this), OPERATOR);
  }

  function test_addSpaceDelegation_revertIf_alreadyDelegated() public {
    space = deploySpace(deployer);
    vm.prank(deployer);
    spaceDelegation.addSpaceDelegation(space, OPERATOR);

    vm.expectRevert(SpaceDelegation__AlreadyDelegated.selector);
    vm.prank(deployer);
    spaceDelegation.addSpaceDelegation(space, OPERATOR);
  }

  function test_addSpaceDelegation_revertIf_invalidOperator() public {
    space = deploySpace(deployer);
    vm.expectRevert(SpaceDelegation__InvalidOperator.selector);
    vm.prank(deployer);
    spaceDelegation.addSpaceDelegation(space, address(this));
  }

  function test_fuzz_addSpaceDelegation(
    address operator,
    uint256 commissionRate
  ) public givenOperator(operator, commissionRate) returns (address space) {
    space = deploySpace(deployer);

    vm.prank(deployer);
    spaceDelegation.addSpaceDelegation(space, operator);

    address assignedOperator = spaceDelegation.getSpaceDelegation(space);
    assertEq(assignedOperator, operator, "Space delegation failed");
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                     REPLACE DELEGATION                     */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_fuzz_addSpaceDelegation_replace(
    address[2] memory operators,
    uint256[2] memory commissionRates,
    uint256 rewardAmount,
    uint256 timeLapse
  ) public givenOperator(operators[1], commissionRates[1]) {
    vm.assume(operators[0] != operators[1]);
    commissionRates[0] = bound(commissionRates[0], 1, 10000);
    address space = test_fuzz_addSpaceDelegation(
      operators[0],
      commissionRates[0]
    );

    rewardAmount = boundReward(rewardAmount);
    bridgeTokensForUser(address(rewardsDistributionFacet), rewardAmount);

    vm.prank(NOTIFIER);
    rewardsDistributionFacet.notifyRewardAmount(rewardAmount);

    uint96 amount = 1 ether;
    bridgeTokensForUser(address(this), amount);

    river.approve(address(rewardsDistributionFacet), amount);
    rewardsDistributionFacet.stake(amount, space, address(this));

    timeLapse = bound(timeLapse, 1, rewardDuration);
    vm.warp(block.timestamp + timeLapse);

    vm.expectEmit(true, true, true, false, address(spaceDelegation));
    emit SpaceRewardsSwept(space, operators[0], 0);

    vm.prank(deployer);
    spaceDelegation.addSpaceDelegation(space, operators[1]);

    StakingState memory state = rewardsDistributionFacet.stakingState();
    StakingRewards.Treasure memory spaceTreasure = rewardsDistributionFacet
      .treasureByBeneficiary(space);

    assertEq(spaceTreasure.earningPower, (amount * commissionRates[0]) / 10000);
    assertEq(
      spaceTreasure.rewardPerTokenAccumulated,
      state.rewardPerTokenAccumulated
    );
    assertEq(spaceTreasure.unclaimedRewardSnapshot, 0);

    assertEq(
      rewardsDistributionFacet
        .treasureByBeneficiary(operators[0])
        .unclaimedRewardSnapshot,
      spaceTreasure.earningPower *
        state.rewardRate.fullMulDiv(timeLapse, state.totalStaked)
    );
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                      REMOVE DELEGATION                     */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_removeSpaceDelegation_revertIf_invalidSpace() public {
    vm.expectRevert(SpaceDelegation__InvalidSpace.selector);
    spaceDelegation.removeSpaceDelegation(address(0));
  }

  function test_fuzz_removeSpaceDelegation(address operator) public {
    address space = test_fuzz_addSpaceDelegation(operator, 0);

    vm.prank(deployer);
    spaceDelegation.removeSpaceDelegation(space);

    address afterRemovalOperator = spaceDelegation.getSpaceDelegation(space);
    assertEq(afterRemovalOperator, address(0), "Space removal failed");
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           GETTERS                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_fuzz_getSpaceDelegationsByOperator(address operator) public {
    address space1 = test_fuzz_addSpaceDelegation(operator, 0);
    address space2 = test_fuzz_addSpaceDelegation(operator, 0);

    address[] memory spaces = spaceDelegation.getSpaceDelegationsByOperator(
      operator
    );

    assertEq(spaces.length, 2);
    assertEq(spaces[0], space1);
    assertEq(spaces[1], space2);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           SETTERS                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_setRiverToken_revertIf_notOwner() public {
    vm.expectRevert(
      abi.encodeWithSelector(Ownable__NotOwner.selector, address(this))
    );
    spaceDelegation.setRiverToken(address(0));
  }

  function test_fuzz_setRiverToken(address newToken) public {
    vm.assume(newToken != address(0));

    vm.expectEmit(address(spaceDelegation));
    emit RiverTokenChanged(newToken);

    vm.prank(deployer);
    spaceDelegation.setRiverToken(newToken);

    address retrievedToken = spaceDelegation.riverToken();
    assertEq(retrievedToken, newToken);
  }

  function test_fuzz_setSpaceFactory_revertIf_notOwner() public {
    vm.expectRevert(
      abi.encodeWithSelector(Ownable__NotOwner.selector, address(this))
    );
    spaceDelegation.setSpaceFactory(address(0));
  }

  function test_fuzz_setSpaceFactory(address newSpaceFactory) public {
    vm.assume(newSpaceFactory != address(0));

    vm.prank(deployer);
    spaceDelegation.setSpaceFactory(newSpaceFactory);

    address retrievedFactory = spaceDelegation.getSpaceFactory();
    assertEq(retrievedFactory, newSpaceFactory);
  }
}

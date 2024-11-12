// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IMainnetDelegationBase} from "contracts/src/tokens/river/base/delegation/IMainnetDelegation.sol";

// contracts
import {BaseRegistryTest} from "./BaseRegistry.t.sol";

contract MainnetDelegationTest is BaseRegistryTest, IMainnetDelegationBase {
  function setUp() public override {
    super.setUp();

    // the first staking cannot be from mainnet
    bridgeTokensForUser(address(this), 1 ether);
    river.approve(address(rewardsDistributionFacet), 1 ether);
    rewardsDistributionFacet.stake(1 ether, OPERATOR, _randomAddress());
  }

  function test_setDelegation() public returns (uint256 depositId) {
    return test_fuzz_setDelegation(address(this), 1 ether, OPERATOR, 0);
  }

  function test_fuzz_setDelegation(
    address delegator,
    uint96 amount,
    address operator,
    uint256 commissionRate
  ) public givenOperator(operator, commissionRate) returns (uint256 depositId) {
    vm.assume(delegator != baseRegistry);
    vm.assume(delegator != address(0) && delegator != operator);
    vm.assume(amount > 0);
    commissionRate = bound(commissionRate, 0, 10000);

    vm.expectEmit(baseRegistry);
    emit DelegationSet(delegator, operator, amount);

    vm.prank(address(messenger));
    mainnetDelegationFacet.setDelegation(delegator, operator, amount);

    Delegation memory delegation = mainnetDelegationFacet
      .getDelegationByDelegator(delegator);
    assertEq(delegation.operator, operator);
    assertEq(delegation.quantity, amount);
    assertEq(delegation.delegator, delegator);
    assertEq(delegation.delegationTime, block.timestamp);

    depositId = mainnetDelegationFacet.getDepositIdByDelegator(delegator);

    verifyStake(
      baseRegistry,
      depositId,
      amount,
      operator,
      commissionRate,
      delegator
    );
  }

  function test_fuzz_setDelegation_remove(
    address delegator,
    uint96 amount,
    address operator,
    uint256 commissionRate
  ) public givenOperator(operator, commissionRate) {
    uint256 depositId = test_fuzz_setDelegation(
      delegator,
      amount,
      operator,
      commissionRate
    );

    vm.expectEmit(baseRegistry);
    emit DelegationRemoved(delegator);

    vm.prank(address(messenger));
    mainnetDelegationFacet.setDelegation(delegator, address(0), 0);

    Delegation memory delegation = mainnetDelegationFacet
      .getDelegationByDelegator(delegator);
    assertEq(delegation.operator, address(0));
    assertEq(delegation.quantity, 0);
    assertEq(delegation.delegator, address(0));
    assertEq(delegation.delegationTime, 0);

    verifyStake(
      baseRegistry,
      depositId,
      0,
      address(0),
      commissionRate,
      delegator
    );
  }

  function test_fuzz_setDelegation_replace(
    address delegator,
    uint96[2] memory amounts,
    address[2] memory operators,
    uint256[2] memory commissionRates
  ) public givenOperator(operators[1], commissionRates[1]) {
    vm.assume(operators[0] != operators[1]);
    vm.assume(delegator != operators[1]);
    vm.assume(amounts[1] > 0);
    commissionRates[1] = bound(commissionRates[1], 0, 10000);

    uint256 depositId = test_fuzz_setDelegation(
      delegator,
      amounts[0],
      operators[0],
      commissionRates[0]
    );

    vm.warp(_randomUint256());

    vm.expectEmit(baseRegistry);
    emit DelegationSet(delegator, operators[1], amounts[1]);

    vm.prank(address(messenger));
    mainnetDelegationFacet.setDelegation(delegator, operators[1], amounts[1]);

    Delegation memory delegation = mainnetDelegationFacet
      .getDelegationByDelegator(delegator);
    assertEq(delegation.operator, operators[1]);
    assertEq(delegation.quantity, amounts[1]);
    assertEq(delegation.delegator, delegator);
    assertEq(delegation.delegationTime, block.timestamp);

    verifyStake(
      baseRegistry,
      depositId,
      amounts[1],
      operators[1],
      commissionRates[1],
      delegator
    );
  }

  function test_initiateWithdraw_revertIf_mainnetDelegator() public {
    uint256 depositId = test_setDelegation();

    vm.expectRevert(RewardsDistribution__NotDepositOwner.selector);
    rewardsDistributionFacet.initiateWithdraw(depositId);
  }

  function test_withdraw_revertIf_mainnetDelegator() public {
    uint256 depositId = test_setDelegation();

    vm.expectRevert(RewardsDistribution__NotDepositOwner.selector);
    rewardsDistributionFacet.withdraw(depositId);
  }
}

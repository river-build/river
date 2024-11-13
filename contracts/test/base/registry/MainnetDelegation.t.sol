// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IMainnetDelegationBase} from "contracts/src/tokens/river/base/delegation/IMainnetDelegation.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// contracts
import {BaseRegistryTest} from "./BaseRegistry.t.sol";

contract MainnetDelegationTest is BaseRegistryTest, IMainnetDelegationBase {
  using EnumerableSet for EnumerableSet.AddressSet;

  EnumerableSet.AddressSet internal delegatorSet;
  EnumerableSet.AddressSet internal operatorSet;

  function setUp() public override {
    super.setUp();

    // the first staking cannot be from mainnet
    bridgeTokensForUser(address(this), 1 ether);
    river.approve(address(rewardsDistributionFacet), 1 ether);
    rewardsDistributionFacet.stake(1 ether, OPERATOR, _randomAddress());
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                       SET DELEGATION                       */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

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

    depositId = mainnetDelegationFacet.getDepositIdByDelegator(delegator);
    verifyDelegation(depositId, delegator, operator, amount, commissionRate);
  }

  function test_fuzz_setDelegation_remove(
    address delegator,
    uint96 amount,
    address operator,
    uint256 commissionRate
  ) public {
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

    verifyRemoval(delegator, depositId, commissionRate);
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

    verifyDelegation(
      depositId,
      delegator,
      operators[1],
      amounts[1],
      commissionRates[1]
    );
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                    SET BATCH DELEGATION                    */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_setBatchDelegation(
    address[32] memory delegators,
    address[32] memory claimers,
    uint256[32] memory quantities,
    address[32] memory operators,
    uint256[32] memory commissionRates
  ) public {
    for (uint256 i; i < 32; ++i) {
      // ensure delegators and operators are unique
      if (delegators[i] == address(0) || delegatorSet.contains(delegators[i])) {
        delegators[i] = _randomAddress();
      }
      delegatorSet.add(delegators[i]);
    }
    for (uint256 i; i < 32; ++i) {
      if (
        operators[i] == address(0) ||
        operators[i] == OPERATOR ||
        operatorSet.contains(operators[i]) ||
        delegatorSet.contains(operators[i])
      ) {
        operators[i] = _randomAddress();
      }
      operatorSet.add(operators[i]);
      commissionRates[i] = bound(commissionRates[i], 0, 10000);
      setOperator(operators[i], commissionRates[i]);
      quantities[i] = bound(quantities[i], 1, type(uint96).max);
    }

    address[] memory _delegators = _toDyn(delegators);
    address[] memory _operators = _toDyn(operators);
    address[] memory _claimers = _toDyn(claimers);
    uint256[] memory _quantities = _toDyn(quantities);

    vm.prank(address(messenger));
    mainnetDelegationFacet.setBatchDelegation(
      _delegators,
      _operators,
      _claimers,
      _quantities
    );

    verifyBatch(
      _delegators,
      _claimers,
      _quantities,
      _operators,
      _toDyn(commissionRates)
    );
  }

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_setBatchDelegation_replace(
    address[32] memory delegators,
    address[32] memory claimers,
    uint256[32] memory quantities,
    address[32] memory operators,
    uint256[32] memory commissionRates
  ) public {
    test_fuzz_setBatchDelegation(
      delegators,
      claimers,
      quantities,
      operators,
      commissionRates
    );

    address[] memory _delegators = _toDyn(delegators);
    address[] memory _operators = _toDyn(operators);
    address[] memory _claimers = _toDyn(claimers);

    uint256[] memory _quantities = new uint256[](32);
    for (uint256 i; i < 32; ++i) {
      _quantities[i] = bound(_randomUint256(), 1, type(uint96).max);
    }

    vm.prank(address(messenger));
    mainnetDelegationFacet.setBatchDelegation(
      _delegators,
      _operators,
      _claimers,
      _quantities
    );
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                     REMOVE DELEGATION                      */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// forge-config: default.fuzz.runs = 64
  function test_fuzz_removeDelegations(
    address[32] memory delegators,
    address[32] memory claimers,
    uint256[32] memory quantities,
    address[32] memory operators,
    uint256[32] memory commissionRates
  ) public {
    test_fuzz_setBatchDelegation(
      delegators,
      claimers,
      quantities,
      operators,
      commissionRates
    );

    vm.startPrank(address(messenger));
    mainnetDelegationFacet.removeDelegations(_toDyn(delegators));

    for (uint256 i; i < 32; ++i) {
      uint256 depositId = mainnetDelegationFacet.getDepositIdByDelegator(
        delegators[i]
      );
      verifyRemoval(delegators[i], depositId, commissionRates[i]);
    }
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           HELPER                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function verifyDelegation(
    uint256 depositId,
    address delegator,
    address operator,
    uint96 quantity,
    uint256 commissionRate
  ) internal view {
    Delegation memory delegation = mainnetDelegationFacet
      .getDelegationByDelegator(delegator);
    assertEq(delegation.operator, operator);
    assertEq(delegation.quantity, quantity);
    assertEq(delegation.delegator, delegator);
    assertEq(delegation.delegationTime, block.timestamp);

    verifyStake(
      baseRegistry,
      depositId,
      quantity,
      operator,
      commissionRate,
      delegator
    );
  }

  function verifyRemoval(
    address delegator,
    uint256 depositId,
    uint256 commissionRate
  ) internal view {
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

  function verifyBatch(
    address[] memory delegators,
    address[] memory claimers,
    uint256[] memory quantities,
    address[] memory operators,
    uint256[] memory commissionRates
  ) internal view {
    uint256 len = delegators.length;
    for (uint256 i; i < len; ++i) {
      uint256 depositId = mainnetDelegationFacet.getDepositIdByDelegator(
        delegators[i]
      );
      verifyDelegation(
        depositId,
        delegators[i],
        operators[i],
        uint96(quantities[i]),
        commissionRates[i]
      );
      assertEq(
        mainnetDelegationFacet.getAuthorizedClaimer(delegators[i]),
        claimers[i]
      );
    }
  }

  function _toDyn(
    address[32] memory arr
  ) internal returns (address[] memory res) {
    assembly ("memory-safe") {
      res := mload(0x40)
      mstore(0x40, add(res, mul(33, 0x20)))
      mstore(res, 32)
      pop(
        call(gas(), 0x04, 0, arr, mul(32, 0x20), add(res, 0x20), mul(32, 0x20))
      )
    }
  }

  function _toDyn(
    uint256[32] memory arr
  ) internal returns (uint256[] memory res) {
    assembly ("memory-safe") {
      res := mload(0x40)
      mstore(0x40, add(res, mul(33, 0x20)))
      mstore(res, 32)
      pop(
        call(gas(), 0x04, 0, arr, mul(32, 0x20), add(res, 0x20), mul(32, 0x20))
      )
    }
  }
}

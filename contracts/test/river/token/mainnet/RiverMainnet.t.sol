// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {ILockBase} from "contracts/src/tokens/lock/ILock.sol";
import {ITownsBase} from "contracts/src/tokens/towns/mainnet/ITowns.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

//libraries

//contracts
import {TestUtils} from "contracts/test/utils/TestUtils.sol";
import {EIP712Utils} from "contracts/test/utils/EIP712Utils.sol";
import {DeployTownsMainnet} from "contracts/scripts/deployments/utils/DeployTownsMainnet.s.sol";
import {Towns} from "contracts/src/tokens/towns/mainnet/Towns.sol";

contract TownsMainnetTest is TestUtils, EIP712Utils, ITownsBase, ILockBase {
  DeployTownsMainnet internal deployTownsMainnet = new DeployTownsMainnet();

  /// @dev initial supply is 10 billion tokens
  uint256 internal INITIAL_SUPPLY = 10_000_000_000 ether;

  address association;
  address vault;

  Towns towns;
  InflationConfig internal inflation;

  function setUp() public {
    towns = Towns(deployTownsMainnet.deploy());
    association = deployTownsMainnet.association();
    vault = deployTownsMainnet.vault();
    inflation = deployTownsMainnet.inflationConfig();
  }

  function test_init() external view {
    assertEq(towns.name(), "Towns");
    assertEq(towns.symbol(), "TOWNS");
    assertEq(towns.decimals(), 18);
    assertTrue(towns.supportsInterface(type(IERC20).interfaceId));
    assertTrue(towns.supportsInterface(type(IERC20Permit).interfaceId));
    assertTrue(towns.supportsInterface(type(IERC20Metadata).interfaceId));
    assertEq(towns.totalSupply(), INITIAL_SUPPLY);
  }

  modifier givenCallerHasTokens(address caller) {
    vm.assume(caller != address(0));
    vm.prank(deployTownsMainnet.vault());
    towns.transfer(caller, 100);
    _;
  }

  // Permit and Permit with Signature
  function test_allowance(
    address alice,
    address bob
  ) external givenCallerHasTokens(alice) {
    vm.assume(bob != address(0));

    assertEq(towns.allowance(alice, bob), 0);

    vm.prank(alice);
    towns.approve(bob, 50);

    assertEq(towns.allowance(alice, bob), 50);
  }

  function test_permit(address bob) external {
    vm.assume(bob != address(0));

    uint256 alicePrivateKey = _randomUint256();
    address alice = vm.addr(alicePrivateKey);

    vm.prank(deployTownsMainnet.vault());
    towns.transfer(alice, 100);

    vm.warp(block.timestamp + 100);

    uint256 deadline = block.timestamp + 100;
    (uint8 v, bytes32 r, bytes32 s) = signPermit(
      alicePrivateKey,
      address(towns),
      alice,
      bob,
      50,
      deadline
    );

    assertEq(towns.allowance(alice, bob), 0);

    vm.prank(bob);
    towns.permit(alice, bob, 50, deadline, v, r, s);

    assertEq(towns.allowance(alice, bob), 50);
  }

  // =============================================================
  //                           Delegation
  // =============================================================

  modifier givenCallerHasDelegated(address caller, address delegatee) {
    vm.assume(towns.delegates(caller) != delegatee);

    vm.prank(caller);
    towns.delegate(delegatee);
    assertEq(towns.delegates(caller), delegatee);
    _;
  }

  function test_revertWhen_delegateToZeroAddress(
    address alice
  ) external givenCallerHasTokens(alice) {
    vm.prank(alice);
    vm.expectRevert(DelegateeSameAsCurrent.selector);
    towns.delegate(address(0));
    assertEq(towns.delegates(alice), address(0));
  }

  function test_delegateToAddress(
    address delegator,
    address delegatee
  )
    external
    givenCallerHasTokens(delegator)
    givenCallerHasDelegated(delegator, delegatee)
  {
    assertEq(towns.delegates(delegator), delegatee);

    address[] memory delegators = towns.getDelegators();
    assertEq(delegators.length, 1);

    address found;
    for (uint256 i = 0; i < delegators.length; i++) {
      if (delegators[i] == delegator) {
        found = delegators[i];
        break;
      }
    }

    assertEq(found, delegator);
  }

  // =============================================================
  //                        createInflation  // =============================================================

  function test_revertWhen_createInflationIsCalledByOwnerTooSoon() external {
    // wait 5 days
    vm.warp(block.timestamp + 5 days);

    vm.prank(association);
    vm.expectRevert(MintingTooSoon.selector);
    towns.createInflation();
  }

  function test_createInflation_isCalledByOwnerAfterOneYear() external {
    uint256 deployedAt = block.timestamp;

    // wait 365 days
    vm.warp(block.timestamp + 365 days);

    uint256 inflationAmount = _getCurrentInflationAmount(
      deployedAt,
      towns.totalSupply()
    );

    uint256 expectedSupply = towns.totalSupply() + inflationAmount;

    vm.prank(association);
    towns.createInflation();

    assertEq(towns.totalSupply(), expectedSupply);
  }

  function test_createInflation_isCalledByOwnerAfter20Years() external {
    uint256 deployedAt = block.timestamp;

    // wait 365 days
    vm.warp(deployedAt + 7300 days);

    uint256 inflationAmount = _getCurrentInflationAmount(
      deployedAt,
      towns.totalSupply()
    );

    uint256 expectedSupply = towns.totalSupply() + inflationAmount;

    vm.prank(association);
    towns.createInflation();

    assertEq(towns.totalSupply(), expectedSupply);
  }

  function test_revertWhen_createInflationIsCalledByNotOwner(
    address notOwner
  ) external {
    vm.assume(notOwner != association);

    // wait 365 days
    vm.warp(block.timestamp + 365 days);

    vm.prank(notOwner);
    vm.expectRevert(
      abi.encodeWithSelector(
        Ownable.OwnableUnauthorizedAccount.selector,
        notOwner
      )
    );
    towns.createInflation();
  }

  function test_revertWhen_createInflationIsCalledWithAddressZero() external {
    vm.prank(association);
    vm.expectRevert(InvalidAddress.selector);
    towns.createInflation();
  }

  // =============================================================
  //                       Override Inflation
  // =============================================================
  function test_overrideInflation() external {
    // set to 1.5%
    uint256 overrideInflationRateBPS = 130;

    vm.prank(deployTownsMainnet.association());
    towns.setOverrideInflation(true, overrideInflationRateBPS);

    assertEq(towns.overrideInflationRate(), overrideInflationRateBPS);

    uint256 deployedAt = block.timestamp;

    // wait 365 days
    vm.warp(deployedAt + 365 days);

    uint256 inflationAmount = (towns.totalSupply() * overrideInflationRateBPS) /
      10000;

    uint256 expectedSupply = towns.totalSupply() + inflationAmount;

    vm.prank(deployTownsMainnet.association());
    towns.createInflation();

    assertEq(towns.totalSupply(), expectedSupply);
  }

  function test_revertWhen_overrideInflationRateIsGreaterThanFinalInflationRate()
    external
  {
    vm.prank(deployTownsMainnet.association());
    vm.expectRevert(InvalidInflationRate.selector);
    towns.setOverrideInflation(true, inflation.finalInflationRate + 1);
  }

  function test_revertWhen_overrideInflationIsCalledByNotOwner(
    address notOwner
  ) external {
    vm.assume(notOwner != association);

    vm.prank(notOwner);
    vm.expectRevert(
      abi.encodeWithSelector(
        Ownable.OwnableUnauthorizedAccount.selector,
        notOwner
      )
    );
    towns.setOverrideInflation(true, 100);
  }

  function test_setOverrideInflation_isSetToFalse() external {
    uint256 deployedAt = block.timestamp;

    vm.prank(association);
    towns.setOverrideInflation(true, 100);

    vm.prank(association);
    towns.setOverrideInflation(false, 0);

    // wait 365 days
    vm.warp(deployedAt + 365 days);

    uint256 inflationAmount = _getCurrentInflationAmount(
      deployedAt,
      towns.totalSupply()
    );

    uint256 expectedSupply = towns.totalSupply() + inflationAmount;

    vm.prank(association);
    towns.createInflation();

    assertEq(towns.totalSupply(), expectedSupply);
  }

  function _getCurrentInflationAmount(
    uint256 deployedAt,
    uint256 totalSupply
  ) internal view returns (uint256) {
    uint256 inflationRate = _getCurrentInflationRate(deployedAt);
    return (totalSupply * inflationRate) / 10000;
  }

  function _getCurrentInflationRate(
    uint256 deployedAt
  ) internal view returns (uint256) {
    uint256 yearsSinceDeployment = (block.timestamp - deployedAt) / 365 days;
    if (yearsSinceDeployment >= inflation.inflationDecreaseInterval)
      return inflation.finalInflationRate; // 2% final inflation rate
    uint256 decreatePerYear = inflation.inflationDecreaseRate /
      inflation.inflationDecreaseInterval;
    return
      inflation.initialInflationRate - (yearsSinceDeployment * decreatePerYear);
  }
}

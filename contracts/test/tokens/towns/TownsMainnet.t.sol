// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

//interfaces
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/interfaces/IERC20Metadata.sol";
import {ITownsBase} from "contracts/src/tokens/towns/mainnet/ITowns.sol";

//libraries
import {EIP712Utils} from "contracts/test/utils/EIP712Utils.sol";
import {BasisPoints} from "contracts/src/utils/libraries/BasisPoints.sol";

//contracts
import {DeployTownsMainnet} from "contracts/scripts/deployments/utils/DeployTownsMainnet.s.sol";
import {Towns} from "contracts/src/tokens/towns/mainnet/Towns.sol";

contract TownsMainnetTests is TestUtils, ITownsBase {
  DeployTownsMainnet internal deployTownsMainnet = new DeployTownsMainnet();

  /// @dev initial supply is 10 billion tokens
  uint256 internal INITIAL_SUPPLY = 10_000_000_000 ether;

  address internal vault;
  address internal manager;

  Towns towns;

  function setUp() external {
    towns = Towns(deployTownsMainnet.deploy());
    vault = deployTownsMainnet.vault();
    manager = deployTownsMainnet.manager();

    vm.warp(1_736_373_074); // Wednesday, January 8, 2025 9:51:14 PM
  }

  function test_init() external view {
    assertEq(towns.name(), "Towns");
    assertEq(towns.symbol(), "TOWNS");
    assertEq(towns.decimals(), 18);
    assertEq(towns.inflationReceiver(), vault);
    assertEq(towns.totalSupply(), INITIAL_SUPPLY);
    assertTrue(towns.supportsInterface(type(IERC20).interfaceId));
    assertTrue(towns.supportsInterface(type(IERC20Metadata).interfaceId));
  }

  modifier givenCallerHasTokens(address caller, uint256 amount) {
    vm.assume(caller != address(0));
    amount = bound(amount, 1, INITIAL_SUPPLY);
    vm.prank(vault);
    towns.transfer(caller, amount);
    _;
  }

  modifier givenCallerHasDelegated(address caller, address delegatee) {
    vm.assume(caller != address(0));
    vm.assume(delegatee != address(0));
    vm.assume(caller != delegatee);

    vm.prank(caller);
    towns.delegate(delegatee);
    assertEq(towns.delegates(caller), delegatee);
    _;
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           Inflation                        */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_createInflation() external {
    vm.warp(towns.lastMintTime() + 365 days);

    uint256 inflationRateBPS = towns.currentInflationRate();
    uint256 inflationAmount = BasisPoints.calculate(
      towns.totalSupply(),
      inflationRateBPS
    );

    vm.prank(vault);
    towns.createInflation();

    assertEq(towns.totalSupply(), INITIAL_SUPPLY + inflationAmount);
    assertEq(towns.lastMintTime(), block.timestamp);
  }

  function test_revertWhen_createInflation_mintingTooSoon() external {
    vm.prank(vault);
    vm.expectRevert(MintingTooSoon.selector);
    towns.createInflation();
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           Delegators                        */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function test_getDelegators(
    address alice,
    address bob,
    uint256 tokens
  )
    external
    givenCallerHasTokens(alice, tokens)
    givenCallerHasDelegated(alice, bob)
  {
    address[] memory delegators = towns.getDelegators();
    assertEq(delegators.length, 1);
    assertEq(delegators[0], alice);

    assertEq(towns.delegates(alice), bob);
  }
}

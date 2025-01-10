// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

//interfaces

//libraries
import {EIP712Utils} from "contracts/test/utils/EIP712Utils.sol";

//contracts
import {DeployTownsBase} from "contracts/scripts/deployments/utils/DeployTownsBase.s.sol";
import {Towns} from "contracts/src/tokens/towns/base/Towns.sol";

contract TownsBaseTest is TestUtils, EIP712Utils {
  DeployTownsBase internal deployTownsBase = new DeployTownsBase();

  Towns towns;

  address internal deployer;
  address internal bridge;

  function setUp() external {
    deployer = getDeployer();
    towns = Towns(deployTownsBase.deploy(deployer));
    bridge = deployTownsBase.bridgeBase();
  }

  modifier givenCallerHasBridgedTokens(address caller, uint256 amount) {
    vm.assume(caller != address(0));
    amount = bound(amount, 0, type(uint208).max);

    vm.prank(bridge);
    towns.mint(caller, amount);
    _;
  }

  modifier givenCallerDelegates(address caller, address delegate) {
    vm.assume(delegate != address(0));

    vm.prank(caller);
    towns.delegate(delegate);
    _;
  }

  function test_init() external view {
    assertEq(towns.owner(), address(deployer));
    assertEq(towns.name(), "Towns");
    assertEq(towns.symbol(), "TOWNS");
    assertEq(towns.decimals(), 18);
  }

  // Permit and Permit with Signature
  function test_allowance(
    address alice,
    uint256 amount,
    address bob
  ) public givenCallerHasBridgedTokens(alice, amount) {
    vm.assume(bob != address(0));

    assertEq(towns.allowance(alice, bob), 0);

    vm.prank(alice);
    towns.approve(bob, amount);

    assertEq(towns.allowance(alice, bob), amount);
  }

  function test_permit(
    uint256 alicePrivateKey,
    uint256 amount,
    address bob
  ) public {
    vm.assume(bob != address(0));
    amount = bound(amount, 1, type(uint208).max);

    alicePrivateKey = boundPrivateKey(alicePrivateKey);

    address alice = vm.addr(alicePrivateKey);

    vm.prank(bridge);
    towns.mint(alice, amount);

    vm.warp(block.timestamp + 100);

    uint256 deadline = block.timestamp + 100;
    (uint8 v, bytes32 r, bytes32 s) = signPermit(
      alicePrivateKey,
      address(towns),
      alice,
      bob,
      amount,
      deadline
    );

    assertEq(towns.allowance(alice, bob), 0);

    vm.prank(bob);
    towns.permit(alice, bob, amount, deadline, v, r, s);

    assertEq(towns.allowance(alice, bob), amount);
  }
}

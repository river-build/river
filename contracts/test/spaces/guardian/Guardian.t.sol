// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IGuardianBase} from "contracts/src/spaces/facets/guardian/IGuardian.sol";
import {IGuardian} from "contracts/src/spaces/facets/guardian/IGuardian.sol";

// libraries

// contracts
import {BaseSetup} from "contracts/test/spaces/BaseSetup.sol";
import {SimpleAccount} from "lib/account-abstraction/contracts/samples/SimpleAccount.sol";
contract GuardianTest is BaseSetup, IGuardianBase {
  IGuardian guardian;

  function setUp() public override {
    super.setUp();
    guardian = IGuardian(spaceOwner);
  }

  // guardian is enabled by default
  function test_isGuardianEnabled() external view {
    address wallet = _randomAddress();
    assertTrue(guardian.isGuardianEnabled(wallet));
  }

  function test_disableGuardian() external {
    address wallet = _randomAddress();

    vm.prank(wallet);
    guardian.disableGuardian();

    assertTrue(guardian.isGuardianEnabled(wallet));

    // wait for the cooldown to pass
    vm.warp(guardian.guardianCooldown(wallet));

    assertFalse(guardian.isGuardianEnabled(wallet));
  }

  function test_enableGuardian(address user) external {
    SimpleAccount account = _createSimpleAccount(user);
    address wallet = address(account);

    vm.prank(wallet);
    guardian.disableGuardian();

    // wait for the cooldown to pass
    vm.warp(guardian.guardianCooldown(wallet));

    assertFalse(guardian.isGuardianEnabled(wallet));

    vm.prank(wallet);
    guardian.enableGuardian();

    assertTrue(guardian.isGuardianEnabled(wallet));
  }

  function test_revert_disableGuardian_alreadyDisabled() external {
    address wallet = _randomAddress();

    vm.prank(wallet);
    guardian.disableGuardian();

    vm.prank(wallet);
    vm.expectRevert(Guardian_AlreadyDisabled.selector);
    guardian.disableGuardian();
  }

  function test_revert_enableGuardian_alreadyEnabled() external {
    address wallet = _randomAddress();

    vm.prank(wallet);
    vm.expectRevert(Guardian_AlreadyEnabled.selector);
    guardian.enableGuardian();
  }
}

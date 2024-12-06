// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";

import {LlamaAbsoluteStrategyBaseTest} from "@llama/test/strategies/absolute/LlamaAbsoluteStrategyBase.t.sol";
import {MockProtocol} from "@llama/test/mock/MockProtocol.sol";
import {Roles} from "@llama/test/utils/LlamaTestSetup.sol";

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {ActionInfo, PermissionData} from "@llama/src/lib/Structs.sol";
import {LlamaAbsoluteStrategyBase} from "@llama/src/strategies/absolute/LlamaAbsoluteStrategyBase.sol";

contract LlamaAbsoluteQuorumTest is LlamaAbsoluteStrategyBaseTest {}

contract ValidateActionCreation is LlamaAbsoluteQuorumTest {
  function createAbsoluteQuorumWithDisproportionateQuantity(
    bool isApproval,
    uint96 threshold,
    uint256 _roleQuantity,
    uint256 _otherRoleHolders
  ) internal returns (ILlamaStrategy testStrategy) {
    _roleQuantity = bound(_roleQuantity, 100, 1000);
    _otherRoleHolders = bound(_otherRoleHolders, 1, 10);

    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      address(this),
      uint96(_roleQuantity),
      type(uint64).max
    );

    generateAndSetRoleHolders(_otherRoleHolders);

    vm.prank(address(mpExecutor));
    mpCore.setStrategyLogicAuthorization(absoluteQuorumLogic, true);

    testStrategy = deployAbsoluteQuorum(
      uint8(Roles.TestRole1),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      false,
      isApproval ? threshold : 0,
      isApproval ? 0 : threshold,
      new uint8[](0),
      new uint8[](0)
    );

    PermissionData memory newPermission = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      testStrategy
    );

    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(uint8(Roles.TestRole1), newPermission, true);
  }

  function createStrategyWithNoSupplyRole(
    bool approval
  ) internal returns (uint8 noSupplyRole, ILlamaStrategy testStrategy) {
    // Getting a role with no supply currently and initializing it.
    noSupplyRole = mpPolicy.numRoles() + 1;
    initializeRolesUpTo(noSupplyRole);

    // Create the strategy with 0 (dis)approval threshold to not trigger `InvalidMinApprovals` error.
    if (approval) {
      testStrategy = deployAbsoluteQuorum(
        noSupplyRole,
        uint8(Roles.Disapprover),
        1 days,
        4 days,
        1 days,
        true,
        0,
        0,
        new uint8[](0),
        new uint8[](0)
      );
    } else {
      testStrategy = deployAbsoluteQuorum(
        uint8(Roles.Approver),
        noSupplyRole,
        1 days,
        4 days,
        1 days,
        true,
        0,
        0,
        new uint8[](0),
        new uint8[](0)
      );
    }
  }

  function mineBlockAndAssertRoleSupply(uint8 noSupplyRole) internal {
    // Moving timestamp ahead by 1 second
    mineBlock();

    // Verify that `noSupplyRole` has no supply at `action creation time - 1`.
    assertEq(
      mpPolicy.getPastRoleSupplyAsQuantitySum(
        noSupplyRole,
        block.timestamp - 1
      ),
      0
    );

    // Generate a new user so they have no checkpoint history (to ensure checkpoints are monotonically increasing).
    address newApprover = makeAddr("newApprover");
    // Assign 'noSupplyRole` at `action creation time` to the new user to make the role supply 1.
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(noSupplyRole, newApprover, 1, type(uint64).max);

    // Verify that `noSupplyRole` has supply of 1 at `action creation time`.
    assertEq(mpPolicy.getRoleSupplyAsQuantitySum(noSupplyRole), 1);
  }

  function expectRevertRoleHasZeroSupplyOnActionCreationValidation(
    uint8 noSupplyRole,
    ILlamaStrategy testStrategy
  ) internal {
    // Give the action creator the ability to use this strategy.
    PermissionData memory newPermission = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      testStrategy
    );
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(uint8(Roles.ActionCreator), newPermission, true);

    // Create the action.
    bytes memory data = abi.encodeCall(MockProtocol.pause, (true));
    vm.prank(actionCreatorAaron);
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaAbsoluteStrategyBase.RoleHasZeroSupply.selector,
        noSupplyRole
      )
    );
    mpCore.createAction(
      uint8(Roles.ActionCreator),
      testStrategy,
      address(mockProtocol),
      0,
      data,
      ""
    );
  }

  function testFuzz_RevertIf_NotEnoughApprovalQuantity(
    uint256 _otherRoleHolders
  ) external {
    _otherRoleHolders = bound(_otherRoleHolders, 1, 10);
    generateAndSetRoleHolders(_otherRoleHolders);

    // Assign role for action creation permission.
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      uint8(Roles.TestRole1),
      address(this),
      1,
      type(uint64).max
    );
    mineBlock();

    uint96 roleQuantity = mpPolicy.getRoleSupplyAsQuantitySum(
      uint8(Roles.TestRole1)
    );
    ILlamaStrategy testStrategy = deployAbsoluteQuorum(
      uint8(Roles.TestRole1),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      false,
      roleQuantity,
      1,
      new uint8[](0),
      new uint8[](0)
    );

    vm.startPrank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.TestRole1),
      PermissionData(address(mockProtocol), PAUSE_SELECTOR, testStrategy),
      true
    );
    // Removing role holder from an address created in `generateAndSetRoleHolders`.
    mpPolicy.setRoleHolder(uint8(Roles.TestRole1), address(uint160(100)), 0, 0);
    mineBlock();
    vm.stopPrank();

    vm.expectRevert(
      LlamaAbsoluteStrategyBase.InsufficientApprovalQuantity.selector
    );
    mpCore.createAction(
      uint8(Roles.TestRole1),
      testStrategy,
      address(mockProtocol),
      0,
      abi.encodeCall(MockProtocol.pause, (true)),
      ""
    );
  }

  function testFuzz_RevertIf_NotEnoughDisapprovalQuantity(
    uint256 _roleQuantity,
    uint256 _otherRoleHolders
  ) external {
    _roleQuantity = bound(_roleQuantity, 100, 1000);
    uint256 threshold = _roleQuantity / 2;

    ILlamaStrategy testStrategy = createAbsoluteQuorumWithDisproportionateQuantity(
        false,
        toUint96(threshold),
        _roleQuantity,
        _otherRoleHolders
      );

    vm.expectRevert(
      LlamaAbsoluteStrategyBase.InsufficientDisapprovalQuantity.selector
    );
    mpCore.createAction(
      uint8(Roles.TestRole1),
      testStrategy,
      address(mockProtocol),
      0,
      abi.encodeCall(MockProtocol.pause, (true)),
      ""
    );
  }

  function testFuzz_DisableDisapprovals(
    uint256 _roleQuantity,
    uint256 _otherRoleHolders
  ) external {
    ILlamaStrategy testStrategy = createAbsoluteQuorumWithDisproportionateQuantity(
        false,
        type(uint96).max,
        _roleQuantity,
        _otherRoleHolders
      );

    uint256 actionId = mpCore.createAction(
      uint8(Roles.TestRole1),
      testStrategy,
      address(mockProtocol),
      0,
      abi.encodeCall(MockProtocol.pause, (true)),
      ""
    );
    ActionInfo memory actionInfo = ActionInfo(
      actionId,
      address(this),
      uint8(Roles.TestRole1),
      testStrategy,
      address(mockProtocol),
      0,
      abi.encodeCall(MockProtocol.pause, (true))
    );

    vm.warp(block.timestamp + 1);

    mpCore.queueAction(actionInfo);

    vm.expectRevert(LlamaAbsoluteStrategyBase.DisapprovalDisabled.selector);

    mpCore.castDisapproval(uint8(Roles.TestRole1), actionInfo, "");
  }

  function test_RevertIf_ApprovalRoleHasZeroSupply() public {
    (
      uint8 noSupplyRole,
      ILlamaStrategy testStrategy
    ) = createStrategyWithNoSupplyRole(true);
    expectRevertRoleHasZeroSupplyOnActionCreationValidation(
      noSupplyRole,
      testStrategy
    );
  }

  function test_RevertIf_DisapprovalRoleHasZeroSupply() public {
    (
      uint8 noSupplyRole,
      ILlamaStrategy testStrategy
    ) = createStrategyWithNoSupplyRole(false);
    expectRevertRoleHasZeroSupplyOnActionCreationValidation(
      noSupplyRole,
      testStrategy
    );
  }

  function test_UsesApprovalRoleSupplyFromPreviousTimestamp() public {
    (
      uint8 noSupplyRole,
      ILlamaStrategy testStrategy
    ) = createStrategyWithNoSupplyRole(true);
    mineBlockAndAssertRoleSupply(noSupplyRole);
    // This reverts since supply of `noSupplyRole` at `action creation time - 1` is 0. This verifies that the strategy
    // uses the supply of `noSupplyRole` at `action creation time - 1` since `noSupplyRole` has a supply of 1 at `action
    // creation time`.
    expectRevertRoleHasZeroSupplyOnActionCreationValidation(
      noSupplyRole,
      testStrategy
    );
  }

  function test_UsesDisapprovalRoleSupplyFromPreviousTimestamp() public {
    (
      uint8 noSupplyRole,
      ILlamaStrategy testStrategy
    ) = createStrategyWithNoSupplyRole(false);
    mineBlockAndAssertRoleSupply(noSupplyRole);
    // This reverts since supply of `noSupplyRole` at `action creation time - 1` is 0. This verifies that the strategy
    // uses the supply of `noSupplyRole` at `action creation time - 1` since `noSupplyRole` has a supply of 1 at `action
    // creation time`.
    expectRevertRoleHasZeroSupplyOnActionCreationValidation(
      noSupplyRole,
      testStrategy
    );
  }
}

contract IsApprovalEnabled is LlamaAbsoluteQuorumTest {
  function test_PassesWhenCorrectRoleIsPassed() public {
    ILlamaStrategy testStrategy = deployAbsoluteQuorum(
      uint8(Roles.Approver),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      true,
      2,
      0,
      new uint8[](0),
      new uint8[](0)
    );
    ActionInfo memory actionInfo = createAction(testStrategy);
    testStrategy.checkIfApprovalEnabled(
      actionInfo,
      address(0),
      uint8(Roles.Approver)
    );
  }

  function test_RevertIf_WrongRoleIsPassed() public {
    ILlamaStrategy testStrategy = deployAbsoluteQuorum(
      uint8(Roles.Approver),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      true,
      2,
      0,
      new uint8[](0),
      new uint8[](0)
    );
    ActionInfo memory actionInfo = createAction(testStrategy);
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaAbsoluteStrategyBase.InvalidRole.selector,
        uint8(Roles.Approver)
      )
    );
    testStrategy.checkIfApprovalEnabled(
      actionInfo,
      address(0),
      uint8(Roles.TestRole1)
    );
  }

  function test_ActionCreatorCanApprove() public {
    ILlamaStrategy absoluteQuorum = deployAbsoluteQuorum(
      uint8(Roles.Approver),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      true,
      2,
      0,
      new uint8[](0),
      new uint8[](0)
    );
    ActionInfo memory actionInfo = createAction(absoluteQuorum);
    // function reverts if approval disabled, so it not reverting is behavior we are testing
    absoluteQuorum.checkIfApprovalEnabled(
      actionInfo,
      actionCreatorAaron,
      uint8(Roles.Approver)
    );
  }
}

contract IsDisapprovalEnabled is LlamaAbsoluteQuorumTest {
  function test_PassesWhenCorrectRoleIsPassed() public {
    ILlamaStrategy testStrategy = deployAbsoluteQuorum(
      uint8(Roles.Approver),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      true,
      2,
      0,
      new uint8[](0),
      new uint8[](0)
    );
    ActionInfo memory actionInfo = createAction(testStrategy);
    testStrategy.checkIfDisapprovalEnabled(
      actionInfo,
      address(0),
      uint8(Roles.Disapprover)
    );
  }

  function test_RevertIf_WrongRoleIsPassed() public {
    ILlamaStrategy testStrategy = deployAbsoluteQuorum(
      uint8(Roles.Approver),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      true,
      2,
      0,
      new uint8[](0),
      new uint8[](0)
    );
    ActionInfo memory actionInfo = createAction(testStrategy);
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaAbsoluteStrategyBase.InvalidRole.selector,
        uint8(Roles.Disapprover)
      )
    );
    testStrategy.checkIfDisapprovalEnabled(
      actionInfo,
      address(0),
      uint8(Roles.TestRole1)
    );
  }

  function test_ActionCreatorCanDisapprove() public {
    ILlamaStrategy absoluteQuorum = deployAbsoluteQuorum(
      uint8(Roles.Approver),
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      true,
      2,
      0,
      new uint8[](0),
      new uint8[](0)
    );
    ActionInfo memory actionInfo = createAction(absoluteQuorum);
    // function reverts if disapproval is disabled, so it not reverting is behavior we are testing
    absoluteQuorum.checkIfDisapprovalEnabled(
      actionInfo,
      actionCreatorAaron,
      uint8(Roles.Disapprover)
    );
  }
}

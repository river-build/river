// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";

import {LlamaAbsoluteStrategyBaseTest} from "@llama/test/strategies/absolute/LlamaAbsoluteStrategyBase.t.sol";
import {MockProtocol} from "@llama/test/mock/MockProtocol.sol";
import {Roles} from "@llama/test/utils/LlamaTestSetup.sol";

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {ActionInfo, PermissionData} from "@llama/src/lib/Structs.sol";
import {LlamaAbsolutePeerReview} from "@llama/src/strategies/absolute/LlamaAbsolutePeerReview.sol";
import {LlamaAbsoluteStrategyBase} from "@llama/src/strategies/absolute/LlamaAbsoluteStrategyBase.sol";

contract LlamaAbsolutePeerReviewTest is LlamaAbsoluteStrategyBaseTest {}

contract ValidateActionCreation is LlamaAbsolutePeerReviewTest {
  function createAbsolutePeerReviewWithDisproportionateQuantity(
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
    mpCore.setStrategyLogicAuthorization(absolutePeerReviewLogic, true);

    testStrategy = deployAbsolutePeerReview(
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
      testStrategy = deployAbsolutePeerReview(
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
      testStrategy = deployAbsolutePeerReview(
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
    PermissionData memory permissionData = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      testStrategy
    );
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(
      uint8(Roles.ActionCreator),
      permissionData,
      true
    );

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
    uint256 _roleQuantity,
    uint256 _otherRoleHolders
  ) external {
    _roleQuantity = bound(_roleQuantity, 100, 1000);
    uint256 threshold = _roleQuantity / 2;
    ILlamaStrategy testStrategy = createAbsolutePeerReviewWithDisproportionateQuantity(
        true,
        toUint96(threshold),
        _roleQuantity,
        _otherRoleHolders
      );

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

  function test_UsesActionCreatorApprovalRoleQtyFromPreviousTimestamp() public {
    // Generate new user so they have no checkpoint history (to ensure checkpoints are monotonically increasing).
    address newActionCreator = makeAddr("newActionCreator");

    uint96 minApprovals = 2;

    // Getting a role with no supply currently and initializing it.
    uint8 newActionCreatorRole = mpPolicy.numRoles() + 1;
    initializeRolesUpTo(newActionCreatorRole);

    // Giving newActionCreator quantity of 5 at `action creation time - 1`. It is also the only holder of the role.
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      newActionCreatorRole,
      newActionCreator,
      5,
      type(uint64).max
    );

    // Moving timestamp ahead by 1 second
    mineBlock();

    // Giving newActionCreator quantity of 2 at `action creation time`. It is also the only holder of the role.
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      newActionCreatorRole,
      newActionCreator,
      2,
      type(uint64).max
    );

    // New AbsolutePeerReview strategy with `minApprovals` of 2 and Approval role of `newActionCreatorRole`.
    ILlamaStrategy testStrategy = deployAbsolutePeerReview(
      newActionCreatorRole,
      uint8(Roles.Disapprover),
      1 days,
      4 days,
      1 days,
      false,
      minApprovals,
      0,
      new uint8[](0),
      new uint8[](0)
    );

    // Give the action creator the ability to use this strategy.
    PermissionData memory permissionData = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      testStrategy
    );
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(newActionCreatorRole, permissionData, true);

    // 2 > (5 - 5). So, the strategy should revert.
    assertGt(
      minApprovals,
      mpPolicy.getPastRoleSupplyAsQuantitySum(
        newActionCreatorRole,
        block.timestamp - 1
      ) -
        mpPolicy.getPastQuantity(
          newActionCreator,
          newActionCreatorRole,
          block.timestamp - 1
        )
    );
    // 2 < (5 - 2). So, the strategy should not revert if there was a bug.
    assertLt(
      minApprovals,
      mpPolicy.getPastRoleSupplyAsQuantitySum(
        newActionCreatorRole,
        block.timestamp - 1
      ) - mpPolicy.getQuantity(newActionCreator, newActionCreatorRole)
    );
    // The below assertion verifies that the strategy uses the approval quantity of `newActionCreator` at
    // `actionCreationTime - 1` and it leads to triggering the `InsufficientApprovalQuantity` error. This error would
    // not have been triggered if the strategy uses the approval quantity of `newActionCreator` at `actionCreationTime`.
    vm.prank(newActionCreator);
    vm.expectRevert(
      LlamaAbsoluteStrategyBase.InsufficientApprovalQuantity.selector
    );
    mpCore.createAction(
      newActionCreatorRole,
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

    ILlamaStrategy testStrategy = createAbsolutePeerReviewWithDisproportionateQuantity(
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

  function test_UsesActionCreatorDisapprovalRoleQtyFromPreviousTimestamp()
    public
  {
    // Generate new user so they have no checkpoint history (to ensure checkpoints are monotonically increasing).
    address newActionCreator = makeAddr("newActionCreator");

    uint96 minDisapprovals = 2;

    // Getting a role with no supply currently and initializing it.
    uint8 newActionCreatorRole = mpPolicy.numRoles() + 1;
    initializeRolesUpTo(newActionCreatorRole);

    // Giving newActionCreator quantity of 5 at `action creation time - 1`. It is also the only holder of the role.
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      newActionCreatorRole,
      newActionCreator,
      5,
      type(uint64).max
    );

    // Moving timestamp ahead by 1 second
    mineBlock();

    // Giving newActionCreator quantity of 2 at `action creation time`. It is also the only holder of the role.
    vm.prank(address(mpExecutor));
    mpPolicy.setRoleHolder(
      newActionCreatorRole,
      newActionCreator,
      2,
      type(uint64).max
    );

    // New AbsolutePeerReview strategy with `minApprovals` of 2 and Approval role of `newActionCreatorRole`.
    ILlamaStrategy testStrategy = deployAbsolutePeerReview(
      uint8(Roles.Approver),
      newActionCreatorRole,
      1 days,
      4 days,
      1 days,
      false,
      0,
      minDisapprovals,
      new uint8[](0),
      new uint8[](0)
    );

    // Give the action creator the ability to use this strategy.
    PermissionData memory permissionData = PermissionData(
      address(mockProtocol),
      PAUSE_SELECTOR,
      testStrategy
    );
    vm.prank(address(mpExecutor));
    mpPolicy.setRolePermission(newActionCreatorRole, permissionData, true);

    // 2 > (5 - 5). So, the strategy should revert.
    assertGt(
      minDisapprovals,
      mpPolicy.getPastRoleSupplyAsQuantitySum(
        newActionCreatorRole,
        block.timestamp - 1
      ) -
        mpPolicy.getPastQuantity(
          newActionCreator,
          newActionCreatorRole,
          block.timestamp - 1
        )
    );
    // 2 < (5 - 2). So, the strategy should not revert if there was a bug.
    assertLt(
      minDisapprovals,
      mpPolicy.getPastRoleSupplyAsQuantitySum(
        newActionCreatorRole,
        block.timestamp - 1
      ) - mpPolicy.getQuantity(newActionCreator, newActionCreatorRole)
    );
    // The below assertion verifies that the strategy uses the disapproval quantity of `newActionCreator` at
    // `actionCreationTime - 1` and it leads to triggering the `InsufficientDisapprovalQuantity` error. This error would
    // not have been triggered if the strategy uses the disapproval quantity of `newActionCreator` at
    // `actionCreationTime`.
    vm.prank(newActionCreator);
    vm.expectRevert(
      LlamaAbsoluteStrategyBase.InsufficientDisapprovalQuantity.selector
    );
    mpCore.createAction(
      newActionCreatorRole,
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
    ILlamaStrategy testStrategy = createAbsolutePeerReviewWithDisproportionateQuantity(
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

contract IsApprovalEnabled is LlamaAbsolutePeerReviewTest {
  function test_PassesWhenCorrectRoleIsPassed() public {
    ILlamaStrategy absolutePeerReview = deployAbsolutePeerReview(
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
    ActionInfo memory actionInfo = createAction(absolutePeerReview);
    absolutePeerReview.checkIfApprovalEnabled(
      actionInfo,
      address(0),
      uint8(Roles.Approver)
    );
  }

  function test_RevertIf_WrongRoleIsPassed() public {
    ILlamaStrategy absolutePeerReview = deployAbsolutePeerReview(
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
    ActionInfo memory actionInfo = createAction(absolutePeerReview);
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaAbsoluteStrategyBase.InvalidRole.selector,
        uint8(Roles.Approver)
      )
    );
    absolutePeerReview.checkIfApprovalEnabled(
      actionInfo,
      address(0),
      uint8(Roles.TestRole1)
    );
  }

  function test_ActionCreatorCannotApprove() public {
    ILlamaStrategy absolutePeerReview = deployAbsolutePeerReview(
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
    ActionInfo memory actionInfo = createAction(absolutePeerReview);
    vm.expectRevert(LlamaAbsolutePeerReview.ActionCreatorCannotCast.selector);
    absolutePeerReview.checkIfApprovalEnabled(
      actionInfo,
      actionCreatorAaron,
      uint8(Roles.Approver)
    );
  }
}

contract IsDisapprovalEnabled is LlamaAbsolutePeerReviewTest {
  function test_PassesWhenCorrectRoleIsPassed() public {
    ILlamaStrategy absolutePeerReview = deployAbsolutePeerReview(
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
    ActionInfo memory actionInfo = createAction(absolutePeerReview);
    absolutePeerReview.checkIfDisapprovalEnabled(
      actionInfo,
      address(0),
      uint8(Roles.Disapprover)
    );
  }

  function test_RevertIf_WrongRoleIsPassed() public {
    ILlamaStrategy absolutePeerReview = deployAbsolutePeerReview(
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
    ActionInfo memory actionInfo = createAction(absolutePeerReview);
    vm.expectRevert(
      abi.encodeWithSelector(
        LlamaAbsoluteStrategyBase.InvalidRole.selector,
        uint8(Roles.Disapprover)
      )
    );
    absolutePeerReview.checkIfDisapprovalEnabled(
      actionInfo,
      address(0),
      uint8(Roles.TestRole1)
    );
  }

  function test_ActionCreatorCannotDisapprove() public {
    ILlamaStrategy absolutePeerReview = deployAbsolutePeerReview(
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
    ActionInfo memory actionInfo = createAction(absolutePeerReview);
    vm.expectRevert(LlamaAbsolutePeerReview.ActionCreatorCannotCast.selector);
    absolutePeerReview.checkIfDisapprovalEnabled(
      actionInfo,
      actionCreatorAaron,
      uint8(Roles.Disapprover)
    );
  }
}

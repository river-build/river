// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaAbsoluteStrategyBase} from "@llama/src/strategies/absolute/LlamaAbsoluteStrategyBase.sol";
import {ActionInfo} from "@llama/src/lib/Structs.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

/// @title Llama Absolute Quorum Strategy
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice This is a Llama strategy which has the following properties:
///   - Approval/disapproval thresholds are specified as absolute numbers.
///   - Action creators are allowed to cast approvals or disapprovals on their own actions within this strategy.
///   - Role quantity is used to determine the approval and disapproval weight of a policyholder's cast.
contract LlamaAbsoluteQuorum is LlamaAbsoluteStrategyBase {
  // -------- At Action Creation --------

  /// @inheritdoc ILlamaStrategy
  function validateActionCreation(
    ActionInfo calldata /* actionInfo */
  ) external view override {
    LlamaPolicy llamaPolicy = policy; // Reduce SLOADs.
    uint256 checkpointTime = block.timestamp - 1;

    uint256 approvalPolicySupply = llamaPolicy.getPastRoleSupplyAsQuantitySum(
      approvalRole,
      checkpointTime
    );
    if (approvalPolicySupply == 0) revert RoleHasZeroSupply(approvalRole);

    uint256 disapprovalPolicySupply = llamaPolicy
      .getPastRoleSupplyAsQuantitySum(disapprovalRole, checkpointTime);
    if (disapprovalPolicySupply == 0) revert RoleHasZeroSupply(disapprovalRole);

    if (minApprovals > approvalPolicySupply)
      revert InsufficientApprovalQuantity();
    if (
      minDisapprovals != type(uint96).max &&
      minDisapprovals > disapprovalPolicySupply
    ) {
      revert InsufficientDisapprovalQuantity();
    }
  }

  // -------- When Casting Approval --------

  /// @inheritdoc ILlamaStrategy
  function checkIfApprovalEnabled(
    ActionInfo calldata,
    /* actionInfo */ address,
    /* policyholder */ uint8 role
  ) external view override {
    if (role != approvalRole && !forceApprovalRole[role])
      revert InvalidRole(approvalRole);
  }

  // -------- When Casting Disapproval --------

  /// @inheritdoc ILlamaStrategy
  function checkIfDisapprovalEnabled(
    ActionInfo calldata,
    /* actionInfo */ address,
    /* policyholder */ uint8 role
  ) external view override {
    if (minDisapprovals == type(uint96).max) revert DisapprovalDisabled();
    if (role != disapprovalRole && !forceDisapprovalRole[role])
      revert InvalidRole(disapprovalRole);
  }
}

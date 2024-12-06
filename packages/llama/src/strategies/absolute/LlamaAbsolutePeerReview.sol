// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaAbsoluteStrategyBase} from "@llama/src/strategies/absolute/LlamaAbsoluteStrategyBase.sol";
import {ActionInfo} from "@llama/src/lib/Structs.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

/// @title Llama Absolute Peer Review Strategy
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice This is a Llama strategy which has the following properties:
///   - Approval/disapproval thresholds are specified as absolute numbers.
///   - Action creators are not allowed to cast approvals or disapprovals on their own actions,
///     regardless of the roles they hold.
///   - By not allowing action creators to cast approvals or disapprovals on their own actions,
///     this strategy is useful for when a group of policyholders have permission to both create
///     and approve an action. You can design a strategy where anyone in this group can propose
///     but they need N number of approvals from their peers in this group for the action to be
///     approved.
///   - Role quantity is used to determine the approval and disapproval weight of a policyholder's cast.
contract LlamaAbsolutePeerReview is LlamaAbsoluteStrategyBase {
  /// @dev The action creator cannot approve or disapprove an action.
  error ActionCreatorCannotCast();

  // -------- At Action Creation --------

  /// @inheritdoc ILlamaStrategy
  function validateActionCreation(
    ActionInfo calldata actionInfo
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

    unchecked {
      // Safety: We check the supply of the role above, and this supply is inclusive of the quantity
      // held by the action creator. Therefore we can reduce the total supply by the quantity held by
      // the action creator without overflow, since a policyholder can never have a quantity greater than
      // the total supply.
      uint256 actionCreatorApprovalRoleQty = llamaPolicy.getPastQuantity(
        actionInfo.creator,
        approvalRole,
        checkpointTime
      );
      if (minApprovals > approvalPolicySupply - actionCreatorApprovalRoleQty)
        revert InsufficientApprovalQuantity();

      uint256 actionCreatorDisapprovalRoleQty = llamaPolicy.getPastQuantity(
        actionInfo.creator,
        disapprovalRole,
        checkpointTime
      );
      if (
        minDisapprovals != type(uint96).max &&
        minDisapprovals >
        disapprovalPolicySupply - actionCreatorDisapprovalRoleQty
      ) revert InsufficientDisapprovalQuantity();
    }
  }

  // -------- When Casting Approval --------

  /// @inheritdoc ILlamaStrategy
  function checkIfApprovalEnabled(
    ActionInfo calldata actionInfo,
    address policyholder,
    uint8 role
  ) external view override {
    if (actionInfo.creator == policyholder) revert ActionCreatorCannotCast();
    if (role != approvalRole && !forceApprovalRole[role])
      revert InvalidRole(approvalRole);
  }

  // -------- When Casting Disapproval --------

  /// @inheritdoc ILlamaStrategy
  function checkIfDisapprovalEnabled(
    ActionInfo calldata actionInfo,
    address policyholder,
    uint8 role
  ) external view override {
    if (minDisapprovals == type(uint96).max) revert DisapprovalDisabled();
    if (actionInfo.creator == policyholder) revert ActionCreatorCannotCast();
    if (role != disapprovalRole && !forceDisapprovalRole[role])
      revert InvalidRole(disapprovalRole);
  }
}

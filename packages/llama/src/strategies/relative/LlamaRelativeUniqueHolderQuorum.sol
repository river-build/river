// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {ActionInfo} from "@llama/src/lib/Structs.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";

import {LlamaRelativeStrategyBase} from "@llama/src/strategies/relative/LlamaRelativeStrategyBase.sol";

/// @title Llama Relative Unique Holder Quorum Strategy
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice This is a Llama strategy which has the following properties:
///   - Approval/disapproval thresholds are specified as percentages of total supply.
///   - Action creators are allowed to cast approvals or disapprovals on their own actions within this strategy.
///   - The approval and disapproval role holder supplies are saved at action creation time and used to calculate that
///     action's quorum.
///   - Policyholders with the corresponding approval or disapproval role have a cast weight of 1.
contract LlamaRelativeUniqueHolderQuorum is LlamaRelativeStrategyBase {
  // -------- When Casting Approval --------

  /// @inheritdoc ILlamaStrategy
  function getApprovalQuantityAt(
    address policyholder,
    uint8 role,
    uint256 timestamp
  ) external view override returns (uint96) {
    if (role != approvalRole && !forceApprovalRole[role]) return 0;
    uint96 quantity = policy.getPastQuantity(policyholder, role, timestamp);
    if (quantity == 0) return 0;
    return forceApprovalRole[role] ? type(uint96).max : 1;
  }

  // -------- When Casting Disapproval --------

  /// @inheritdoc ILlamaStrategy
  function getDisapprovalQuantityAt(
    address policyholder,
    uint8 role,
    uint256 timestamp
  ) external view override returns (uint96) {
    if (role != disapprovalRole && !forceDisapprovalRole[role]) return 0;
    uint96 quantity = policy.getPastQuantity(policyholder, role, timestamp);
    if (quantity == 0) return 0;
    return forceDisapprovalRole[role] ? type(uint96).max : 1;
  }

  // -------- At Action Creation and When Determining Action State --------

  /// @inheritdoc LlamaRelativeStrategyBase
  function getApprovalSupply(
    ActionInfo calldata actionInfo
  ) public view override returns (uint96) {
    uint256 creationTime = llamaCore.getAction(actionInfo.id).creationTime;
    if (creationTime == 0) revert InvalidActionInfo();
    return
      policy.getPastRoleSupplyAsNumberOfHolders(approvalRole, creationTime - 1);
  }

  /// @inheritdoc LlamaRelativeStrategyBase
  function getDisapprovalSupply(
    ActionInfo calldata actionInfo
  ) public view override returns (uint96) {
    uint256 creationTime = llamaCore.getAction(actionInfo.id).creationTime;
    if (creationTime == 0) revert InvalidActionInfo();
    return
      policy.getPastRoleSupplyAsNumberOfHolders(
        disapprovalRole,
        creationTime - 1
      );
  }
}

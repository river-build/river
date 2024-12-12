// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {FixedPointMathLib} from "@solady/utils/FixedPointMathLib.sol";

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {ActionState} from "@llama/src/lib/Enums.sol";
import {LlamaUtils} from "@llama/src/lib/LlamaUtils.sol";
import {Action, ActionInfo} from "@llama/src/lib/Structs.sol";
import {LlamaAbsoluteStrategyBase} from "@llama/src/strategies/absolute/LlamaAbsoluteStrategyBase.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

/// @title MockPoorlyImplementedAbsolutePeerReview
/// @author Llama (devsdosomething@llama.xyz)
/// @notice This is the absolute strategy copy and pasted with lines 178 & 194 commented out so we can reach the
/// ApprovalQuantityZero error
contract MockPoorlyImplementedAbsolutePeerReview is
  ILlamaStrategy,
  Initializable
{
  // ======================================
  // ======== Errors and Modifiers ========
  // ======================================

  error ActionCreatorCannotCast();
  error CannotCancelInState(ActionState state);
  error DisapprovalDisabled();
  error InsufficientApprovalQuantity();
  error InsufficientDisapprovalQuantity();
  error InvalidMinApprovals(uint256 minApprovals);
  error InvalidRole(uint8 role);
  error OnlyActionCreator();
  error RoleHasZeroSupply(uint8 role);
  error RoleNotInitialized(uint8 role);

  // ========================
  // ======== Events ========
  // ========================

  event ForceApprovalRoleAdded(uint8 role);
  event ForceDisapprovalRoleAdded(uint8 role);
  event StrategyCreated(LlamaCore llamaCore, LlamaPolicy policy);

  // =============================================================
  // ======== Constants, Immutables and Storage Variables ========
  // =============================================================

  // -------- Interface Requirements --------

  /// @inheritdoc ILlamaStrategy
  LlamaCore public llamaCore;

  /// @inheritdoc ILlamaStrategy
  LlamaPolicy public policy;

  // -------- Strategy Configuration --------

  /// @notice If false, action be queued before approvalEndTime.
  bool public isFixedLengthApprovalPeriod;

  /// @notice Length of approval period in seconds.
  uint64 public approvalPeriod;

  /// @notice Minimum time, in seconds, between queueing and execution of action.
  uint64 public queuingPeriod;

  /// @notice Time, in seconds, after executionTime that action can be executed before permanently expiring.
  uint64 public expirationPeriod;

  /// @notice Minimum total quantity of approvals for the action to be queued.
  /// @dev We use a `uint96` here since quantities are stored as `uint96` in the policy.
  uint96 public minApprovals;

  /// @notice Minimum total quantity of disapprovals for the action to be canceled.
  /// @dev We use a `uint96` here since quantities are stored as `uint96` in the policy.
  uint96 public minDisapprovals;

  /// @notice The role that can approve an action.
  uint8 public approvalRole;

  /// @notice The role that can disapprove an action.
  uint8 public disapprovalRole;

  /// @notice Mapping of roles that can force an action to be approved.
  mapping(uint8 => bool) public forceApprovalRole;

  /// @notice Mapping of roles that can force an action to be disapproved.
  mapping(uint8 => bool) public forceDisapprovalRole;

  // =============================
  // ======== Constructor ========
  // =============================

  constructor() {
    _disableInitializers();
  }

  // ==========================================
  // ======== Interface Implementation ========
  // ==========================================

  // -------- At Strategy Creation --------

  /// @inheritdoc ILlamaStrategy
  function initialize(bytes memory config) external initializer returns (bool) {
    LlamaAbsoluteStrategyBase.Config memory strategyConfig = abi.decode(
      config,
      (LlamaAbsoluteStrategyBase.Config)
    );
    llamaCore = LlamaCore(msg.sender);
    policy = llamaCore.policy();
    queuingPeriod = strategyConfig.queuingPeriod;
    expirationPeriod = strategyConfig.expirationPeriod;
    isFixedLengthApprovalPeriod = strategyConfig.isFixedLengthApprovalPeriod;
    approvalPeriod = strategyConfig.approvalPeriod;

    if (
      strategyConfig.minApprovals >
      policy.getRoleSupplyAsQuantitySum(strategyConfig.approvalRole)
    ) {
      revert InvalidMinApprovals(strategyConfig.minApprovals);
    }

    minApprovals = strategyConfig.minApprovals;
    minDisapprovals = strategyConfig.minDisapprovals;

    uint8 numRoles = policy.numRoles();

    approvalRole = strategyConfig.approvalRole;
    _assertValidRole(approvalRole, numRoles);

    disapprovalRole = strategyConfig.disapprovalRole;
    _assertValidRole(disapprovalRole, numRoles);

    for (
      uint256 i = 0;
      i < strategyConfig.forceApprovalRoles.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      uint8 role = strategyConfig.forceApprovalRoles[i];
      _assertValidRole(role, numRoles);
      forceApprovalRole[role] = true;
      emit ForceApprovalRoleAdded(role);
    }

    for (
      uint256 i = 0;
      i < strategyConfig.forceDisapprovalRoles.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      uint8 role = strategyConfig.forceDisapprovalRoles[i];
      _assertValidRole(role, numRoles);
      forceDisapprovalRole[role] = true;
      emit ForceDisapprovalRoleAdded(role);
    }

    emit StrategyCreated(llamaCore, policy);

    return true;
  }

  // -------- At Action Creation --------

  /// @inheritdoc ILlamaStrategy
  function validateActionCreation(
    ActionInfo calldata actionInfo
  ) external view {
    uint256 approvalPolicySupply = policy.getRoleSupplyAsQuantitySum(
      approvalRole
    );
    if (approvalPolicySupply == 0) revert RoleHasZeroSupply(approvalRole);

    uint256 disapprovalPolicySupply = policy.getRoleSupplyAsQuantitySum(
      disapprovalRole
    );
    if (disapprovalPolicySupply == 0) revert RoleHasZeroSupply(disapprovalRole);

    // If the action creator has the approval or disapproval role, reduce the total supply by 1.
    unchecked {
      // Safety: We check the supply of the role above, and this supply is inclusive of the quantity
      // held by the action creator. Therefore we can reduce the total supply by the quantity held by
      // the action creator without overflow, since a policyholder can never have a quantity greater than
      // the total supply.
      uint256 actionCreatorApprovalRoleQty = policy.getQuantity(
        actionInfo.creator,
        approvalRole
      );
      if (minApprovals > approvalPolicySupply - actionCreatorApprovalRoleQty)
        revert InsufficientApprovalQuantity();

      uint256 actionCreatorDisapprovalRoleQty = policy.getQuantity(
        actionInfo.creator,
        disapprovalRole
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
  ) external pure {
    // if (actionInfo.creator == policyholder) revert ActionCreatorCannotCast();
    // if (role != approvalRole && !forceApprovalRole[role]) revert InvalidRole(actionInfo.creatorRole);
  }

  /// @inheritdoc ILlamaStrategy
  function getApprovalQuantityAt(
    address policyholder,
    uint8 role,
    uint256 timestamp
  ) external view returns (uint96) {
    if (role != approvalRole && !forceApprovalRole[role]) return 0;
    uint96 quantity = policy.getPastQuantity(policyholder, role, timestamp);
    return
      quantity > 0 && forceApprovalRole[role] ? type(uint96).max : quantity;
  }

  // -------- When Casting Disapproval --------

  /// @inheritdoc ILlamaStrategy
  function checkIfDisapprovalEnabled(
    ActionInfo calldata actionInfo,
    address policyholder,
    uint8 role
  ) external view {
    // if (minDisapprovals == type(uint96).max) revert DisapprovalDisabled();
    // if (actionInfo.creator == policyholder) revert ActionCreatorCannotCast();
    // if (role != disapprovalRole && !forceDisapprovalRole[role]) revert InvalidRole(actionInfo.creatorRole);
  }

  /// @inheritdoc ILlamaStrategy
  function getDisapprovalQuantityAt(
    address policyholder,
    uint8 role,
    uint256 timestamp
  ) external view returns (uint96) {
    if (role != disapprovalRole && !forceDisapprovalRole[role]) return 0;
    uint96 quantity = policy.getPastQuantity(policyholder, role, timestamp);
    return
      quantity > 0 && forceDisapprovalRole[role] ? type(uint96).max : quantity;
  }

  // -------- When Queueing --------

  /// @inheritdoc ILlamaStrategy
  function minExecutionTime(
    ActionInfo calldata
  ) external view returns (uint64) {
    return LlamaUtils.toUint64(block.timestamp + queuingPeriod);
  }

  // -------- When Canceling --------

  /// @inheritdoc ILlamaStrategy
  function validateActionCancelation(
    ActionInfo calldata actionInfo,
    address caller
  ) external view {
    // The rules for cancelation are:
    //   1. The action cannot be canceled if it's state is any of the following: Executed, Canceled,
    //      Expired, Failed.
    //   2. For all other states (Active, Approved, Queued) the action can be canceled if the caller
    //      is the action creator.

    // Check 1.
    ActionState state = llamaCore.getActionState(actionInfo);
    if (
      state == ActionState.Executed ||
      state == ActionState.Canceled ||
      state == ActionState.Expired ||
      state == ActionState.Failed
    ) revert CannotCancelInState(state);

    // Check 2.
    if (caller != actionInfo.creator) revert OnlyActionCreator();
  }

  // -------- When Determining Action State --------

  /// @inheritdoc ILlamaStrategy
  function isActionActive(
    ActionInfo calldata actionInfo
  ) external view returns (bool) {
    return
      block.timestamp <= approvalEndTime(actionInfo) &&
      (isFixedLengthApprovalPeriod || !isActionApproved(actionInfo));
  }

  /// @inheritdoc ILlamaStrategy
  function isActionApproved(
    ActionInfo calldata actionInfo
  ) public view returns (bool) {
    Action memory action = llamaCore.getAction(actionInfo.id);
    return action.totalApprovals >= minApprovals;
  }

  /// @inheritdoc ILlamaStrategy
  function isActionDisapproved(
    ActionInfo calldata actionInfo
  ) public view returns (bool) {
    Action memory action = llamaCore.getAction(actionInfo.id);
    return action.totalDisapprovals >= minDisapprovals;
  }

  /// @inheritdoc ILlamaStrategy
  function isActionExpired(
    ActionInfo calldata actionInfo
  ) external view returns (bool) {
    Action memory action = llamaCore.getAction(actionInfo.id);
    return block.timestamp > action.minExecutionTime + expirationPeriod;
  }

  // ========================================
  // ======== Other Public Functions ========
  // ========================================

  /// @notice Returns the timestamp at which the approval period ends.
  function approvalEndTime(
    ActionInfo calldata actionInfo
  ) public view returns (uint256) {
    Action memory action = llamaCore.getAction(actionInfo.id);
    return action.creationTime + approvalPeriod;
  }

  // ================================
  // ======== Internal Logic ========
  // ================================

  /// @dev Reverts if the given `role` is greater than `numRoles`.
  function _assertValidRole(uint8 role, uint8 numRoles) internal pure {
    if (role > numRoles) revert RoleNotInitialized(role);
  }
}

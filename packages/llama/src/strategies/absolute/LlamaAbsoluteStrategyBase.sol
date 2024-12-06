// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {ActionState} from "@llama/src/lib/Enums.sol";
import {LlamaUtils} from "@llama/src/lib/LlamaUtils.sol";
import {Action, ActionInfo} from "@llama/src/lib/Structs.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

/// @title Llama Absolute Strategy Base
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice This is a base contract for Llama strategies to inherit which has the following properties:
///   - Approval/disapproval thresholds are specified as absolute numbers.
///   - The `validateActionCreation`, `checkIfApprovalEnabled`, and `checkIfDisapprovalEnabled` methods are left up to
///     the implementing contract to determine the rest of the behavior.
///   - All methods are marked virtual in case future strategies need to override them.
abstract contract LlamaAbsoluteStrategyBase is ILlamaStrategy, Initializable {
  // =========================
  // ======== Structs ========
  // =========================

  /// @dev Llama strategy initialization configuration.
  struct Config {
    uint64 approvalPeriod; // The length of time of the approval period.
    uint64 queuingPeriod; // The length of time of the queuing period. The disapproval period is the queuing period when
    // enabled.
    uint64 expirationPeriod; // The length of time an action can be executed before it expires.
    uint96 minApprovals; // Minimum number of total approval quantity.
    uint96 minDisapprovals; // Minimum number of total disapproval quantity.
    bool isFixedLengthApprovalPeriod; // Determines if an action be queued before approvalEndTime.
    uint8 approvalRole; // Anyone with this role can cast approval of an action.
    uint8 disapprovalRole; // Anyone with this role can cast disapproval of an action.
    uint8[] forceApprovalRoles; // Anyone with this role can single-handedly approve an action.
    uint8[] forceDisapprovalRoles; // Anyone with this role can single-handedly disapprove an action.
  }

  // ========================
  // ======== Errors ========
  // ========================

  /// @dev The action cannot be canceled if it's already in a terminal state.
  /// @param currentState The current state of the action.
  error CannotCancelInState(ActionState currentState);

  /// @dev The strategy has disabled disapprovals.
  error DisapprovalDisabled();

  /// @dev The action cannot be created because approval quorum is not possible.
  error InsufficientApprovalQuantity();

  /// @dev The action cannot be created because disapproval quorum is not possible.
  error InsufficientDisapprovalQuantity();

  /// @dev The action cannot be created because the quantity of approvals required are greater than the role supply.
  /// @param minApprovals The provided minApprovals.
  error InvalidMinApprovals(uint256 minApprovals);

  /// @dev The role is not eligible to participate in this strategy in the specified way.
  /// @param role The role being used.
  error InvalidRole(uint8 role);

  /// @dev Only the action creator can cancel an action.
  error OnlyActionCreator();

  /// @dev The action cannot be created if the approval or disapproval supply is 0.
  /// @param role The role being used.
  error RoleHasZeroSupply(uint8 role);

  /// @dev The provided role is not initialized by the `LlamaPolicy`.
  /// @param role The role being used.
  error RoleNotInitialized(uint8 role);

  // =================================================
  // ======== Constants and Storage Variables ========
  // =================================================

  // -------- Interface Requirements --------

  /// @inheritdoc ILlamaStrategy
  LlamaCore public llamaCore;

  /// @inheritdoc ILlamaStrategy
  LlamaPolicy public policy;

  // -------- Strategy Configuration --------

  /// @notice If `false`, action be queued before approvalEndTime.
  bool public isFixedLengthApprovalPeriod;

  /// @notice Length of approval period in seconds.
  uint64 public approvalPeriod;

  /// @notice Minimum time, in seconds, between queueing and execution of action.
  uint64 public queuingPeriod;

  /// @notice Time, in seconds, after `minExecutionTime` that action can be executed before permanently expiring.
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
  mapping(uint8 role => bool isForceApproval) public forceApprovalRole;

  /// @notice Mapping of roles that can force an action to be disapproved.
  mapping(uint8 role => bool isForceDisapproval) public forceDisapprovalRole;

  // =============================
  // ======== Constructor ========
  // =============================

  /// @dev This contract is deployed as a minimal proxy from the core's `_deployStrategies` function. The
  /// `_disableInitializers` locks the implementation (logic) contract, preventing any future initialization of it.
  constructor() {
    _disableInitializers();
  }

  // ==========================================
  // ======== Interface Implementation ========
  // ==========================================

  // -------- At Strategy Creation --------

  /// @inheritdoc ILlamaStrategy
  function initialize(
    bytes memory config
  ) external virtual initializer returns (bool) {
    Config memory strategyConfig = abi.decode(config, (Config));
    llamaCore = LlamaCore(msg.sender);
    policy = llamaCore.policy();
    queuingPeriod = strategyConfig.queuingPeriod;
    expirationPeriod = strategyConfig.expirationPeriod;
    isFixedLengthApprovalPeriod = strategyConfig.isFixedLengthApprovalPeriod;
    approvalPeriod = strategyConfig.approvalPeriod;

    // If the actions count is 0, then the instance is in the process of being deployed. This means that the current
    // role supply must be used.
    uint256 roleSupply = llamaCore.actionsCount() == 0
      ? policy.getRoleSupplyAsQuantitySum(strategyConfig.approvalRole)
      : policy.getPastRoleSupplyAsQuantitySum(
        strategyConfig.approvalRole,
        block.timestamp - 1
      );

    if (strategyConfig.minApprovals > roleSupply)
      revert InvalidMinApprovals(strategyConfig.minApprovals);

    minApprovals = strategyConfig.minApprovals;
    minDisapprovals = strategyConfig.minDisapprovals;

    uint8 numRoles = policy.numRoles();

    approvalRole = strategyConfig.approvalRole;
    _assertValidRole(strategyConfig.approvalRole, numRoles);

    disapprovalRole = strategyConfig.disapprovalRole;
    _assertValidRole(strategyConfig.disapprovalRole, numRoles);

    for (
      uint256 i = 0;
      i < strategyConfig.forceApprovalRoles.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      uint8 role = strategyConfig.forceApprovalRoles[i];
      if (role == 0) revert InvalidRole(0);
      _assertValidRole(role, numRoles);
      forceApprovalRole[role] = true;
    }

    for (
      uint256 i = 0;
      i < strategyConfig.forceDisapprovalRoles.length;
      i = LlamaUtils.uncheckedIncrement(i)
    ) {
      uint8 role = strategyConfig.forceDisapprovalRoles[i];
      if (role == 0) revert InvalidRole(0);
      _assertValidRole(role, numRoles);
      forceDisapprovalRole[role] = true;
    }

    return true;
  }

  // -------- At Action Creation --------

  /// @inheritdoc ILlamaStrategy
  function validateActionCreation(
    ActionInfo calldata actionInfo
  ) external view virtual;

  // -------- When Casting Approval --------

  /// @inheritdoc ILlamaStrategy
  function checkIfApprovalEnabled(
    ActionInfo calldata actionInfo,
    address policyholder,
    uint8 role
  ) external view virtual;

  /// @inheritdoc ILlamaStrategy
  function getApprovalQuantityAt(
    address policyholder,
    uint8 role,
    uint256 timestamp
  ) external view virtual returns (uint96) {
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
  ) external view virtual;

  /// @inheritdoc ILlamaStrategy
  function getDisapprovalQuantityAt(
    address policyholder,
    uint8 role,
    uint256 timestamp
  ) external view virtual returns (uint96) {
    if (role != disapprovalRole && !forceDisapprovalRole[role]) return 0;
    uint96 quantity = policy.getPastQuantity(policyholder, role, timestamp);
    return
      quantity > 0 && forceDisapprovalRole[role] ? type(uint96).max : quantity;
  }

  // -------- When Queueing --------

  /// @inheritdoc ILlamaStrategy
  function minExecutionTime(
    ActionInfo calldata
  ) external view virtual returns (uint64) {
    return LlamaUtils.toUint64(block.timestamp + queuingPeriod);
  }

  // -------- When Canceling --------

  /// @inheritdoc ILlamaStrategy
  function validateActionCancelation(
    ActionInfo calldata actionInfo,
    address caller
  ) external view virtual {
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
  ) external view virtual returns (bool) {
    return
      block.timestamp <= approvalEndTime(actionInfo) &&
      (isFixedLengthApprovalPeriod || !isActionApproved(actionInfo));
  }

  /// @inheritdoc ILlamaStrategy
  function isActionApproved(
    ActionInfo calldata actionInfo
  ) public view virtual returns (bool) {
    Action memory action = llamaCore.getAction(actionInfo.id);
    return action.totalApprovals >= minApprovals;
  }

  /// @inheritdoc ILlamaStrategy
  function isActionDisapproved(
    ActionInfo calldata actionInfo
  ) public view virtual returns (bool) {
    Action memory action = llamaCore.getAction(actionInfo.id);
    return action.totalDisapprovals >= minDisapprovals;
  }

  /// @inheritdoc ILlamaStrategy
  function isActionExpired(
    ActionInfo calldata actionInfo
  ) external view virtual returns (bool) {
    Action memory action = llamaCore.getAction(actionInfo.id);
    return block.timestamp > action.minExecutionTime + expirationPeriod;
  }

  // ===================================================
  // ======== Implementation Specific Functions ========
  // ===================================================

  /// @notice Returns the timestamp at which the approval period ends.
  /// @param actionInfo Data required to create an action.
  /// @return The timestamp at which the approval period ends.
  function approvalEndTime(
    ActionInfo calldata actionInfo
  ) public view virtual returns (uint256) {
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

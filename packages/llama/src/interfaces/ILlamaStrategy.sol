// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ActionInfo} from "@llama/src/lib/Structs.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

/// @title Llama Strategy Interface
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice This is the interface for Llama strategies which determine the rules of an action's process.
/// @dev The interface is sorted by the stage of the action's lifecycle in which the method's are used.
interface ILlamaStrategy {
  // -------- For Inspection --------
  // These are not strictly required by the core, but are useful for inspecting a strategy contract.

  /// @notice Returns the address of the Llama core that this strategy is registered to.
  function llamaCore() external view returns (LlamaCore);

  /// @notice Returns the name of the Llama policy that this strategy is registered to.
  function policy() external view returns (LlamaPolicy);

  // -------- At Strategy Creation --------

  /// @notice Initializes a new clone of the strategy.
  /// @dev This function is called by the `_deployStrategies` function in the `LlamaCore` contract. The `initializer`
  /// modifier ensures that this function can be invoked at most once.
  /// @param config The strategy configuration, encoded as bytes to support differing constructor arguments in
  /// different strategies.
  /// @return This return statement must be hardcoded to `true` to ensure that initializing an EOA
  /// (like the zero address) will revert.
  function initialize(bytes memory config) external returns (bool);

  // -------- At Action Creation --------

  /// @notice Reverts if action creation is not allowed.
  /// @param actionInfo Data required to create an action.
  function validateActionCreation(ActionInfo calldata actionInfo) external view;

  // -------- When Casting Approval --------

  /// @notice Reverts if approvals are not allowed with this strategy for the given policyholder when approving with
  /// role.
  /// @param actionInfo Data required to create an action.
  /// @param policyholder Address of the policyholder.
  /// @param role The role of the policyholder being used to cast approval.
  function checkIfApprovalEnabled(
    ActionInfo calldata actionInfo,
    address policyholder,
    uint8 role
  ) external view;

  /// @notice Get the quantity of an approval of a policyholder at a specific timestamp.
  /// @param policyholder Address of the policyholder.
  /// @param role The role to check quantity for.
  /// @param timestamp The timestamp at which to get the approval quantity.
  /// @return The quantity of the policyholder's approval.
  function getApprovalQuantityAt(
    address policyholder,
    uint8 role,
    uint256 timestamp
  ) external view returns (uint96);

  // -------- When Casting Disapproval --------

  /// @notice Reverts if disapprovals are not allowed with this strategy for the given policyholder when disapproving
  /// with role.
  /// @param actionInfo Data required to create an action.
  /// @param policyholder Address of the policyholder.
  /// @param role The role of the policyholder being used to cast disapproval.
  function checkIfDisapprovalEnabled(
    ActionInfo calldata actionInfo,
    address policyholder,
    uint8 role
  ) external view;

  /// @notice Get the quantity of a disapproval of a policyholder at a specific timestamp.
  /// @param policyholder Address of the policyholder.
  /// @param role The role to check quantity for.
  /// @param timestamp The timestamp at which to get the disapproval quantity.
  /// @return The quantity of the policyholder's disapproval.
  function getDisapprovalQuantityAt(
    address policyholder,
    uint8 role,
    uint256 timestamp
  ) external view returns (uint96);

  // -------- When Queueing --------

  /// @notice Returns the earliest timestamp, in seconds, at which an action can be executed.
  /// @param actionInfo Data required to create an action.
  /// @return The earliest timestamp at which an action can be executed.
  function minExecutionTime(
    ActionInfo calldata actionInfo
  ) external view returns (uint64);

  // -------- When Canceling --------

  /// @notice Reverts if the action cannot be canceled.
  /// @param actionInfo Data required to create an action.
  /// @param caller Policyholder initiating the cancelation.
  function validateActionCancelation(
    ActionInfo calldata actionInfo,
    address caller
  ) external view;

  // -------- When Determining Action State --------
  // These are used during casting of approvals and disapprovals, when queueing, and when executing.

  /// @notice Get whether an action is currently active.
  /// @param actionInfo Data required to create an action.
  /// @return Boolean value that is `true` if the action is currently active, `false` otherwise.
  function isActionActive(
    ActionInfo calldata actionInfo
  ) external view returns (bool);

  /// @notice Get whether an action has passed the approval process.
  /// @param actionInfo Data required to create an action.
  /// @return Boolean value that is `true` if the action has passed the approval process.
  function isActionApproved(
    ActionInfo calldata actionInfo
  ) external view returns (bool);

  /// @notice Get whether an action has been vetoed during the disapproval process.
  /// @param actionInfo Data required to create an action.
  /// @return Boolean value that is `true` if the action has been vetoed during the disapproval process.
  function isActionDisapproved(
    ActionInfo calldata actionInfo
  ) external view returns (bool);

  /// @notice Returns `true` if the action is expired, `false` otherwise.
  /// @param actionInfo Data required to create an action.
  /// @return Boolean value that is `true` if the action is expired.
  function isActionExpired(
    ActionInfo calldata actionInfo
  ) external view returns (bool);
}

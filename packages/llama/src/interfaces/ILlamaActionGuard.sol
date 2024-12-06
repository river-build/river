// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ActionInfo} from "@llama/src/lib/Structs.sol";

/// @title Llama Action Guard Interface
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice Executes checks on action creation and execution to verify that the action is allowed.
/// @dev Methods are not `view` because (1) an action guard may write to it's own storage, and (2)
/// Having `view` methods that can revert isn't great UX. Allowing guards to write to their own
/// storage is useful to persist state between calls to the various guard methods. For example, a
/// guard may:
///   - Store the USD price of a token during action creation in `validateActionCreation`.
///   - Verify the price has not changed by more than a given amount during `validatePreActionExecution`
///     and save off the current USD value of an account.
///   - Verify the USD value of an account has not decreased by more than a certain amount during
///     execution, i.e. between `validatePreActionExecution` and `validatePostActionExecution`.
interface ILlamaActionGuard {
  /// @notice Reverts if action creation is not allowed.
  /// @param actionInfo Data required to create an action.
  function validateActionCreation(ActionInfo calldata actionInfo) external;

  /// @notice Called immediately before action execution, and reverts if the action is not allowed
  /// to be executed.
  /// @param actionInfo Data required to create an action.
  function validatePreActionExecution(ActionInfo calldata actionInfo) external;

  /// @notice Called immediately after action execution, and reverts if the just-executed
  /// action should not have been allowed to execute.
  /// @param actionInfo Data required to create an action.
  function validatePostActionExecution(ActionInfo calldata actionInfo) external;
}

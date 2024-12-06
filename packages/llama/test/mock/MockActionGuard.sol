// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ILlamaActionGuard} from "@llama/src/interfaces/ILlamaActionGuard.sol";
import {ActionInfo} from "@llama/src/lib/Structs.sol";

/// @dev A mock action guard that can be configured for testing. We set the return value of each
/// guard method in the constructor, and set the reason string to use for all cases. Tests will only
/// test one case at a time, so this is sufficient.
contract MockActionGuard is ILlamaActionGuard {
  bool creationAllowed;
  bool preExecutionAllowed;
  bool postExecutionAllowed;
  string reason;

  constructor(
    bool _creationAllowed,
    bool _preExecutionAllowed,
    bool _postExecutionAllowed,
    string memory _reason
  ) {
    creationAllowed = _creationAllowed;
    preExecutionAllowed = _preExecutionAllowed;
    postExecutionAllowed = _postExecutionAllowed;
    reason = _reason;
  }

  function validateActionCreation(
    ActionInfo calldata /* actionInfo */
  ) external view {
    if (!creationAllowed) revert(reason);
  }

  function validatePreActionExecution(
    ActionInfo calldata /* actionInfo */
  ) external view {
    if (!preExecutionAllowed) revert(reason);
  }

  function validatePostActionExecution(
    ActionInfo calldata /* actionInfo */
  ) external view {
    if (!postExecutionAllowed) revert(reason);
  }
}

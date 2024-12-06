// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @dev Possible states of an action during its lifecycle.
enum ActionState {
  Active, // Action created and approval period begins.
  Canceled, // Action canceled by creator.
  Failed, // Action approval failed.
  Approved, // Action approval succeeded and ready to be queued.
  Queued, // Action queued for queueing duration and disapproval period begins.
  Expired, // block.timestamp is greater than Action's executionTime + expirationDelay.
  Executed // Action has executed successfully.
}

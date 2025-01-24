// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IExecutor} from "./IExecutor.sol";

// libraries
import {ExecutorLib} from "./ExecutorLib.sol";

// contracts
import {OwnableBase} from "@river-build/diamond/src/facets/ownable/OwnableBase.sol";

/**
 * @title Executor
 * @notice Facet that enables permissioned delegate calls from a Space
 * @dev This facet must be carefully controlled as delegate calls can be dangerous
 */
contract Executor is OwnableBase, IExecutor {
  /// @inheritdoc IExecutor
  function grantAccess(
    uint64 groupId,
    address account,
    uint32 delay
  ) external onlyOwner {
    ExecutorLib.grantGroupAccess(
      groupId,
      account,
      ExecutorLib.getRoleGrantDelay(groupId),
      delay
    );
  }

  /// @inheritdoc IExecutor
  function revokeAccess(uint64 groupId, address account) external onlyOwner {
    ExecutorLib.revokeGroupAccess(groupId, account);
  }

  /// @inheritdoc IExecutor
  function renounceAccess(uint64 groupId, address account) external {
    ExecutorLib.renounceGroupAccess(groupId, account);
  }

  /// @inheritdoc IExecutor
  function setGuardian(uint64 groupId, uint64 guardian) external onlyOwner {
    ExecutorLib.setGroupGuardian(groupId, guardian);
  }

  /// @inheritdoc IExecutor
  function setGrantDelay(uint64 groupId, uint32 delay) external onlyOwner {
    ExecutorLib.setGroupGrantDelay(groupId, delay, 0);
  }

  /// @inheritdoc IExecutor
  function setTargetFunctionGroup(
    address target,
    bytes4 selector,
    uint64 groupId
  ) external onlyOwner {
    ExecutorLib.setTargetFunctionGroup(target, selector, groupId);
  }

  /// @inheritdoc IExecutor
  function setTargetFunctionDelay(
    address target,
    uint32 delay,
    uint32 minSetback
  ) external onlyOwner {
    ExecutorLib.setTargetFunctionDelay(target, delay, minSetback);
  }

  /// @inheritdoc IExecutor
  function setTargetFunctionDisabled(
    address target,
    bool disabled
  ) external onlyOwner {
    ExecutorLib.setTargetFunctionDisabled(target, disabled);
  }

  /// @inheritdoc IExecutor
  function getSchedule(bytes32 id) external view returns (uint48) {
    return ExecutorLib.getSchedule(id);
  }

  /// @inheritdoc IExecutor
  function scheduleOperation(
    address target,
    bytes calldata data,
    uint48 when
  ) external payable returns (bytes32 operationId, uint32 nonce) {
    return ExecutorLib.scheduleExecution(target, data, when);
  }

  /// @inheritdoc IExecutor
  function execute(
    address target,
    bytes calldata data
  ) external payable returns (uint32 nonce) {
    return ExecutorLib.execute(target, data);
  }

  /// @inheritdoc IExecutor
  function cancel(
    address caller,
    address target,
    bytes calldata data
  ) external returns (uint32 nonce) {
    return ExecutorLib.cancel(caller, target, data);
  }
}

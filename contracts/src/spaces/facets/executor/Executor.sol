// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IExecutor} from "./IExecutor.sol";
import {IImplementationRegistry} from "contracts/src/factory/facets/registry/IImplementationRegistry.sol";

// libraries
import {ExecutorLib} from "./ExecutorLib.sol";

// contracts
import {TokenOwnableBase} from "@river-build/diamond/src/facets/ownable/token/TokenOwnableBase.sol";
import {MembershipStorage} from "contracts/src/spaces/facets/membership/MembershipStorage.sol";

/**
 * @title Executor
 * @notice Facet that enables permissioned delegate calls from a Space
 * @dev This facet must be carefully controlled as delegate calls can be dangerous
 */
contract Executor is TokenOwnableBase, IExecutor {
  /**
   * @notice Validates if the target address is allowed for delegate calls
   * @dev Prevents delegate calls to critical system contracts
   * @param target The contract address to check
   */
  modifier checkAllowed(address target) {
    address factory = MembershipStorage.layout().spaceFactory;

    // Check factory and fetch implementations in single block to optimize caching
    if (
      target == factory ||
      target == _getImplementation(factory, bytes32("RiverAirdrop")) ||
      target == _getImplementation(factory, bytes32("SpaceOperator"))
    ) {
      revert UnauthorizedTarget(target);
    }
    _;
  }

  /// @inheritdoc IExecutor
  function grantAccess(
    uint64 groupId,
    address account,
    uint32 delay
  ) external onlyOwner returns (bool newMember) {
    return
      ExecutorLib.grantGroupAccess(
        groupId,
        account,
        ExecutorLib.getGroupGrantDelay(groupId),
        delay
      );
  }

  /// @inheritdoc IExecutor
  function hasAccess(
    uint64 groupId,
    address account
  ) external view returns (bool isMember, uint32 executionDelay) {
    return ExecutorLib.hasGroupAccess(groupId, account);
  }

  /// @inheritdoc IExecutor
  function getAccess(
    uint64 groupId,
    address account
  )
    external
    view
    returns (
      uint48 since,
      uint32 currentDelay,
      uint32 pendingDelay,
      uint48 effect
    )
  {
    return ExecutorLib.getAccess(groupId, account);
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
  function setGroupDelay(uint64 groupId, uint32 delay) external onlyOwner {
    ExecutorLib.setGroupGrantDelay(groupId, delay, 0);
  }

  function getGroupDelay(uint64 groupId) external view returns (uint32) {
    return ExecutorLib.getGroupGrantDelay(groupId);
  }

  /// @inheritdoc IExecutor
  function setTargetFunctionGroup(
    address target,
    bytes4 selector,
    uint64 groupId
  ) external checkAllowed(target) onlyOwner {
    ExecutorLib.setTargetFunctionGroup(target, selector, groupId);
  }

  /// @inheritdoc IExecutor
  function setTargetFunctionDisabled(
    address target,
    bool disabled
  ) external checkAllowed(target) onlyOwner {
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
  function hashOperation(
    address caller,
    address target,
    bytes calldata data
  ) external pure returns (bytes32) {
    return ExecutorLib.hashOperation(caller, target, data);
  }

  /// @inheritdoc IExecutor
  function execute(
    address target,
    bytes calldata data
  ) external payable checkAllowed(target) returns (uint32 nonce) {
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

  function _getImplementation(
    address factory,
    bytes32 id
  ) internal view returns (address) {
    return IImplementationRegistry(factory).getLatestImplementation(id);
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IExecutor} from "./IExecutor.sol";
import {IImplementationRegistry} from "contracts/src/factory/facets/registry/IImplementationRegistry.sol";

// libraries
import {ExecutorLib} from "./ExecutorLib.sol";
import {DiamondLoupeBase} from "@river-build/diamond/src/facets/loupe/DiamondLoupeBase.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// contracts
import {TokenOwnableBase} from "@river-build/diamond/src/facets/ownable/token/TokenOwnableBase.sol";
import {MembershipStorage} from "contracts/src/spaces/facets/membership/MembershipStorage.sol";
import {EIP712Base} from "@river-build/diamond/src/utils/cryptography/signature/EIP712Base.sol";
import {Nonces} from "@river-build/diamond/src/utils/Nonces.sol";
/**
 * @title Executor
 * @notice Facet that enables permissioned delegate calls from a Space
 * @dev This facet must be carefully controlled as delegate calls can be dangerous
 */
contract Executor is TokenOwnableBase, EIP712Base, Nonces, IExecutor {
  bytes32 private constant TYPEHASH =
    keccak256(
      "SetTargetFunctionGroup(address target,bytes4 selector,uint64 groupId,uint256 nonce)"
    );

  /**
   * @notice Validates if the target address is allowed for delegate calls
   * @dev Prevents delegate calls to critical system contracts
   * @param target The contract address to check
   */
  modifier onlyAuthorized(address target) {
    _checkAuthorized(target);
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
  ) external onlyAuthorized(target) onlyOwner {
    // Disallow setting any diamond functions
    if (target == DiamondLoupeBase.facetAddress(selector))
      revert UnauthorizedTarget(target);
    ExecutorLib.setTargetFunctionGroup(target, selector, groupId);
  }

  function setTargetFunctionGroupWithSignature(
    address target,
    bytes4 selector,
    uint64 groupId,
    bytes calldata signature
  ) external onlyAuthorized(target) {
    if (target == DiamondLoupeBase.facetAddress(selector))
      revert UnauthorizedTarget(target);

    uint256 nonce = _useNonce(msg.sender);
    bytes32 structHash = keccak256(
      abi.encode(TYPEHASH, target, selector, groupId, nonce)
    );
    bytes32 hashTypedData = _hashTypedDataV4(structHash);
    address signer = ECDSA.recover(hashTypedData, signature);
    if (signer != _owner()) revert UnauthorizedTarget(target);

    ExecutorLib.setTargetFunctionGroup(target, selector, groupId);
  }

  /// @inheritdoc IExecutor
  function setTargetFunctionDisabled(
    address target,
    bool disabled
  ) external onlyAuthorized(target) onlyOwner {
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
  ) external payable onlyAuthorized(target) returns (uint32 nonce) {
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

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                        Internal                            */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function _getImplementation(
    address factory,
    bytes32 id
  ) internal view returns (address) {
    return IImplementationRegistry(factory).getLatestImplementation(id);
  }

  function _checkAuthorized(address target) internal virtual {
    address factory = MembershipStorage.layout().spaceFactory;

    // Unauthorized targets
    if (
      target == factory ||
      target == _getImplementation(factory, bytes32("RiverAirdrop")) ||
      target == _getImplementation(factory, bytes32("SpaceOperator"))
    ) {
      revert UnauthorizedTarget(target);
    }
  }
}

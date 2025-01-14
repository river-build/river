// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IEntitlementCheckerBase {
  error EntitlementChecker_NodeAlreadyRegistered();
  error EntitlementChecker_NodeNotRegistered();
  error EntitlementChecker_InsufficientNumberOfNodes();
  error EntitlementChecker_InvalidNodeOperator();
  error EntitlementChecker_InvalidOperator();
  error EntitlementChecker_OperatorNotActive();

  // Events
  event NodeRegistered(address indexed nodeAddress);
  event NodeUnregistered(address indexed nodeAddress);

  /// @notice Event emitted when an entitlement check is requested
  event EntitlementCheckRequested(
    address callerAddress, // The address of the caller
    address contractAddress, // The address of the contract
    bytes32 transactionId, // The ID of the transaction
    uint256 roleId, // The ID of the role
    address[] selectedNodes // The nodes selected for the entitlement check
  );
}

interface IEntitlementChecker is IEntitlementCheckerBase {
  function registerNode(address node) external;

  function unregisterNode(address node) external;

  function isValidNode(address node) external view returns (bool);

  function getNodeCount() external view returns (uint256);

  function getNodeAtIndex(uint256 index) external view returns (address);

  function getRandomNodes(
    uint256 count
  ) external view returns (address[] memory);

  function requestEntitlementCheck(
    address callerAddress,
    bytes32 transactionId,
    uint256 roleId,
    address[] memory nodes
  ) external;

  function requestEntitlementCheckV2(
    bytes32 transactionId,
    uint256 requestId
  ) external payable;

  function getNodesByOperator(
    address operator
  ) external view returns (address[] memory);
}

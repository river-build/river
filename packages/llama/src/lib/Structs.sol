// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {ILlamaActionGuard} from "@llama/src/interfaces/ILlamaActionGuard.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";

/// @dev Data required to create an action.
struct ActionInfo {
  uint256 id; // ID of the action.
  address creator; // Address that created the action.
  uint8 creatorRole; // The role that created the action.
  ILlamaStrategy strategy; // Strategy used to govern the action.
  address target; // Contract being called by an action.
  uint256 value; // Value in wei to be sent when the action is executed.
  bytes data; // Data to be called on the target when the action is executed.
}

/// @dev Data that represents an action.
struct Action {
  // Instead of storing all data required to execute an action in storage, we only save the hash to
  // make action creation cheaper. The hash is computed by taking the keccak256 hash of the concatenation of each
  // field in the `ActionInfo` struct.
  bytes32 infoHash;
  bool executed; // Has action executed.
  bool canceled; // Is action canceled.
  bool isScript; // Is the action's target a script.
  ILlamaActionGuard guard; // The action's guard. This is the address(0) if no guard is set on the action's target and
  // selector pair.
  uint64 creationTime; // The timestamp when action was created (used for policy snapshots).
  uint64 minExecutionTime; // Only set when an action is queued. The timestamp when action execution can begin.
  uint96 totalApprovals; // The total quantity of policyholder approvals.
  uint96 totalDisapprovals; // The total quantity of policyholder disapprovals.
}

/// @dev Data that represents a permission.
struct PermissionData {
  address target; // Contract being called by an action.
  bytes4 selector; // Selector of the function being called by an action.
  ILlamaStrategy strategy; // Strategy used to govern the action.
}

/// @dev Data required to assign/revoke a role to/from a policyholder.
struct RoleHolderData {
  uint8 role; // ID of the role to set (uint8 ensures onchain enumerability when burning policies).
  address policyholder; // Policyholder to assign the role to.
  uint96 quantity; // Quantity of the role to assign to the policyholder, i.e. their (dis)approval quantity.
  uint64 expiration; // When the role expires.
}

/// @dev Data required to assign/revoke a permission to/from a role.
struct RolePermissionData {
  uint8 role; // ID of the role to set (uint8 ensures onchain enumerability when burning policies).
  PermissionData permissionData; // The `(target, selector, strategy)` tuple that will be keccak256 hashed to
  // generate the permission ID to assign or unassign to the role
  bool hasPermission; // Whether to assign the permission or remove the permission.
}

/// @dev Configuration of a new Llama instance.
struct LlamaInstanceConfig {
  string name; // The name of the Llama instance.
  ILlamaStrategy strategyLogic; // The initial strategy implementation (logic) contract.
  ILlamaAccount accountLogic; // The initial account implementation (logic) contract.
  bytes[] initialStrategies; // Array of initial strategy configurations.
  bytes[] initialAccounts; // Array of initial account configurations.
  LlamaPolicyConfig policyConfig; // Configuration of the instance's policy.
}

/// @dev Configuration of a new Llama policy.
struct LlamaPolicyConfig {
  RoleDescription[] roleDescriptions; // The initial role descriptions.
  RoleHolderData[] roleHolders; // The `role`, `policyholder`, `quantity` and `expiration` of the initial role holders.
  RolePermissionData[] rolePermissions; // The `role`, `permissionData`, and  the `hasPermission` boolean.
  string color; // The primary color of the SVG representation of the instance's policy (e.g. #00FF00).
  string logo; // The SVG string representing the logo for the deployed Llama instance's NFT.
}

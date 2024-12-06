// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {ILlamaAccount} from "@llama/src/interfaces/ILlamaAccount.sol";
import {ILlamaActionGuard} from "@llama/src/interfaces/ILlamaActionGuard.sol";
import {ILlamaStrategy} from "@llama/src/interfaces/ILlamaStrategy.sol";
import {LlamaUtils} from "@llama/src/lib/LlamaUtils.sol";
import {PermissionData, RoleHolderData, RolePermissionData} from "@llama/src/lib/Structs.sol";
import {RoleDescription} from "@llama/src/lib/UDVTs.sol";
import {LlamaBaseScript} from "@llama/src/llama-scripts/LlamaBaseScript.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";
import {LlamaPolicy} from "@llama/src/LlamaPolicy.sol";

/// @title Llama Governance Script
/// @author Llama (devsdosomething@llama/src.xyz)
/// @notice A script that defines custom workflows and batch calls for instances interacting with governance functions
/// in their core and policy contracts.
/// @notice How to use this script:
///   - The `aggregate` method is for crafting your own arbitrary payload that only allows using the `LlamaCore` and
///     `LlamaPolicy` as targets.
///   - The "Common Aggregate Calls" section defines methods for common governance workflows.
///   - The "Batch Core Functions" section contains batch versions of the governance methods found in the calling
///     instance's `LlamaCore` contract.
///   - The "Batch Policy Functions" section contains batch versions of the governance methods found in the calling
///     instance's `LlamaPolicy` contract.
contract LlamaGovernanceScript is LlamaBaseScript {
  // ==========================
  // ========= Structs ========
  // ==========================

  /// @dev Struct for the data to call the `createAccounts` method in `LlamaCore`.
  struct CreateAccount {
    ILlamaAccount accountLogic; // Logic contract for the account.
    bytes config; // Configuration of the new account.
  }

  /// @dev Struct for the data to call the `createStrategies` method in `LlamaCore`.
  struct CreateStrategy {
    ILlamaStrategy llamaStrategyLogic; // Logic contract for the strategy.
    bytes config; // Configuration of the new strategy.
  }

  /// @dev Struct for the data required to assign a newly intialized role to a policyholder.
  struct NewRoleHolderData {
    address policyholder; // Policyholder to assign the role to.
    uint96 quantity; // Quantity of the role to assign to the policyholder, i.e. their (dis)approval quantity.
    uint64 expiration; // When the role expires.
  }

  /// @dev Struct for assigning permissions to a role with a fixed `target` and `hasPermission`.
  struct NewRolePermissionsData {
    uint8 role; // ID of the role to set (uint8 ensures onchain enumerability when burning policies).
    SelectorStrategy permissionData; // The `(selector, strategy)` pair that will be combined with a target to form the
    // tuple that will be keccak256 hashed to generate the permission ID to assign or unassign to the role
  }

  /// @dev Struct for assigning permissions to a role with a fixed `strategy` and `hasPermission`.
  struct NewStrategyRolesAndPermissionsData {
    uint8 role; // ID of the role to set (uint8 ensures onchain enumerability when burning policies).
    TargetSelector permissionData; // The `(target, selector)` pair that will be combined with a strategy to form the
    // tuple that will be keccak256 hashed to generate the permission ID to assign or unassign to the role
  }

  /// @dev Struct for creating permissions with a fixed `target`.
  struct SelectorStrategy {
    bytes4 selector; // Selector of the function being called by an action.
    ILlamaStrategy strategy; // Strategy used to govern the action.
  }

  /// @dev Struct for creating permissions with a fixed `strategy`.
  struct TargetSelector {
    address target; // Contract being called by an action.
    bytes4 selector; // Selector of the function being called by an action.
  }

  /// @dev Struct for the data to call the `updateRoleDescription` method in `LlamaPolicy`.
  struct UpdateRoleDescription {
    uint8 role; // Role to update.
    RoleDescription description; // New role description.
  }

  // ========================
  // ======== Errors ========
  // ========================

  /// @dev The call did not succeed.
  /// @param index Index of the arbitrary function being called.
  /// @param revertData Data returned by the called function.
  error CallReverted(uint256 index, bytes revertData);

  /// @dev The provided arrays do not have the same length.
  error MismatchedArrayLengths();

  /// @dev The role provided is not the role being updated.
  /// @param role The role provided.
  error RoleIsNotUpdatedRole(uint8 role);

  /// @dev The role provided has a quantity equal to 0.
  error RoleQuantityMustBeGreaterThanZero();

  /// @dev The target address is neither the `LlamaCore` nor the `LlamaPolicy`.
  /// @param target The target address provided.
  error UnauthorizedTarget(address target);

  // =======================================
  // ======== Arbitrary Aggregation ========
  // =======================================

  /// @notice Batch arbitrary calls to `LlamaCore` and `LlamaPolicy` in a single action.
  /// @dev This method should be assigned carefully, since it allows for arbitrary calls to be made within the context
  /// of `LlamaExecutor` as this script will be delegatecalled. It is safer to permission the functions below as needed
  /// than to permission the aggregate function itself.
  /// @param targets Array of target addresses to call.
  /// @param data Array of data to call the targets with.
  /// @return returnData Array of return data from the calls.
  function aggregate(
    address[] calldata targets,
    bytes[] calldata data
  ) external onlyDelegateCall returns (bytes[] memory returnData) {
    if (targets.length != data.length) revert MismatchedArrayLengths();
    (LlamaCore core, LlamaPolicy policy) = _context();
    uint256 length = data.length;
    returnData = new bytes[](length);
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      bool addressIsCore = targets[i] == address(core);
      bool addressIsPolicy = targets[i] == address(policy);
      if (!addressIsCore && !addressIsPolicy)
        revert UnauthorizedTarget(targets[i]);
      (bool success, bytes memory response) = targets[i].call(data[i]);
      if (!success) revert CallReverted(i, response);
      returnData[i] = response;
    }
  }

  // ========================================
  // ======== Common Aggregate Calls ========
  // ========================================

  /// @notice Initialize a new role, grant this role to role holders, and grant permissions to this role.
  /// @dev Permissions can only be granted and not removed.
  /// @param description Role description to initialize.
  /// @param newRoleHolders Array of role holders to grant the new role (optional, use an empty array to skip).
  /// @param newRolePermissionData Array of permission data for permissions granted to the new role (optional, use an
  /// empty array to skip).
  function initRoleAndHoldersAndPermissions(
    RoleDescription description,
    NewRoleHolderData[] calldata newRoleHolders,
    PermissionData[] calldata newRolePermissionData
  ) external onlyDelegateCall {
    (, LlamaPolicy policy) = _context();
    policy.initializeRole(description);
    uint8 initializedRole = policy.numRoles();

    uint256 holdersLength = newRoleHolders.length;
    uint256 permissionsLength = newRolePermissionData.length;

    if (holdersLength > 0) {
      RoleHolderData[] memory roleHolders = new RoleHolderData[](holdersLength);
      for (
        uint256 i = 0;
        i < holdersLength;
        i = LlamaUtils.uncheckedIncrement(i)
      ) {
        if (newRoleHolders[i].quantity == 0)
          revert RoleQuantityMustBeGreaterThanZero();
        roleHolders[i] = RoleHolderData(
          initializedRole,
          newRoleHolders[i].policyholder,
          newRoleHolders[i].quantity,
          newRoleHolders[i].expiration
        );
      }
      setRoleHolders(roleHolders);
    }

    if (permissionsLength > 0) {
      RolePermissionData[] memory permissions = new RolePermissionData[](
        permissionsLength
      );
      for (
        uint256 i = 0;
        i < permissionsLength;
        i = LlamaUtils.uncheckedIncrement(i)
      ) {
        permissions[i] = RolePermissionData(
          initializedRole,
          newRolePermissionData[i],
          true
        );
      }
      setRolePermissions(permissions);
    }
  }

  /// @notice Create a new strategy and grant role permissions using that strategy.
  /// @dev Permissions can only be granted and not removed.
  /// @param strategy Configuration of new strategy.
  /// @param newStrategyRolesAndPermissionsData Array of structs for assigning permissions to a role with a fixed
  /// `strategy` and `hasPermission`.
  function createStrategyAndSetRolePermissions(
    CreateStrategy calldata strategy,
    NewStrategyRolesAndPermissionsData[]
      calldata newStrategyRolesAndPermissionsData
  ) external onlyDelegateCall {
    (LlamaCore core, ) = _context();

    bytes[] memory strategies = new bytes[](1);
    strategies[0] = strategy.config;

    core.createStrategies(strategy.llamaStrategyLogic, strategies);

    address strategyAddress = Clones.predictDeterministicAddress(
      address(strategy.llamaStrategyLogic),
      keccak256(strategy.config),
      address(core)
    );

    uint256 length = newStrategyRolesAndPermissionsData.length;
    RolePermissionData[] memory permissions = new RolePermissionData[](length);
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      permissions[i] = RolePermissionData(
        newStrategyRolesAndPermissionsData[i].role,
        PermissionData(
          newStrategyRolesAndPermissionsData[i].permissionData.target,
          newStrategyRolesAndPermissionsData[i].permissionData.selector,
          ILlamaStrategy(strategyAddress)
        ),
        true
      );
    }
    setRolePermissions(permissions);
  }

  /// @notice Update a role description and set role holders for the updated role.
  /// @param roleDescription Role description to update.
  /// @param roleHolderData Array of role holders to set.
  function updateRoleDescriptionAndRoleHolders(
    UpdateRoleDescription calldata roleDescription,
    RoleHolderData[] calldata roleHolderData
  ) external onlyDelegateCall {
    (, LlamaPolicy policy) = _context();
    policy.updateRoleDescription(
      roleDescription.role,
      roleDescription.description
    );

    uint256 length = roleHolderData.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      if (roleHolderData[i].role != roleDescription.role)
        revert RoleIsNotUpdatedRole(roleHolderData[i].role);
    }
    setRoleHolders(roleHolderData);
  }

  /// @notice Create account and grant permissions to one or many roles with the account as a target.
  /// @dev Permissions can only be granted and not removed.
  /// @param account Configuration of new account.
  /// @param newRolePermissionsData Array of structs for assigning permissions to a role with a fixed `target` and
  /// `hasPermission`.
  function createAccountAndSetRolePermissions(
    CreateAccount calldata account,
    NewRolePermissionsData[] calldata newRolePermissionsData
  ) external onlyDelegateCall {
    (LlamaCore core, ) = _context();

    bytes[] memory config = new bytes[](1);
    config[0] = account.config;

    core.createAccounts(account.accountLogic, config);

    address accountAddress = Clones.predictDeterministicAddress(
      address(account.accountLogic),
      keccak256(account.config),
      address(core)
    );

    uint256 length = newRolePermissionsData.length;
    RolePermissionData[] memory permissions = new RolePermissionData[](length);
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      permissions[i] = RolePermissionData(
        newRolePermissionsData[i].role,
        PermissionData(
          accountAddress,
          newRolePermissionsData[i].permissionData.selector,
          newRolePermissionsData[i].permissionData.strategy
        ),
        true
      );
    }
    setRolePermissions(permissions);
  }

  /// @notice Authorize or unauthorize script and grant or remove permissions to one or many roles with the script as a
  /// target.
  /// @param script Address of the script to set authorization for.
  /// @param authorized Whether or not the script is authorized. This also determines if `hasPermission` is true or
  /// false.
  /// @param newRolePermissionsData Array of structs for assigning permissions to a role with a fixed `target` and
  /// `hasPermission`.
  function setScriptAuthAndSetPermissions(
    address script,
    bool authorized,
    NewRolePermissionsData[] calldata newRolePermissionsData
  ) external onlyDelegateCall {
    (LlamaCore core, ) = _context();

    core.setScriptAuthorization(script, authorized);

    uint256 length = newRolePermissionsData.length;
    RolePermissionData[] memory permissions = new RolePermissionData[](length);
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      permissions[i] = RolePermissionData(
        newRolePermissionsData[i].role,
        PermissionData(
          script,
          newRolePermissionsData[i].permissionData.selector,
          newRolePermissionsData[i].permissionData.strategy
        ),
        authorized
      );
    }

    setRolePermissions(permissions);
  }

  /// @notice Set strategy logic authorization and create new strategies.
  /// @param strategyLogic Strategy logic contract to set authorization for.
  /// @param strategies Array of configurations for initializing new strategies.
  function setStrategyLogicAuthAndNewStrategies(
    ILlamaStrategy strategyLogic,
    bytes[] calldata strategies
  ) external onlyDelegateCall {
    (LlamaCore core, ) = _context();
    core.setStrategyLogicAuthorization(strategyLogic, true);
    core.createStrategies(strategyLogic, strategies);
  }

  // ========================================
  // ======== Batch Core Functions ========
  // ========================================

  /// @notice Batch set strategy logic authorizations.
  /// @param strategyLogics Array of strategy logic contracts to set authorization for.
  /// @param authorized Boolean to determine whether an address is being authorized or unauthorized.
  function setStrategyLogicAuthorizations(
    ILlamaStrategy[] calldata strategyLogics,
    bool authorized
  ) external onlyDelegateCall {
    (LlamaCore core, ) = _context();
    uint256 length = strategyLogics.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      core.setStrategyLogicAuthorization(strategyLogics[i], authorized);
    }
  }

  /// @notice Batch set account logic authorizations.
  /// @param accountLogics Array of account logic contracts to set authorization for.
  /// @param authorized Boolean to determine whether an address is being authorized or unauthorized.
  function setAccountLogicAuthorizations(
    ILlamaAccount[] calldata accountLogics,
    bool authorized
  ) external onlyDelegateCall {
    (LlamaCore core, ) = _context();
    uint256 length = accountLogics.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      core.setAccountLogicAuthorization(accountLogics[i], authorized);
    }
  }

  /// @notice Batch set strategy authorizations.
  /// @param strategies Array of strategies to set authorization for.
  /// @param authorized Boolean to determine whether a strategy is being authorized or unauthorized.
  function setStrategyAuthorizations(
    ILlamaStrategy[] calldata strategies,
    bool authorized
  ) external onlyDelegateCall {
    (LlamaCore core, ) = _context();
    uint256 length = strategies.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      core.setStrategyAuthorization(strategies[i], authorized);
    }
  }

  /// @notice Set a guard on multiple selectors on a single target.
  /// @param target The target contract where the guard will apply.
  /// @param selectors An array of selectors to apply the guard to.
  /// @param guard The guard being applied.
  function setGuards(
    address target,
    bytes4[] calldata selectors,
    ILlamaActionGuard guard
  ) external onlyDelegateCall {
    (LlamaCore core, ) = _context();
    uint256 length = selectors.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      core.setGuard(target, selectors[i], guard);
    }
  }

  // ========================================
  // ======== Batch Policy Functions ========
  // ========================================

  /// @notice Batch initialize new roles with the provided data.
  /// @param descriptions Array of role descriptions to initialize.
  function initRoles(
    RoleDescription[] calldata descriptions
  ) external onlyDelegateCall {
    (, LlamaPolicy policy) = _context();
    uint256 length = descriptions.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      policy.initializeRole(descriptions[i]);
    }
  }

  /// @notice Batch set role holders with the provided data.
  /// @param roleHolderData Array of role holders to set.
  function setRoleHolders(
    RoleHolderData[] memory roleHolderData
  ) public onlyDelegateCall {
    (, LlamaPolicy policy) = _context();
    uint256 length = roleHolderData.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      policy.setRoleHolder(
        roleHolderData[i].role,
        roleHolderData[i].policyholder,
        roleHolderData[i].quantity,
        roleHolderData[i].expiration
      );
    }
  }

  /// @notice Batch set role permissions with the provided data.
  /// @param rolePermissionData Array of role permissions to set.
  function setRolePermissions(
    RolePermissionData[] memory rolePermissionData
  ) public onlyDelegateCall {
    (, LlamaPolicy policy) = _context();
    uint256 length = rolePermissionData.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      policy.setRolePermission(
        rolePermissionData[i].role,
        rolePermissionData[i].permissionData,
        rolePermissionData[i].hasPermission
      );
    }
  }

  /// @notice Batch revoke policies with the provided data.
  /// @param policies Array of policies to revoke.
  function revokePolicies(
    address[] calldata policies
  ) external onlyDelegateCall {
    (, LlamaPolicy policy) = _context();
    uint256 length = policies.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      policy.revokePolicy(policies[i]);
    }
  }

  /// @notice Batch update role descriptions with the provided data.
  /// @param roleDescriptions Array of role descriptions to update.
  function updateRoleDescriptions(
    UpdateRoleDescription[] calldata roleDescriptions
  ) external onlyDelegateCall {
    (, LlamaPolicy policy) = _context();
    uint256 length = roleDescriptions.length;
    for (uint256 i = 0; i < length; i = LlamaUtils.uncheckedIncrement(i)) {
      policy.updateRoleDescription(
        roleDescriptions[i].role,
        roleDescriptions[i].description
      );
    }
  }

  // ================================
  // ======== Internal Logic ========
  // ================================

  /// @dev Get the core and policy contracts.
  function _context()
    internal
    view
    returns (LlamaCore core, LlamaPolicy policy)
  {
    core = LlamaCore(LlamaExecutor(address(this)).LLAMA_CORE());
    policy = LlamaPolicy(core.policy());
  }
}

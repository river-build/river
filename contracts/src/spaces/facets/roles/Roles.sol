// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IRoles} from "./IRoles.sol";

// libraries
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";

// contracts
import {RolesBase} from "./RolesBase.sol";
import {Entitled} from "../Entitled.sol";

contract Roles is IRoles, RolesBase, Entitled {
  function createRole(
    string calldata roleName,
    string[] memory permissions,
    CreateEntitlement[] memory entitlements
  ) external override returns (uint256) {
    _validatePermission(Permissions.ModifyRoles);
    return _createRole(roleName, permissions, entitlements);
  }

  function getRoles() external view override returns (Role[] memory) {
    return _getRoles();
  }

  function getRoleById(
    uint256 roleId
  ) external view override returns (Role memory) {
    _checkRoleExists(roleId);
    return _getRoleById(roleId);
  }

  function updateRole(
    uint256 roleId,
    string calldata roleName,
    string[] memory permissions,
    CreateEntitlement[] memory entitlements
  ) external override {
    _validatePermission(Permissions.ModifyRoles);
    _updateRole(roleId, roleName, permissions, entitlements);
  }

  function removeRole(uint256 roleId) external override {
    _validatePermission(Permissions.ModifyRoles);
    _removeRole(roleId);
  }

  // permissions
  function addPermissionsToRole(
    uint256 roleId,
    string[] memory permissions
  ) external override {
    _validatePermission(Permissions.ModifyRoles);
    _addPermissionsToRole(roleId, permissions);
  }

  function removePermissionsFromRole(
    uint256 roleId,
    string[] memory permissions
  ) external override {
    _validatePermission(Permissions.ModifyRoles);
    _removePermissionsFromRole(roleId, permissions);
  }

  function getPermissionsByRoleId(
    uint256 roleId
  ) external view override returns (string[] memory permissions) {
    return _getPermissionsByRoleId(roleId);
  }

  // entitlements
  function addRoleToEntitlement(
    uint256 roleId,
    CreateEntitlement memory entitlement
  ) external {
    _validatePermission(Permissions.ModifyRoles);
    _addRoleToEntitlement(roleId, entitlement);
  }

  function removeRoleFromEntitlement(
    uint256 roleId,
    CreateEntitlement memory entitlement
  ) external {
    _validatePermission(Permissions.ModifyRoles);
    _removeRoleFromEntitlement(roleId, entitlement);
  }

  // custom channel permission overrides
  function setChannelPermissionOverrides(
    uint256 roleId,
    bytes32 channelId,
    string[] memory permissions
  ) external {
    _validatePermission(Permissions.ModifyRoles);
    _setChannelPermissionOverrides(roleId, channelId, permissions);
  }

  function getChannelPermissionOverrides(
    uint256 roleId,
    bytes32 channelId
  ) external view returns (string[] memory permissions) {
    return _getChannelPermissionOverrides(roleId, channelId);
  }

  function clearChannelPermissionOverrides(
    uint256 roleId,
    bytes32 channelId
  ) external {
    _validatePermission(Permissions.ModifyRoles);
    _clearChannelPermissionOverrides(roleId, channelId);
  }
}

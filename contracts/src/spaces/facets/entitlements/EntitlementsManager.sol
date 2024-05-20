// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementsManager} from "./IEntitlementsManager.sol";
import {IEntitlement} from "./../../entitlements/IEntitlement.sol";
import {IRolesBase} from "../../facets/roles/IRoles.sol";
import {IRuleEntitlement} from "./../../entitlements/rule/IRuleEntitlement.sol";
import {IUserEntitlement} from "./../../entitlements/user/IUserEntitlement.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ChannelService} from "../channels/ChannelService.sol";

// contracts
import {EntitlementsManagerBase} from "./EntitlementsManagerBase.sol";
import {Entitled} from "../Entitled.sol";
import {RolesBase} from "../../facets/roles/RolesBase.sol";

contract EntitlementsManager is
  IEntitlementsManager,
  EntitlementsManagerBase,
  RolesBase,
  Entitled
{
  using EnumerableSet for EnumerableSet.UintSet;
  using EnumerableSet for EnumerableSet.Bytes32Set;

  function addImmutableEntitlements(
    address[] memory entitlements
  ) external onlyOwner {
    _addImmutableEntitlements(entitlements);
  }

  function addEntitlementModule(address entitlement) external onlyOwner {
    _addEntitlementModule(entitlement);
  }

  function removeEntitlementModule(address entitlement) external onlyOwner {
    _removeEntitlementModule(entitlement);
  }

  function getEntitlements() external view returns (Entitlement[] memory) {
    return _getEntitlements();
  }

  function getEntitlement(
    address entitlement
  ) external view returns (Entitlement memory) {
    return _getEntitlement(entitlement);
  }

  function isEntitledToSpace(
    address user,
    string calldata permission
  ) external view returns (bool) {
    return _isEntitledToSpace(user, permission);
  }

  function isEntitledToChannel(
    bytes32 channelId,
    address user,
    string calldata permission
  ) external view returns (bool) {
    return _isEntitledToChannel(channelId, user, permission);
  }

  function _getChannelRolesWithPermission(
    bytes32 channelId,
    string calldata permission
  ) internal view returns (IRolesBase.Role[] memory) {
    uint256[] memory channelRoles = ChannelService.getRolesByChannel(channelId);

    uint256 roleCount = 0;
    uint256[] memory matchedRoleIds = new uint256[](channelRoles.length);

    bytes32 requestedPermission = keccak256(abi.encodePacked(permission));

    // Count the number of roles that have the requested permission and record their ids.
    for (uint256 i = 0; i < channelRoles.length; i++) {
      IRolesBase.Role memory role = _getRoleById(channelRoles[i]);
      if (role.disabled) {
        continue;
      }
      // Check if the role has the requested permission.
      for (uint256 j = 0; j < role.permissions.length; j++) {
        if (keccak256(bytes(role.permissions[j])) == requestedPermission) {
          matchedRoleIds[roleCount] = role.id;
          roleCount++;
          break;
        }
      }
    }

    // Assemble the roles that have the requested permission for the specified channel.
    IRolesBase.Role[] memory roles = new IRolesBase.Role[](roleCount);
    for (uint256 i = 0; i < roleCount; i++) {
      roles[i] = _getRoleById(matchedRoleIds[i]);
    }

    return roles;
  }

  function _getEntitlements(
    IRolesBase.Role[] memory roles
  ) internal view returns (EntitlementData[] memory) {
    uint256 entitlementCount = 0;
    for (uint256 i = 0; i < roles.length; i++) {
      IRolesBase.Role memory role = roles[i];
      if (!role.disabled) {
        entitlementCount += role.entitlements.length;
      }
    }

    EntitlementData[] memory entitlementData = new EntitlementData[](
      entitlementCount
    );

    entitlementCount = 0;

    for (uint256 i = 0; i < roles.length; i++) {
      IRolesBase.Role memory role = roles[i];
      if (!role.disabled) {
        for (uint256 j = 0; j < role.entitlements.length; j++) {
          IEntitlement entitlement = IEntitlement(role.entitlements[j]);
          if (!entitlement.isCrosschain()) {
            IUserEntitlement ue = IUserEntitlement(address(entitlement));
            entitlementData[entitlementCount] = EntitlementData(
              ue.moduleType(),
              ue.getEntitlementDataByRoleId(role.id)
            );
          } else {
            IRuleEntitlement re = IRuleEntitlement(address(entitlement));
            entitlementData[entitlementCount] = EntitlementData(
              re.moduleType(),
              re.getEntitlementDataByRoleId(role.id)
            );
          }
          entitlementCount++;
        }
      }
    }
    return entitlementData;
  }

  function getEntitlementDataByPermission(
    string calldata permission
  ) external view returns (EntitlementData[] memory) {
    IRolesBase.Role[] memory roles = _getRolesWithPermission(permission);
    return _getEntitlements(roles);
  }

  function getChannelEntitlementDataByPermission(
    bytes32 channelId,
    string calldata permission
  ) external view returns (EntitlementData[] memory) {
    IRolesBase.Role[] memory roles = _getChannelRolesWithPermission(
      channelId,
      permission
    );
    return _getEntitlements(roles);
  }
}

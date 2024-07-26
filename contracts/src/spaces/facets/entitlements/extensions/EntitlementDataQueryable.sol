// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementDataQueryable} from "contracts/src/spaces/facets/entitlements/extensions/IEntitlementDataQueryable.sol";
import {IRolesBase} from "contracts/src/spaces/facets/roles/IRoles.sol";
import {IEntitlement} from "contracts/src/spaces/entitlements/IEntitlement.sol";
import {IEntitlementGatedBase} from "contracts/src/spaces/facets/gated/IEntitlementGated.sol";

// libraries
import {StringSet} from "contracts/src/utils/StringSet.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ChannelService} from "contracts/src/spaces/facets/channels/ChannelService.sol";
import {EntitlementGatedStorage} from "contracts/src/spaces/facets/gated/EntitlementGatedStorage.sol";
import {RolesStorage} from "contracts/src/spaces/facets/roles/RolesStorage.sol";
import {StringSet} from "contracts/src/utils/StringSet.sol";

// contracts
import {RolesBase} from "contracts/src/spaces/facets/roles/RolesBase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract EntitlementDataQueryable is
  IRolesBase,
  IEntitlementDataQueryable,
  IEntitlementGatedBase,
  RolesBase,
  Facet
{
  using StringSet for StringSet.Set;
  using EnumerableSet for EnumerableSet.Bytes32Set;

  function getEntitlementDataByPermission(
    string calldata permission
  ) external view returns (EntitlementData[] memory) {
    Role[] memory roles = _getRolesWithPermission(permission);
    return _getEntitlements(roles);
  }

  function getChannelEntitlementDataByPermission(
    bytes32 channelId,
    string calldata permission
  ) external view returns (EntitlementData[] memory) {
    Role[] memory roles = _getChannelRolesWithPermission(channelId, permission);
    return _getEntitlements(roles);
  }

  function getCrossChainEntitlementData(
    bytes32 transactionId,
    uint256 roleId
  ) external view returns (EntitlementData memory) {
    EntitlementGatedStorage.Layout storage ds = EntitlementGatedStorage
      .layout();

    Transaction storage transaction = ds.transactions[transactionId];

    if (transaction.hasBenSet == false) {
      revert EntitlementGated_TransactionNotRegistered();
    }

    IEntitlement re = IEntitlement(transaction.entitlement);

    return
      EntitlementData(re.moduleType(), re.getEntitlementDataByRoleId(roleId));
  }

  // =============================================================
  //                           Internal
  // =============================================================
  function _getChannelRolesWithPermission(
    bytes32 channelId,
    string calldata permission
  ) internal view returns (Role[] memory) {
    // retrive the roles associated with the channel
    uint256[] memory channelRoles = ChannelService.getRolesByChannel(channelId);
    uint256 channelRolesLength = channelRoles.length;

    // initialize arrays to store the matching role IDs
    uint256[] memory matchedRoleIds = new uint256[](channelRolesLength);
    uint256 matchedRoleCount = 0;

    // access roles storage layout
    RolesStorage.Layout storage rs = RolesStorage.layout();

    // iterate through channel roles and check for the requested permission
    for (uint256 i = 0; i < channelRolesLength; i++) {
      uint256 roleId = channelRoles[i];

      RolesStorage.Role storage role = rs.roleById[channelRoles[i]];

      // skip immutable roles
      if (role.isImmutable) {
        continue;
      }

      bool hasPermission = false;

      // check if role is associated with the channel and has the requested permission
      if (rs.channelsByRole[roleId].contains(channelId)) {
        StringSet.Set storage permissions = rs.permissionByChannelIdByRoleId[
          roleId
        ][channelId];
        hasPermission = permissions.contains(permission);
      }
      // check global permissions if role is not channel-specific
      else if (role.permissions.contains(permission)) {
        hasPermission = true;
      }

      // store the role ID if it has the requested permission
      if (hasPermission) {
        matchedRoleIds[matchedRoleCount] = roleId;
        matchedRoleCount++;
      }
    }

    // create an array of roles with the matching IDs
    Role[] memory rolesWithPermission = new Role[](matchedRoleCount);
    for (uint256 i = 0; i < matchedRoleCount; i++) {
      rolesWithPermission[i] = _getRoleById(matchedRoleIds[i]);
    }

    return rolesWithPermission;
  }

  function _getEntitlements(
    Role[] memory roles
  ) internal view returns (EntitlementData[] memory) {
    uint256 entitlementCount;
    uint256 rolesLength = roles.length;

    for (uint256 i = 0; i < rolesLength; i++) {
      if (!roles[i].disabled) {
        entitlementCount += roles[i].entitlements.length;
      }
    }

    EntitlementData[] memory entitlementData = new EntitlementData[](
      entitlementCount
    );

    uint256 currentIndex = 0;

    for (uint256 i; i < rolesLength; i++) {
      if (!roles[i].disabled) {
        for (uint256 j; j < roles[i].entitlements.length; j++) {
          IEntitlement entitlement = IEntitlement(roles[i].entitlements[j]);

          entitlementData[currentIndex] = EntitlementData(
            entitlement.moduleType(),
            entitlement.getEntitlementDataByRoleId(roles[i].id)
          );

          currentIndex++;
        }
      }
    }

    return entitlementData;
  }
}

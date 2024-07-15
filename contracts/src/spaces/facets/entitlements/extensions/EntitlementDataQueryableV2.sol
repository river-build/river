// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementDataQueryableV2} from "contracts/src/spaces/facets/entitlements/extensions/IEntitlementDataQueryableV2.sol";
import {IEntitlementDataQueryable, IEntitlementDataQueryableBase} from "contracts/src/spaces/facets/entitlements/extensions/IEntitlementDataQueryable.sol";
import {IRolesBase} from "contracts/src/spaces/facets/roles/IRoles.sol";
import {IEntitlement} from "contracts/src/spaces/entitlements/IEntitlement.sol";
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";
import {IUserEntitlement} from "contracts/src/spaces/entitlements/user/IUserEntitlement.sol";

// libraries
import {ChannelService} from "contracts/src/spaces/facets/channels/ChannelService.sol";
import {RuleDataUtil} from "contracts/src/spaces/entitlements/rule/RuleDataUtil.sol";

// contracts
import {RolesBase} from "contracts/src/spaces/facets/roles/RolesBase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract EntitlementDataQueryableV2 is
  IRolesBase,
  IEntitlementDataQueryableV2,
  RolesBase,
  Facet
{
  function getEntitlementDataByPermissionV2(
    string calldata permission
  ) external view returns (EntitlementData[] memory) {
    Role[] memory roles = _getRolesWithPermission(permission);
    return _getEntitlements(roles);
  }

  function getChannelEntitlementDataByPermissionV2(
    bytes32 channelId,
    string calldata permission
  ) external view returns (EntitlementData[] memory) {
    Role[] memory roles = _getChannelRolesWithPermission(channelId, permission);
    return _getEntitlements(roles);
  }

  // =============================================================
  //        IRuleEntitlement V1 Compatibility Functions
  // =============================================================
  // The following methods convert V2 IRuleEntitlement data to V1 IRuleEntitlement data
  // for legacy compatibility.
  function getEntitlementDataByPermission(
    string calldata permission
  )
    external
    view
    returns (IEntitlementDataQueryableBase.EntitlementData[] memory)
  {
    Role[] memory roles = _getRolesWithPermission(permission);
    EntitlementData[] memory entitlementDatas = _getEntitlements(roles);
    return _convertEntitlementDataToV1(entitlementDatas);
  }

  function getChannelEntitlementDataByPermission(
    bytes32 channelId,
    string calldata permission
  )
    external
    view
    returns (IEntitlementDataQueryableBase.EntitlementData[] memory)
  {
    Role[] memory roles = _getChannelRolesWithPermission(channelId, permission);
    EntitlementData[] memory entitlementDatas = _getEntitlements(roles);
    return _convertEntitlementDataToV1(entitlementDatas);
  }

  function _convertEntitlementDataToV1(
    EntitlementData[] memory entitlementDatas
  )
    internal
    pure
    returns (IEntitlementDataQueryableBase.EntitlementData[] memory)
  {
    IEntitlementDataQueryableBase.EntitlementData[]
      memory entitlementDatasV1 = new IEntitlementDataQueryableBase.EntitlementData[](
        entitlementDatas.length
      );
    for (uint256 i = 0; i < entitlementDatas.length; i++) {
      // Convert all byte-encoded V2 rule data to V1 format.
      if (
        keccak256(bytes(entitlementDatas[i].entitlementType)) ==
        keccak256(bytes("RuleEntitlementV2"))
      ) {
        IRuleEntitlementV2.RuleData memory ruleData = abi.decode(
          entitlementDatas[i].entitlementData,
          (IRuleEntitlementV2.RuleData)
        );
        IRuleEntitlement.RuleData memory ruleDataV1 = RuleDataUtil
          .convertV2ToV1RuleData(ruleData);
        entitlementDatasV1[i] = IEntitlementDataQueryableBase.EntitlementData(
          "RuleEntitlement",
          abi.encode(ruleDataV1)
        );
      } else {
        // If the entitlement is not a rule, simply copy the data over.
        entitlementDatasV1[i] = IEntitlementDataQueryableBase.EntitlementData(
          entitlementDatas[i].entitlementType,
          entitlementDatas[i].entitlementData
        );
      }
    }
    return entitlementDatasV1;
  }

  // =============================================================
  //                           Internal
  // =============================================================
  function _getChannelRolesWithPermission(
    bytes32 channelId,
    string calldata permission
  ) internal view returns (Role[] memory) {
    uint256[] memory channelRoles = ChannelService.getRolesByChannel(channelId);

    uint256 roleCount = 0;
    uint256[] memory matchedRoleIds = new uint256[](channelRoles.length);

    bytes32 requestedPermission = keccak256(abi.encodePacked(permission));

    // Count the number of roles that have the requested permission and record their ids.
    for (uint256 i = 0; i < channelRoles.length; i++) {
      Role memory role = _getRoleById(channelRoles[i]);
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
    Role[] memory roles = new Role[](roleCount);
    for (uint256 i = 0; i < roleCount; i++) {
      roles[i] = _getRoleById(matchedRoleIds[i]);
    }

    return roles;
  }

  function _getEntitlements(
    Role[] memory roles
  ) internal view returns (EntitlementData[] memory) {
    uint256 entitlementCount = 0;
    for (uint256 i = 0; i < roles.length; i++) {
      Role memory role = roles[i];
      if (!role.disabled) {
        entitlementCount += role.entitlements.length;
      }
    }

    EntitlementData[] memory entitlementData = new EntitlementData[](
      entitlementCount
    );

    entitlementCount = 0;

    for (uint256 i = 0; i < roles.length; i++) {
      Role memory role = roles[i];
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
}

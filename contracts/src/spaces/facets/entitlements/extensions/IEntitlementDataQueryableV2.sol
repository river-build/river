// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementDataQueryableBase} from "contracts/src/spaces/facets/entitlements/extensions/IEntitlementDataQueryable.sol";

// libraries

// contracts
interface IEntitlementDataQueryableBaseV2 {
  struct EntitlementData {
    string entitlementType;
    bytes entitlementData;
  }
}

interface IEntitlementDataQueryableV2 is IEntitlementDataQueryableBaseV2 {
  // Entitlement data pertaining to all roles in the space.
  function getEntitlementDataByPermissionV2(
    string calldata permission
  ) external view returns (EntitlementData[] memory);

  // Entitlement data pertaining to all roles assigned to a channel.
  function getChannelEntitlementDataByPermissionV2(
    bytes32 channelId,
    string calldata permission
  ) external view returns (EntitlementData[] memory);

  // =============================================================
  //        IRuleEntitlement V1 Compatibility Functions
  // =============================================================
  // The following methods convert V2 IRuleEntitlement data to V1 IRuleEntitlement data
  // for legacy compatibility.

  // Entitlement data pertaining to all roles in the space.
  function getEntitlementDataByPermission(
    string calldata permission
  )
    external
    view
    returns (IEntitlementDataQueryableBase.EntitlementData[] memory);

  // Entitlement data pertaining to all roles assigned to a channel.
  function getChannelEntitlementDataByPermission(
    bytes32 channelId,
    string calldata permission
  )
    external
    view
    returns (IEntitlementDataQueryableBase.EntitlementData[] memory);
}

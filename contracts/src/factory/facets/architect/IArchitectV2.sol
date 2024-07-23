// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IArchitect,IArchitectBase} from "contracts/src/factory/facets/architect/IArchitect.sol";

// libraries
import {IMembershipBase} from "contracts/src/spaces/facets/membership/IMembership.sol";
import {IUserEntitlement} from "contracts/src/spaces/entitlements/user/IUserEntitlement.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";
import {ISpaceOwner} from "contracts/src/spaces/facets/owner/ISpaceOwner.sol";

// contracts
interface IArchitectBaseV2 is IArchitectBase {
  // =============================================================
  //                           STRUCTS
  // =============================================================
  struct MembershipRequirementsV2 {
    bool everyone;
    address[] users;
    IRuleEntitlementV2.RuleData ruleData;
  }

  struct MembershipV2 {
    IMembershipBase.Membership settings;
    MembershipRequirementsV2 requirements;
    string[] permissions;
  }

  struct SpaceInfoV2 {
    string name;
    string uri;
    Membership membership;
    ChannelInfo channel;
    string shortDescription;
    string longDescription;
  }
}

interface IArchitectV2 is IArchitect, IArchitectBaseV2 {
  /// @notice Creates a new space with V2 Entitlements
  /// @param SpaceInfo Space information
  function createSpaceV2(SpaceInfoV2 memory SpaceInfo) external returns (address);
}

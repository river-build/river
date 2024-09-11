// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {IMembershipBase} from "contracts/src/spaces/facets/membership/IMembership.sol";
import {IUserEntitlement} from "contracts/src/spaces/entitlements/user/IUserEntitlement.sol";
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {ISpaceOwner} from "contracts/src/spaces/facets/owner/ISpaceOwner.sol";
import {ISpaceProxyInitializer} from "contracts/src/spaces/facets/proxy/ISpaceProxyInitializer.sol";

// contracts
interface IArchitectBase {
  // =============================================================
  //                           STRUCTS
  // =============================================================

  // Latest
  struct MembershipRequirements {
    bool everyone;
    address[] users;
    bytes ruleData;
  }

  struct Membership {
    IMembershipBase.Membership settings;
    MembershipRequirements requirements;
    string[] permissions;
  }

  struct ChannelInfo {
    string metadata;
  }

  struct SpaceInfo {
    string name;
    string uri;
    Membership membership;
    ChannelInfo channel;
    string shortDescription;
    string longDescription;
  }

  struct Metadata {
    string name;
    string uri;
    string shortDescription;
    string longDescription;
  }

  struct Prepay {
    uint256 supply;
  }

  struct CreateSpace {
    Metadata metadata;
    Membership membership;
    ChannelInfo channel;
    Prepay prepay;
  }

  // =============================================================
  //                           EVENTS
  // =============================================================
  event SpaceCreated(
    address indexed owner,
    uint256 indexed tokenId,
    address indexed space
  );

  // =============================================================
  //                           ERRORS
  // =============================================================

  error Architect__InvalidStringLength();
  error Architect__InvalidNetworkId();
  error Architect__InvalidAddress();
  error Architect__NotContract();
  error Architect__InvalidPricingModule();
}

interface IArchitect is IArchitectBase {
  // =============================================================
  //                            Registry
  // =============================================================
  function getSpaceByTokenId(
    uint256 tokenId
  ) external view returns (address space);

  function getTokenIdBySpace(address space) external view returns (uint256);

  /// @notice Creates a new space
  /// @param SpaceInfo Space information
  function createSpace(SpaceInfo memory SpaceInfo) external returns (address);

  /// @notice Creates a new space with a prepayment
  /// @param createSpace Space information
  function createSpaceWithPrepay(
    CreateSpace memory createSpace
  ) external payable returns (address);

  // =============================================================
  //                         Implementations
  // =============================================================

  function setSpaceArchitectImplementations(
    ISpaceOwner ownerTokenImplementation,
    IUserEntitlement userEntitlementImplementation,
    IRuleEntitlementV2 ruleEntitlementImplementation,
    IRuleEntitlement legacyRuleEntitlement
  ) external;

  function getSpaceArchitectImplementations()
    external
    view
    returns (
      ISpaceOwner ownerTokenImplementation,
      IUserEntitlement userEntitlementImplementation,
      IRuleEntitlementV2 ruleEntitlementImplementation,
      IRuleEntitlement legacyRuleEntitlement
    );

  // =============================================================
  //                    Proxy Initializer
  // =============================================================
  /// @notice Retrieves the current proxy initializer
  /// @return The address of the current ISpaceProxyInitializer contract
  function getProxyInitializer() external view returns (ISpaceProxyInitializer);

  /// @notice Sets a new proxy initializer
  /// @param proxyInitializer The address of the new ISpaceProxyInitializer contract to be set
  /// @dev This function should only be callable by the contract owner or authorized roles
  function setProxyInitializer(
    ISpaceProxyInitializer proxyInitializer
  ) external;
}

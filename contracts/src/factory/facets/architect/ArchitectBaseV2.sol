// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IArchitectBaseV2} from "./IArchitectV2.sol";
import {ArchitectBase} from "./ArchitectBase.sol";
import {IUserEntitlement} from "contracts/src/spaces/entitlements/user/IUserEntitlement.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";
import {IEntitlementsManager} from "contracts/src/spaces/facets/entitlements/IEntitlementsManager.sol";
import {IERC721A} from "contracts/src/diamond/facets/token/ERC721A/IERC721A.sol";
import {ISpaceOwner} from "contracts/src/spaces/facets/owner/ISpaceOwner.sol";
import {IRoles, IRolesBase} from "contracts/src/spaces/facets/roles/IRoles.sol";
import {IManagedProxyBase} from "contracts/src/diamond/proxy/managed/IManagedProxy.sol";
import {IProxyManager} from "contracts/src/diamond/proxy/manager/IProxyManager.sol";
import {ITokenOwnableBase} from "contracts/src/diamond/facets/ownable/token/ITokenOwnable.sol";
import {IMembershipBase} from "contracts/src/spaces/facets/membership/IMembership.sol";

// libraries
import {ArchitectStorage} from "./ArchitectStorage.sol";
import {ImplementationStorage} from "./ImplementationStorage.sol";
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";
import {Validator} from "contracts/src/utils/Validator.sol";

// contracts
import {SpaceProxy} from "contracts/src/spaces/facets/proxy/SpaceProxy.sol";

abstract contract ArchitectBaseV2 is ArchitectBase, IArchitectBaseV2 {
  function _createSpaceV2(
    SpaceInfoV2 memory spaceInfo
  ) internal returns (address spaceAddress) {
    ArchitectStorage.Layout storage ds = ArchitectStorage.layout();
    ImplementationStorage.Layout storage ims = ImplementationStorage.layout();

    // get the token id of the next space
    uint256 spaceTokenId = ims.spaceToken.nextTokenId();

    // deploy space
    spaceAddress = _deploySpaceV2(spaceTokenId, spaceInfo.membership);

    // save space info to storage
    ds.spaceCount++;

    // save to mappings
    ds.spaceByTokenId[spaceTokenId] = spaceAddress;
    ds.tokenIdBySpace[spaceAddress] = spaceTokenId;

    // mint token to and transfer to Architect
    ims.spaceToken.mintSpace(
      spaceInfo.name,
      spaceInfo.uri,
      spaceAddress,
      spaceInfo.shortDescription,
      spaceInfo.longDescription
    );

    // deploy user entitlement
    IUserEntitlement userEntitlement = IUserEntitlement(
      _deployEntitlement(ims.userEntitlement, spaceAddress)
    );

    // deploy token entitlement (Assume the implementation is an IRuleEntitlementV2)
    IRuleEntitlementV2 ruleEntitlementV2 = IRuleEntitlementV2(
      _deployEntitlement(ims.ruleEntitlementV2, spaceAddress)
    );

    address[] memory entitlements = new address[](2);
    entitlements[0] = address(userEntitlement);
    entitlements[1] = address(ruleEntitlementV2);

    // set entitlements as immutable
    IEntitlementsManager(spaceAddress).addImmutableEntitlements(entitlements);

    // create minter role with requirements
    _createMinterEntitlementV2(
      spaceAddress,
      userEntitlement,
      ruleEntitlementV2,
      spaceInfo.membership.requirements
    );

    // create member role with membership as the requirement
    uint256 memberRoleId = _createMemberEntitlement(
      spaceAddress,
      spaceInfo.membership.settings.name,
      spaceInfo.membership.permissions,
      userEntitlement
    );

    // create default channel
    _createDefaultChannel(spaceAddress, memberRoleId, spaceInfo.channel);

    // transfer nft to sender
    IERC721A(address(ims.spaceToken)).safeTransferFrom(
      address(this),
      msg.sender,
      spaceTokenId
    );

    // emit event
    emit SpaceCreated(msg.sender, spaceTokenId, spaceAddress);
  }


    function _createMinterEntitlementV2(
    address spaceAddress,
    IUserEntitlement userEntitlement,
    IRuleEntitlementV2 ruleEntitlementV2,
    MembershipRequirementsV2 memory requirements
  ) internal returns (uint256 roleId) {
    string[] memory joinPermissions = new string[](1);
    joinPermissions[0] = Permissions.JoinSpace;

    roleId = IRoles(spaceAddress).createRole(
      MINTER_ROLE,
      joinPermissions,
      new IRolesBase.CreateEntitlement[](0)
    );

    if (requirements.everyone) {
      address[] memory users = new address[](1);
      users[0] = EVERYONE_ADDRESS;

      IRoles(spaceAddress).addRoleToEntitlement(
        roleId,
        IRolesBase.CreateEntitlement({
          module: userEntitlement,
          data: abi.encode(users)
        })
      );
    } else {
      if (requirements.users.length != 0) {
        // validate users
        for (uint256 i = 0; i < requirements.users.length; ) {
          Validator.checkAddress(requirements.users[i]);
          unchecked {
            i++;
          }
        }

        IRoles(spaceAddress).addRoleToEntitlement(
          roleId,
          IRolesBase.CreateEntitlement({
            module: userEntitlement,
            data: abi.encode(requirements.users)
          })
        );
      }

      if (requirements.ruleDataV2.operations.length > 0) {
        IRoles(spaceAddress).addRoleToEntitlement(
          roleId,
          IRolesBase.CreateEntitlement({
            module: ruleEntitlementV2,
            data: abi.encode(requirements.ruleDataV2)
          })
        );
      }
    }
    return roleId;
  }

    function _setV2Implementations(
    ISpaceOwner spaceToken,
    IUserEntitlement userEntitlement,
    IRuleEntitlementV2 ruleEntitlement
  ) internal {
    if (address(spaceToken).code.length == 0) revert Architect__NotContract();
    if (address(userEntitlement).code.length == 0)
      revert Architect__NotContract();
    if (address(ruleEntitlement).code.length == 0)
      revert Architect__NotContract();

    ImplementationStorage.Layout storage ds = ImplementationStorage.layout();
    ds.spaceToken = spaceToken;
    ds.userEntitlement = userEntitlement;
    ds.ruleEntitlementV2 = ruleEntitlement;
  }

  function _getV2Implementations()
    internal
    view
    returns (
      ISpaceOwner spaceToken,
      IUserEntitlement userEntitlementImplementation,
      IRuleEntitlementV2 ruleEntitlementImplementation
    )
  {
    ImplementationStorage.Layout storage ds = ImplementationStorage.layout();

    return (ds.spaceToken, ds.userEntitlement, ds.ruleEntitlementV2);
  }

 function _deploySpaceV2(
    uint256 spaceTokenId,
    MembershipV2 memory membership
  ) internal returns (address space) {
    // get deployment info
    (bytes memory initCode, bytes32 salt) = _getSpaceDeploymentV2Info(
      spaceTokenId,
      membership
    );
    return _deploy(initCode, salt);
  }

  function _getSpaceDeploymentV2Info(
    uint256 spaceTokenId,
    MembershipV2 memory membership
  ) internal view returns (bytes memory initCode, bytes32 salt) {
    ImplementationStorage.Layout storage ds = ImplementationStorage.layout();

    // calculate salt
    salt = keccak256(abi.encode(msg.sender, spaceTokenId, block.timestamp));

    // calculate init code
    initCode = abi.encodePacked(
      type(SpaceProxy).creationCode,
      abi.encode(
        msg.sender,
        IManagedProxyBase.ManagedProxy({
          managerSelector: IProxyManager.getImplementation.selector,
          manager: address(this)
        }),
        ITokenOwnableBase.TokenOwnable({
          collection: address(ds.spaceToken),
          tokenId: spaceTokenId
        }),
        IMembershipBase.Membership({
          name: membership.settings.name,
          symbol: membership.settings.symbol,
          price: membership.settings.price,
          maxSupply: membership.settings.maxSupply,
          duration: membership.settings.duration,
          currency: membership.settings.currency,
          feeRecipient: membership.settings.feeRecipient == address(0)
            ? msg.sender
            : membership.settings.feeRecipient,
          freeAllocation: membership.settings.freeAllocation,
          pricingModule: membership.settings.pricingModule
        })
      )
    );
  }

}

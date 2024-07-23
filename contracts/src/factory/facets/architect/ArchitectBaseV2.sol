// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IArchitectBaseV2} from "./IArchitectV2.sol";
import {ArchitectBase} from "./ArchitectBase.sol";
import {IUserEntitlement} from "../../spaces/entitlements/user/IUserEntitlement.sol";

// libraries
import {ArchitectStorage} from "./ArchitectStorage.sol";
import {ImplementationStorage} from "./ImplementationStorage.sol";

abstract contract ArchitectBaseV2 is ArchitectBase, IArchitectBaseV2 {
  function _createSpaceV2(
    SpaceInfoV2 memory spaceInfo
  ) internal returns (address spaceAddress) {
    ArchitectStorage.Layout storage ds = ArchitectStorage.layout();
    ImplementationStorage.Layout storage ims = ImplementationStorage.layout();

    // get the token id of the next space
    uint256 spaceTokenId = ims.spaceToken.nextTokenId();

    // deploy space
    spaceAddress = _deploySpace(spaceTokenId, spaceInfo.membership);

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
    IRuleEntitlementV2 ruleEntitlement = IRuleEntitlementV2(
      _deployEntitlement(ims.ruleEntitlement, spaceAddress)
    );

    address[] memory entitlements = new address[](2);
    entitlements[0] = address(userEntitlement);
    entitlements[1] = address(ruleEntitlement);

    // set entitlements as immutable
    IEntitlementsManager(spaceAddress).addImmutableEntitlements(entitlements);

    // create minter role with requirements
    _createMinterEntitlementV2(
      spaceAddress,
      userEntitlement,
      ruleEntitlement,
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
}

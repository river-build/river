// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

import {IEntitlement} from "contracts/src/spaces/entitlements/IEntitlement.sol";
import {IPartnerRegistryBase, IPartnerRegistry} from "contracts/src/factory/facets/partner/IPartnerRegistry.sol";
import {IRolesBase} from "contracts/src/spaces/facets/roles/IRoles.sol";
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {IMembership} from "contracts/src/spaces/facets/membership/IMembership.sol";
// libraries
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";
import {CurrencyTransfer} from "contracts/src/utils/libraries/CurrencyTransfer.sol";
import {BasisPoints} from "contracts/src/utils/libraries/BasisPoints.sol";

// contracts
import {MembershipBase} from "contracts/src/spaces/facets/membership/MembershipBase.sol";
import {DispatcherBase} from "contracts/src/spaces/facets/dispatcher/DispatcherBase.sol";
import {RolesBase} from "contracts/src/spaces/facets/roles/RolesBase.sol";
import {Entitled} from "contracts/src/spaces/facets/Entitled.sol";
import {PrepayBase} from "contracts/src/spaces/facets/prepay/PrepayBase.sol";
import {ReferralsBase} from "contracts/src/spaces/facets/referrals/ReferralsBase.sol";
import {EntitlementGatedBase} from "contracts/src/spaces/facets/gated/EntitlementGatedBase.sol";

/// @title MembershipJoin
/// @notice Handles the logic for joining a space, including entitlement checks and payment processing
/// @dev Inherits from multiple base contracts to provide comprehensive membership functionality
contract MembershipJoin is
  IRolesBase,
  IPartnerRegistryBase,
  MembershipBase,
  ReferralsBase,
  DispatcherBase,
  RolesBase,
  EntitlementGatedBase,
  Entitled,
  PrepayBase
{
  /// @notice Constant representing the permission to join a space
  bytes32 constant JOIN_SPACE =
    bytes32(abi.encodePacked(Permissions.JoinSpace));

  /// @notice Encodes data for joining a space
  /// @param selector The type of transaction (join with or without referral)
  /// @param sender The address of the sender
  /// @param receiver The address of the receiver
  /// @param referralData Additional data for referrals
  /// @return Encoded join space data
  function _encodeJoinSpaceData(
    bytes4 selector,
    address sender,
    address receiver,
    bytes memory referralData
  ) internal pure returns (bytes memory) {
    return abi.encode(selector, sender, receiver, referralData);
  }

  /// @notice Handles the process of joining a space with a referral
  /// @param receiver The address that will receive the membership token
  /// @param referral The referral information
  function _joinSpaceWithReferral(
    address receiver,
    ReferralTypes memory referral
  ) internal {
    _validateJoinSpace(receiver);
    _validatePayment();
    _validateUserReferral(receiver, referral);
    address sender = msg.sender;
    bool isNotReferral = _isNotReferral(referral);

    bytes memory referralData = isNotReferral
      ? bytes("")
      : abi.encode(referral);

    bytes4 selector = isNotReferral
      ? IMembership.joinSpace.selector
      : IMembership.joinSpaceWithReferral.selector;

    bytes32 transactionId = _registerTransaction(
      sender,
      _encodeJoinSpaceData(selector, sender, receiver, referralData),
      msg.value
    );

    (bool isEntitled, bool isCrosschainPending) = _checkEntitlement(
      sender,
      transactionId
    );

    if (!isCrosschainPending) {
      if (isEntitled) {
        bool shouldCharge = _shouldChargeForJoinSpace();
        if (shouldCharge) {
          if (isNotReferral) {
            _chargeForJoinSpace(transactionId);
          } else {
            _chargeForJoinSpaceWithReferral(transactionId);
          }
        } else {
          _refundBalance(transactionId, sender);
        }

        _issueToken(receiver);
      } else {
        _captureData(transactionId, "");
        _refundBalance(transactionId, sender);
        emit MembershipTokenRejected(receiver);
      }
    }
  }

  function _validatePayment() internal view {
    if (msg.value > 0) {
      uint256 price = _getMembershipPrice(_totalSupply());
      if (msg.value != price) revert Membership__InvalidPayment();
    }
  }

  function _validateUserReferral(
    address receiver,
    ReferralTypes memory referral
  ) internal view {
    if (referral.userReferral != address(0)) {
      if (
        referral.userReferral == receiver || referral.userReferral == msg.sender
      ) {
        revert Membership__InvalidAddress();
      }
    }
  }

  function _isNotReferral(
    ReferralTypes memory referral
  ) internal pure returns (bool) {
    return
      referral.partner == address(0) &&
      referral.userReferral == address(0) &&
      bytes(referral.referralCode).length == 0;
  }

  /// @notice Checks if a user is entitled to join the space and handles the entitlement process
  /// @dev This function checks both local and crosschain entitlements
  /// @param sender The address of the user trying to join the space
  /// @param transactionId The unique identifier for this join transaction
  /// @return isEntitled A boolean indicating whether the user is entitled to join
  /// @return isCrosschainPending A boolean indicating if a crosschain entitlement check is pending
  function _checkEntitlement(
    address sender,
    bytes32 transactionId
  ) internal returns (bool isEntitled, bool isCrosschainPending) {
    IRolesBase.Role[] memory roles = _getRolesWithPermission(
      Permissions.JoinSpace
    );
    address[] memory linkedWallets = _getLinkedWalletsWithUser(sender);

    uint256 totalRoles = roles.length;

    for (uint256 i = 0; i < totalRoles; i++) {
      Role memory role = roles[i];
      if (role.disabled) continue;

      for (uint256 j = 0; j < role.entitlements.length; j++) {
        IEntitlement entitlement = IEntitlement(role.entitlements[j]);

        if (entitlement.isEntitled(IN_TOWN, linkedWallets, JOIN_SPACE)) {
          isEntitled = true;
          return (isEntitled, false);
        }

        if (entitlement.isCrosschain()) {
          _requestEntitlementCheck(
            transactionId,
            IRuleEntitlement(address(entitlement)),
            role.id
          );
          isCrosschainPending = true;
        }
      }
    }

    return (isEntitled, isCrosschainPending);
  }

  /// @notice Determines if a charge should be applied for joining the space
  /// @return shouldCharge A boolean indicating whether a charge should be applied
  function _shouldChargeForJoinSpace() internal returns (bool shouldCharge) {
    uint256 totalSupply = _totalSupply();
    uint256 freeAllocation = _getMembershipFreeAllocation();
    uint256 prepaidSupply = _getPrepaidSupply();

    if (freeAllocation > totalSupply) {
      return false;
    }

    if (prepaidSupply > 0) {
      _reducePrepay(1);
      return false;
    }

    return true;
  }

  /// @notice Processes the charge for joining a space without referral
  /// @param transactionId The unique identifier for this join transaction
  function _chargeForJoinSpace(bytes32 transactionId) internal {
    uint256 membershipPrice = _getCapturedValue(transactionId);
    if (membershipPrice == 0) revert Membership__InsufficientPayment();

    (bytes4 selector, address sender, , ) = abi.decode(
      _getCapturedData(transactionId),
      (bytes4, address, address, bytes)
    );

    if (selector != IMembership.joinSpace.selector) {
      revert Membership__InvalidTransactionType();
    }

    uint256 protocolFeeBps = _collectProtocolFee(sender, membershipPrice);
    uint256 surplus = membershipPrice - protocolFeeBps;
    if (surplus > 0) {
      _transferIn(sender, surplus);
    }

    _releaseCapturedValue(transactionId, membershipPrice);
    _captureData(transactionId, "");
  }

  /// @notice Processes the charge for joining a space with referral
  /// @param transactionId The unique identifier for this join transaction
  function _chargeForJoinSpaceWithReferral(bytes32 transactionId) internal {
    uint256 membershipPrice = _getCapturedValue(transactionId);
    if (membershipPrice == 0) revert Membership__InsufficientPayment();

    (bytes4 selector, address sender, , bytes memory referralData) = abi.decode(
      _getCapturedData(transactionId),
      (bytes4, address, address, bytes)
    );

    if (selector != IMembership.joinSpaceWithReferral.selector) {
      revert Membership__InvalidTransactionType();
    }

    ReferralTypes memory referral = abi.decode(referralData, (ReferralTypes));

    uint256 protocolFeeBps = _collectProtocolFee(sender, membershipPrice);

    uint256 partnerFeeBps = _collectPartnerFee(
      sender,
      referral.partner,
      membershipPrice
    );

    uint256 referralFeeBps = _collectReferralCodeFee(
      sender,
      referral.userReferral,
      referral.referralCode,
      membershipPrice
    );

    uint256 surplus = membershipPrice -
      protocolFeeBps -
      partnerFeeBps -
      referralFeeBps;

    if (surplus > 0) {
      _transferIn(sender, surplus);
    }

    _releaseCapturedValue(transactionId, membershipPrice);
    _captureData(transactionId, "");
  }

  /// @notice Issues a membership token to the receiver
  /// @param receiver The address that will receive the membership token
  function _issueToken(address receiver) internal {
    // get token id
    uint256 tokenId = _nextTokenId();

    // set renewal price for token
    _setMembershipRenewalPrice(tokenId, _getMembershipPrice(_totalSupply()));

    // mint membership
    _safeMint(receiver, 1);

    // set expiration of membership
    _renewSubscription(tokenId, _getMembershipDuration());

    // emit event
    emit MembershipTokenIssued(receiver, tokenId);
  }

  /// @notice Validates if a user can join the space
  /// @param receiver The address that will receive the membership token
  function _validateJoinSpace(address receiver) internal view {
    if (receiver == address(0)) revert Membership__InvalidAddress();
    if (
      _getMembershipSupplyLimit() != 0 &&
      _totalSupply() >= _getMembershipSupplyLimit()
    ) revert Membership__MaxSupplyReached();
  }

  /// @notice Refunds the balance to the sender if necessary
  /// @param transactionId The unique identifier for this join transaction
  /// @param sender The address of the sender to refund
  function _refundBalance(bytes32 transactionId, address sender) internal {
    uint256 userValue = _getCapturedValue(transactionId);
    if (userValue > 0) {
      _releaseCapturedValue(transactionId, userValue);
      CurrencyTransfer.transferCurrency(
        _getMembershipCurrency(),
        address(this),
        sender,
        userValue
      );
    }
  }

  /// @notice Collects the referral fee if applicable
  /// @param sender The address of the sender
  /// @param referralCode The referral code used
  /// @param membershipPrice The price of the membership
  /// @return The amount of referral fee collected
  function _collectReferralCodeFee(
    address sender,
    address userReferral,
    string memory referralCode,
    uint256 membershipPrice
  ) internal returns (uint256) {
    uint256 referralFeeBps;

    if (bytes(referralCode).length != 0) {
      Referral memory referral = _referralInfo(referralCode);

      if (referral.recipient == address(0) || referral.basisPoints == 0)
        return 0;

      uint256 referralFee = referral.basisPoints;
      referralFeeBps = BasisPoints.calculate(membershipPrice, referralFee);

      CurrencyTransfer.transferCurrency(
        _getMembershipCurrency(),
        sender,
        referral.recipient,
        referralFeeBps
      );
    } else if (userReferral != address(0)) {
      if (userReferral == sender) return 0;

      referralFeeBps = BasisPoints.calculate(membershipPrice, _defaultBpsFee());

      CurrencyTransfer.transferCurrency(
        _getMembershipCurrency(),
        sender,
        userReferral,
        referralFeeBps
      );
    }

    return referralFeeBps;
  }

  /// @notice Collects the partner fee if applicable
  /// @param sender The address of the sender
  /// @param partner The address of the partner
  /// @param membershipPrice The price of the membership
  /// @return The amount of partner fee collected
  function _collectPartnerFee(
    address sender,
    address partner,
    uint256 membershipPrice
  ) internal returns (uint256) {
    if (partner == address(0)) return 0;

    Partner memory partnerInfo = IPartnerRegistry(_getSpaceFactory())
      .partnerInfo(partner);

    if (partnerInfo.fee == 0) return 0;

    // Use existing partner info
    uint256 partnerFee = partnerInfo.fee;
    address recipient = partnerInfo.recipient;
    uint256 partnerFeeBps = BasisPoints.calculate(membershipPrice, partnerFee);

    CurrencyTransfer.transferCurrency(
      _getMembershipCurrency(),
      sender,
      recipient,
      partnerFeeBps
    );

    return partnerFeeBps;
  }
}

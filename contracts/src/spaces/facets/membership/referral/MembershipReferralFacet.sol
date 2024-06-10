// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IMembershipReferral} from "./IMembershipReferral.sol";

// libraries

// contracts
import {TokenOwnableBase} from "contracts/src/diamond/facets/ownable/token/TokenOwnableBase.sol";
import {MembershipReferralBase} from "./MembershipReferralBase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract MembershipReferralFacet is
  IMembershipReferral,
  TokenOwnableBase,
  MembershipReferralBase,
  Facet
{
  function __MembershipReferralFacet_init() external onlyInitializing {
    _addInterface(type(IMembershipReferral).interfaceId);
  }

  /// @inheritdoc IMembershipReferral
  function createReferralCode(uint256 code, uint16 bps) external onlyOwner {
    _createReferralCode(code, bps);
  }

  /// @inheritdoc IMembershipReferral
  function createReferralCodeWithTime(
    uint256 code,
    uint16 bps,
    uint256 startTime,
    uint256 endTime
  ) external onlyOwner {
    _createReferralCodeWithTime(code, bps, startTime, endTime);
  }

  /// @inheritdoc IMembershipReferral
  function createReferralCodeForPartner(
    address partner,
    uint256 code,
    uint16 bps
  ) external onlyOwner {
    _createReferralCodeForPartner(partner, code, bps);
  }

  /// @inheritdoc IMembershipReferral
  function removeReferralCode(uint256 code) external onlyOwner {
    _removeReferralCode(code);
  }

  function removePartnerReferralCode(address partner) external onlyOwner {
    _removePartnerReferralCode(partner);
  }

  /// @inheritdoc IMembershipReferral
  function referralCodeBps(uint256 code) external view returns (uint16) {
    return _referralCodeBps(code);
  }

  /// @inheritdoc IMembershipReferral
  function referralCodeTime(
    uint256 code
  ) external view returns (TimeData memory) {
    return _referralCodeTime(code);
  }

  function referralPartnerCode(
    address partner
  ) external view returns (uint256) {
    return _referralPartnerCode(partner);
  }

  /// @inheritdoc IMembershipReferral
  function calculateReferralAmount(
    uint256 amount,
    uint256 referralCode
  ) external view returns (uint256) {
    return _calculateReferralAmount(amount, referralCode);
  }
}

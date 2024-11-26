// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IMembership} from "./IMembership.sol";
import {IMembershipPricing} from "./pricing/IMembershipPricing.sol";

// libraries
import {CurrencyTransfer} from "contracts/src/utils/libraries/CurrencyTransfer.sol";
import {MembershipBase} from "./MembershipBase.sol";

// contracts
import {ReentrancyGuard} from "contracts/src/diamond/facets/reentrancy/ReentrancyGuard.sol";
import {MembershipJoin} from "./join/MembershipJoin.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract MembershipFacet is
  IMembership,
  MembershipJoin,
  ReentrancyGuard,
  Facet
{
  // =============================================================
  //                           Withdrawal
  // =============================================================

  /// @inheritdoc IMembership
  function withdraw(address account) external onlyOwner nonReentrant {
    if (account == address(0)) revert Membership__InvalidAddress();

    // get the balance
    uint256 balance = MembershipBase.getCreatorBalance();

    // verify the balance is not 0
    if (balance == 0) revert Membership__InsufficientPayment();

    // reset the balance
    MembershipBase.setCreatorBalance(0);

    CurrencyTransfer.transferCurrency(
      MembershipBase.getMembershipCurrency(),
      address(this),
      account,
      balance
    );
  }

  // =============================================================
  //                           Join
  // =============================================================

  /// @inheritdoc IMembership
  function joinSpace(address receiver) external payable nonReentrant {
    ReferralTypes memory emptyReferral;
    _joinSpaceWithReferral(receiver, emptyReferral);
  }

  /// @inheritdoc IMembership
  function joinSpaceWithReferral(
    address receiver,
    ReferralTypes memory referral
  ) external payable nonReentrant {
    _joinSpaceWithReferral(receiver, referral);
  }

  // =============================================================
  //                           Renewal
  // =============================================================

  /// @inheritdoc IMembership
  function renewMembership(uint256 tokenId) external payable nonReentrant {
    address receiver = _ownerOf(tokenId);

    if (receiver == address(0)) revert Membership__InvalidAddress();

    // validate if the current expiration is 365 or more
    uint256 expiration = _expiresAt(tokenId);
    if (expiration - block.timestamp >= MembershipBase.getMembershipDuration())
      revert Membership__NotExpired();

    // allocate protocol and membership fees
    uint256 membershipPrice = MembershipBase.getMembershipRenewalPrice(
      tokenId,
      _totalSupply()
    );

    if (membershipPrice > 0) {
      uint256 protocolFee = MembershipBase.collectProtocolFee(
        receiver,
        membershipPrice
      );
      uint256 surplus = membershipPrice - protocolFee;
      if (surplus > 0) MembershipBase.transferIn(receiver, surplus);
    }

    _renewSubscription(tokenId, MembershipBase.getMembershipDuration());
  }

  /// @inheritdoc IMembership
  function expiresAt(uint256 tokenId) external view returns (uint256) {
    return _expiresAt(tokenId);
  }

  // =============================================================
  //                           Duration
  // =============================================================

  /// @inheritdoc IMembership
  function getMembershipDuration() external view returns (uint64) {
    return MembershipBase.getMembershipDuration();
  }

  // =============================================================
  //                        Pricing Module
  // =============================================================
  /// @inheritdoc IMembership
  function setMembershipPricingModule(
    address pricingModule
  ) external onlyOwner {
    MembershipBase.verifyPricingModule(pricingModule);
    MembershipBase.setPricingModule(pricingModule);
  }

  /// @inheritdoc IMembership
  function getMembershipPricingModule() external view returns (address) {
    return MembershipBase.getPricingModule();
  }

  // =============================================================
  //                           Pricing
  // =============================================================

  /// @inheritdoc IMembership
  function setMembershipPrice(uint256 newPrice) external onlyOwner {
    MembershipBase.verifyPrice(newPrice);
    IMembershipPricing(MembershipBase.getPricingModule()).setPrice(newPrice);
  }

  /// @inheritdoc IMembership
  function getMembershipPrice() external view returns (uint256) {
    return MembershipBase.getMembershipPrice(_totalSupply());
  }

  /// @inheritdoc IMembership
  function getMembershipRenewalPrice(
    uint256 tokenId
  ) external view returns (uint256) {
    return MembershipBase.getMembershipRenewalPrice(tokenId, _totalSupply());
  }

  // =============================================================
  //                           Allocation
  // =============================================================
  /// @inheritdoc IMembership
  function setMembershipFreeAllocation(
    uint256 newAllocation
  ) external onlyOwner {
    // get current supply limit
    uint256 currentSupplyLimit = MembershipBase.getMembershipSupplyLimit();

    // verify newLimit is not more than the max supply limit
    if (currentSupplyLimit != 0 && newAllocation > currentSupplyLimit)
      revert Membership__InvalidFreeAllocation();

    // verify newLimit is not more than the allowed platform limit
    MembershipBase.verifyFreeAllocation(newAllocation);
    MembershipBase.setMembershipFreeAllocation(newAllocation);
  }

  /// @inheritdoc IMembership
  function getMembershipFreeAllocation() external view returns (uint256) {
    return MembershipBase.getMembershipFreeAllocation();
  }

  // =============================================================
  //                    Token Max Supply Limit
  // =============================================================

  /// @inheritdoc IMembership
  function setMembershipLimit(uint256 newLimit) external onlyOwner {
    MembershipBase.verifyMaxSupply(newLimit, _totalSupply());
    MembershipBase.setMembershipSupplyLimit(newLimit);
  }

  /// @inheritdoc IMembership
  function getMembershipLimit() external view returns (uint256) {
    return MembershipBase.getMembershipSupplyLimit();
  }

  // =============================================================
  //                           Currency
  // =============================================================

  /// @inheritdoc IMembership
  function getMembershipCurrency() external view returns (address) {
    return MembershipBase.getMembershipCurrency();
  }

  // =============================================================
  //                           Image
  // =============================================================
  function setMembershipImage(string calldata newImage) external onlyOwner {
    MembershipBase.setMembershipImage(newImage);
  }

  function getMembershipImage() external view returns (string memory) {
    return MembershipBase.getMembershipImage();
  }

  // =============================================================
  //                           Factory
  // =============================================================

  /// @inheritdoc IMembership
  function getSpaceFactory() external view returns (address) {
    return MembershipBase.getSpaceFactory();
  }
}

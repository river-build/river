// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {ReferralsStorage} from "./ReferralsStorage.sol";

// contracts
import {IReferralsBase} from "./IReferrals.sol";

abstract contract ReferralsBase is IReferralsBase {
  function _validateReferral(Referral memory referral) internal view {
    if (referral.recipient == address(0)) {
      revert Referrals__InvalidRecipient();
    }

    if (referral.basisPoints == 0) {
      revert Referrals__InvalidBasisPoints();
    }

    if (bytes(referral.referralCode).length == 0) {
      revert Referrals__InvalidReferralCode();
    }

    // if max bps fee is set, check if referral.basisPoints is less than or equal to max bps fee
    if (_maxBpsFee() > 0 && referral.basisPoints > _maxBpsFee()) {
      revert Referrals__InvalidBpsFee();
    }
  }

  function _registerReferral(Referral memory referral) internal {
    _validateReferral(referral);

    bytes32 referralCode = keccak256(bytes(referral.referralCode));
    ReferralsStorage.Layout storage ds = ReferralsStorage.layout();

    if (ds.referrals[referralCode].recipient != address(0)) {
      revert Referrals__ReferralAlreadyExists();
    }

    ds.referrals[referralCode] = ReferralsStorage.Referral({
      bpsFee: referral.basisPoints,
      recipient: referral.recipient
    });

    emit ReferralRegistered(
      referralCode,
      referral.basisPoints,
      referral.recipient
    );
  }

  function _referralInfo(
    string memory referralCode
  ) internal view returns (Referral memory) {
    ReferralsStorage.Layout storage ds = ReferralsStorage.layout();
    ReferralsStorage.Referral storage storedReferral = ds.referrals[
      keccak256(bytes(referralCode))
    ];

    return
      Referral({
        referralCode: referralCode,
        basisPoints: storedReferral.bpsFee,
        recipient: storedReferral.recipient
      });
  }

  function _updateReferral(Referral memory referral) internal {
    _validateReferral(referral);

    bytes32 referralCode = keccak256(bytes(referral.referralCode));
    ReferralsStorage.Layout storage ds = ReferralsStorage.layout();

    if (ds.referrals[referralCode].recipient == address(0)) {
      revert Referrals__InvalidReferralCode();
    }

    ds.referrals[referralCode] = ReferralsStorage.Referral({
      bpsFee: referral.basisPoints,
      recipient: referral.recipient
    });

    emit ReferralUpdated(
      referralCode,
      referral.basisPoints,
      referral.recipient
    );
  }

  function _removeReferral(string memory referralCode) internal {
    bytes32 referralCodeHash = keccak256(bytes(referralCode));

    delete ReferralsStorage.layout().referrals[referralCodeHash];

    emit ReferralRemoved(referralCodeHash);
  }

  // admin
  function _setMaxBpsFee(uint256 maxBpsFee) internal {
    ReferralsStorage.Layout storage ds = ReferralsStorage.layout();
    ds.referralSettings.maxBpsFee = maxBpsFee;

    emit MaxBpsFeeUpdated(maxBpsFee);
  }

  function _maxBpsFee() internal view returns (uint256) {
    return ReferralsStorage.layout().referralSettings.maxBpsFee;
  }
}

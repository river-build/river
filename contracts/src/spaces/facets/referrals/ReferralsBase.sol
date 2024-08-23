// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {ReferralsStorage} from "./ReferralsStorage.sol";

// contracts
import {IReferralsBase} from "./IReferrals.sol";

abstract contract ReferralsBase is IReferralsBase {
  function _validateReferral(Referral memory referral) internal {
    // validate referral recipient
    if (referral.recipient == address(0)) {
      revert ReferralsBase__InvalidRecipient();
    }

    // validate referral basis points
    if (referral.basisPoints == 0) {
      revert ReferralsBase__InvalidBasisPoints();
    }
  }

  function _registerReferral(Referral memory referral) internal {
    _validateReferral(referral);

    bytes32 referralCode = keccak256(abi.encode(referral.referralCode));

    ReferralsStorage.Layout storage ds = ReferralsStorage.layout();

    ReferralsStorage.Referral memory storedReferral = ds.referrals[
      referralCode
    ];

    if (storedReferral.referrer != address(0)) {
      revert ReferralsBase__InvalidReferralCode();
    }

    ds.referrals[referralCode] = ReferralsStorage.Referral({
      basisPoints: referral.basisPoints,
      referrer: referral.recipient
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

    ReferralsStorage.Referral memory storedReferral = ds.referrals[
      keccak256(abi.encode(referralCode))
    ];

    return
      Referral({
        referralCode: referralCode,
        basisPoints: storedReferral.basisPoints,
        recipient: storedReferral.referrer
      });
  }

  function _updateReferral(Referral memory referral) internal {
    _validateReferral(referral);

    bytes32 referralCode = keccak256(abi.encode(referral.referralCode));

    ReferralsStorage.Layout storage ds = ReferralsStorage.layout();

    // validate referral exists
    ReferralsStorage.Referral memory storedReferral = ds.referrals[
      referralCode
    ];

    if (storedReferral.referrer == address(0)) {
      revert ReferralsBase__InvalidReferralCode();
    }

    ds.referrals[referralCode] = ReferralsStorage.Referral({
      basisPoints: referral.basisPoints,
      referrer: referral.recipient
    });

    emit ReferralUpdated(
      referralCode,
      referral.basisPoints,
      referral.recipient
    );
  }

  function _removeReferral(string memory referralCode) internal {
    ReferralsStorage.Layout storage ds = ReferralsStorage.layout();
    delete ds.referrals[keccak256(abi.encode(referralCode))];
  }
}

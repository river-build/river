// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface IReferralsBase {
  struct Referral {
    string referralCode;
    uint256 basisPoints;
    address recipient;
  }

  error ReferralsBase__InvalidReferralCode();
  error ReferralsBase__InvalidBasisPoints();
  error ReferralsBase__InvalidRecipient();

  event ReferralRegistered(
    bytes32 referralCode,
    uint256 basisPoints,
    address recipient
  );

  event ReferralUpdated(
    bytes32 referralCode,
    uint256 basisPoints,
    address recipient
  );
}

interface IReferrals is IReferralsBase {
  function registerReferral(Referral memory referral) external;

  function referralInfo(
    string memory referralCode
  ) external view returns (Referral memory);

  function removeReferral(string memory referralCode) external;
}

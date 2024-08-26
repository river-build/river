// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

/// @title IReferralsBase
/// @notice Base interface for referral functionality
interface IReferralsBase {
  /// @notice Structure to represent a referral
  /// @param referralCode Unique code for the referral
  /// @param basisPoints Percentage of the referral reward in basis points
  /// @param recipient Address to receive the referral reward
  struct Referral {
    string referralCode;
    uint256 basisPoints;
    address recipient;
  }

  // errors

  /// @notice Error thrown when an invalid referral code is provided
  error Referrals__InvalidReferralCode();
  /// @notice Error thrown when invalid basis points are provided
  error Referrals__InvalidBasisPoints();
  /// @notice Error thrown when an invalid recipient address is provided
  error Referrals__InvalidRecipient();
  /// @notice Error thrown when an invalid bps fee is provided
  error Referrals__InvalidBpsFee();
  /// @notice Error thrown when a referral already exists
  error Referrals__ReferralAlreadyExists();

  // events

  /// @notice Event emitted when a new referral is registered
  /// @param referralCode Unique identifier for the referral
  /// @param basisPoints Percentage of the referral reward in basis points
  /// @param recipient Address to receive the referral reward
  event ReferralRegistered(
    bytes32 referralCode,
    uint256 basisPoints,
    address recipient
  );

  /// @notice Event emitted when a referral is updated
  /// @param referralCode Unique identifier for the referral
  /// @param basisPoints Updated percentage of the referral reward in basis points
  /// @param recipient Updated address to receive the referral reward
  event ReferralUpdated(
    bytes32 referralCode,
    uint256 basisPoints,
    address recipient
  );

  /// @notice Event emitted when a referral is removed
  /// @param referralCode Unique identifier for the referral
  event ReferralRemoved(bytes32 referralCode);

  /// @notice Event emitted when the max bps fee is updated
  /// @param maxBpsFee The new max bps fee
  event MaxBpsFeeUpdated(uint256 maxBpsFee);
}

/// @title IReferrals
/// @notice Interface for managing referrals
interface IReferrals is IReferralsBase {
  /// @notice Register a new referral
  /// @param referral The referral information to register
  function registerReferral(Referral memory referral) external;

  /// @notice Get information about a specific referral
  /// @param referralCode The unique code of the referral to retrieve
  /// @return The referral information
  function referralInfo(
    string memory referralCode
  ) external view returns (Referral memory);

  /// @notice Remove a referral
  /// @param referralCode The unique code of the referral to remove
  function removeReferral(string memory referralCode) external;
}

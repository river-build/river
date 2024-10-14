// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface IDropFacetBase {
  /// @notice A struct representing a claim condition
  /// @param startTimestamp The timestamp at which the claim condition starts
  /// @param maxClaimableSupply The maximum claimable supply for the claim condition
  /// @param supplyClaimed The supply already claimed for the claim condition
  /// @param merkleRoot The merkle root for the claim condition
  /// @param currency The currency to claim in
  /// @param penaltyBps The penalty in basis points for early withdrawal
  struct ClaimCondition {
    uint256 startTimestamp;
    uint256 maxClaimableSupply;
    uint256 supplyClaimed;
    bytes32 merkleRoot;
    address currency;
    uint256 penaltyBps;
  }

  // =============================================================
  //                           Events
  // =============================================================
  event DropFacet_Claimed_WithPenalty(
    uint256 indexed conditionId,
    address indexed claimer,
    address indexed account,
    uint256 amount
  );

  event DropFacet_ClaimConditionsUpdated(
    ClaimCondition[] conditions,
    bool resetEligibility
  );

  // =============================================================
  //                           Errors
  // =============================================================
  error IDropFacet__NoActiveClaimCondition();
  error IDropFacet__MerkleRootNotSet();
  error IDropFacet__QuantityMustBeGreaterThanZero();
  error IDropFacet__ExceedsMaxClaimableSupply();
  error IDropFacet__ClaimHasNotStarted();
  error IDropFacet__AlreadyClaimed();
  error IDropFacet__InvalidProof();
  error IDropFacet__ClaimConditionsNotInAscendingOrder();
  error IDropFacet__CannotSetClaimConditions();
}

interface IDropFacet is IDropFacetBase {}

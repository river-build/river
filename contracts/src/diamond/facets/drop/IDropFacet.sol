// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {DropStorage} from "./DropStorage.sol";

// contracts

interface IDropFacetBase {
  /// @notice A struct representing a claim condition
  /// @param startTimestamp The timestamp at which the claim condition starts
  /// @param maxClaimableSupply The maximum claimable supply for the claim condition
  /// @param supplyClaimed The supply already claimed for the claim condition
  /// @param merkleRoot The merkle root for the claim condition
  struct ClaimCondition {
    uint256 startTimestamp;
    uint256 maxClaimableSupply;
    uint256 supplyClaimed;
    bytes32 merkleRoot;
  }

  // =============================================================
  //                           Events
  // =============================================================
  event DropFacet_Claimed(address indexed account, uint256 amount);
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

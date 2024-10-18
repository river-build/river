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
    uint256 endTimestamp;
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
  error DropFacet__NoActiveClaimCondition();
  error DropFacet__MerkleRootNotSet();
  error DropFacet__QuantityMustBeGreaterThanZero();
  error DropFacet__ExceedsMaxClaimableSupply();
  error DropFacet__ClaimHasNotStarted();
  error DropFacet__AlreadyClaimed();
  error DropFacet__InvalidProof();
  error DropFacet__ClaimConditionsNotInAscendingOrder();
  error DropFacet__CannotSetClaimConditions();
  error DropFacet__ClaimHasEnded();
}

interface IDropFacet is IDropFacetBase {
  /// @notice Sets the claim conditions for the drop
  /// @param conditions An array of ClaimCondition structs defining the conditions
  /// @param resetEligibility If true, resets the eligibility for all wallets under the new conditions
  function setClaimConditions(
    ClaimCondition[] calldata conditions,
    bool resetEligibility
  ) external;

  /// @notice Gets the ID of the currently active claim condition
  /// @return The ID of the active claim condition
  function getActiveClaimConditionId() external view returns (uint256);

  /// @notice Retrieves a specific claim condition by its ID
  /// @param conditionId The ID of the claim condition to retrieve
  /// @return The ClaimCondition struct for the specified ID
  function getClaimConditionById(
    uint256 conditionId
  ) external view returns (ClaimCondition memory);

  /// @notice Gets the amount of tokens claimed by a specific wallet for a given condition
  /// @param account The address of the wallet to check
  /// @param conditionId The ID of the claim condition
  /// @return The number of tokens claimed by the wallet for the specified condition
  function getSupplyClaimedByWallet(
    address account,
    uint256 conditionId
  ) external view returns (uint256);
}

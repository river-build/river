// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDropFacetBase} from "./IDropFacet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// libraries
import {DropStorage} from "./DropStorage.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {MerkleProofLib} from "solady/utils/MerkleProofLib.sol";
import {SafeCastLib} from "solady/utils/SafeCastLib.sol";
import {BasisPoints} from "contracts/src/utils/libraries/BasisPoints.sol";

abstract contract DropFacetBase is IDropFacetBase {
  using DropStorage for DropStorage.Layout;
  using MerkleProofLib for bytes32[];

  function _getActiveConditionId(
    DropStorage.Layout storage ds
  ) internal view returns (uint256) {
    uint256 conditionStartId = ds.conditionStartId;
    uint256 conditionCount = ds.conditionCount;

    if (conditionCount == 0) {
      CustomRevert.revertWith(DropFacet__NoActiveClaimCondition.selector);
    }

    uint256 lastConditionId = conditionStartId + conditionCount - 1;

    for (uint256 i = lastConditionId; i >= conditionStartId; --i) {
      ClaimCondition storage condition = ds.conditionById[i];
      uint256 endTimestamp = condition.endTimestamp;
      if (
        block.timestamp >= condition.startTimestamp &&
        (endTimestamp == 0 || block.timestamp < endTimestamp)
      ) {
        return i;
      }
    }

    CustomRevert.revertWith(DropFacet__NoActiveClaimCondition.selector);
  }

  function _verifyClaim(
    DropStorage.Layout storage ds,
    Claim calldata claim
  ) internal view {
    ClaimCondition storage condition = ds.getClaimConditionById(
      claim.conditionId
    );

    if (condition.merkleRoot == bytes32(0)) {
      CustomRevert.revertWith(DropFacet__MerkleRootNotSet.selector);
    }

    if (claim.quantity == 0) {
      CustomRevert.revertWith(
        DropFacet__QuantityMustBeGreaterThanZero.selector
      );
    }

    if (condition.currency == address(0)) {
      CustomRevert.revertWith(DropFacet__CurrencyNotSet.selector);
    }

    // Check if the total claimed supply (including the current claim) exceeds the maximum claimable supply
    if (
      condition.supplyClaimed + claim.quantity > condition.maxClaimableSupply
    ) {
      CustomRevert.revertWith(DropFacet__ExceedsMaxClaimableSupply.selector);
    }

    if (block.timestamp < condition.startTimestamp) {
      CustomRevert.revertWith(DropFacet__ClaimHasNotStarted.selector);
    }

    if (
      condition.endTimestamp > 0 && block.timestamp >= condition.endTimestamp
    ) {
      CustomRevert.revertWith(DropFacet__ClaimHasEnded.selector);
    }

    // check if already claimed
    if (
      ds.supplyClaimedByWallet[claim.conditionId][claim.account].claimed > 0
    ) {
      CustomRevert.revertWith(DropFacet__AlreadyClaimed.selector);
    }

    bytes32 leaf = _createLeaf(claim.account, claim.quantity);
    if (!claim.proof.verifyCalldata(condition.merkleRoot, leaf)) {
      CustomRevert.revertWith(DropFacet__InvalidProof.selector);
    }
  }

  function _verifyPenaltyBps(
    ClaimCondition storage condition,
    Claim calldata claim,
    uint16 expectedPenaltyBps
  ) internal view returns (uint256 amount) {
    uint16 penaltyBps = condition.penaltyBps;
    if (penaltyBps != expectedPenaltyBps) {
      CustomRevert.revertWith(DropFacet__UnexpectedPenaltyBps.selector);
    }

    amount = claim.quantity;
    if (penaltyBps > 0) {
      unchecked {
        uint256 penaltyAmount = BasisPoints.calculate(
          claim.quantity,
          penaltyBps
        );
        amount = claim.quantity - penaltyAmount;
      }
    }

    return amount;
  }

  function _addClaimCondition(
    DropStorage.Layout storage ds,
    ClaimCondition calldata newCondition
  ) internal {
    (uint48 existingStartId, uint48 existingCount) = (
      ds.conditionStartId,
      ds.conditionCount
    );
    uint48 newConditionId = existingStartId + existingCount;

    // Check timestamp order
    if (existingCount > 0) {
      ClaimCondition storage lastCondition;
      unchecked {
        lastCondition = ds.conditionById[newConditionId - 1];
      }
      if (lastCondition.startTimestamp >= newCondition.startTimestamp) {
        CustomRevert.revertWith(
          DropFacet__ClaimConditionsNotInAscendingOrder.selector
        );
      }
    }

    // Store the new condition
    _updateClaimCondition(ds, newConditionId, newCondition);

    // Update condition count and highest ID
    ds.conditionCount = existingCount + 1;

    if (newConditionId > ds.highestConditionId) {
      ds.highestConditionId = newConditionId;
    }

    emit DropFacet_ClaimConditionAdded(newCondition);
  }

  function _getClaimConditions(
    DropStorage.Layout storage ds
  ) internal view returns (ClaimCondition[] memory conditions) {
    conditions = new ClaimCondition[](ds.conditionCount);
    for (uint48 i; i < ds.conditionCount; ++i) {
      conditions[i] = ds.conditionById[ds.conditionStartId + i];
    }
    return conditions;
  }

  function _setClaimConditions(
    DropStorage.Layout storage ds,
    ClaimCondition[] calldata conditions
  ) internal {
    // get the existing claim condition count and start id
    (uint48 existingStartId, uint48 existingConditionCount) = (
      ds.conditionStartId,
      ds.conditionCount
    );

    /// @dev If the claim conditions are being reset, we assign a new uid to the claim conditions.
    /// which ends up resetting the eligibility of the claim conditions in `supplyClaimedByWallet`.
    uint48 newStartId = existingStartId;
    uint48 newConditionCount = SafeCastLib.toUint48(conditions.length);

    uint48 lastConditionTimestamp;
    for (uint48 i; i < newConditionCount; ++i) {
      ClaimCondition calldata newCondition = conditions[i];
      if (lastConditionTimestamp >= newCondition.startTimestamp) {
        CustomRevert.revertWith(
          DropFacet__ClaimConditionsNotInAscendingOrder.selector
        );
      }

      // cache the condition id
      uint256 conditionId = newStartId + i;
      // check that amount already claimed is less than or equal to the max claimable supply
      ClaimCondition storage condition = ds.conditionById[conditionId];
      uint256 amountAlreadyClaimed = condition.supplyClaimed;

      if (amountAlreadyClaimed > newCondition.maxClaimableSupply) {
        CustomRevert.revertWith(DropFacet__CannotSetClaimConditions.selector);
      }

      // copy the new condition to the storage except `supplyClaimed`
      _updateClaimCondition(ds, conditionId, newCondition);
      lastConditionTimestamp = newCondition.startTimestamp;
    }

    ds.conditionCount = SafeCastLib.toUint48(newConditionCount);
    ds.conditionStartId = newStartId;

    // Update highest condition id if needed
    uint256 lastConditionId = newStartId + newConditionCount - 1;
    if (lastConditionId > ds.highestConditionId) {
      ds.highestConditionId = SafeCastLib.toUint48(lastConditionId);
    }

    if (existingConditionCount > newConditionCount) {
      for (uint256 i = newConditionCount; i < existingConditionCount; i++) {
        delete ds.conditionById[newStartId + i];
      }
    }

    emit DropFacet_ClaimConditionsUpdated(conditions);
  }

  function _updateClaimCondition(
    DropStorage.Layout storage ds,
    uint256 conditionId,
    ClaimCondition calldata newCondition
  ) internal {
    _verifyEnoughBalance(
      newCondition.currency,
      newCondition.maxClaimableSupply
    );

    ClaimCondition storage condition = ds.conditionById[conditionId];
    condition.startTimestamp = newCondition.startTimestamp;
    condition.endTimestamp = newCondition.endTimestamp;
    condition.maxClaimableSupply = newCondition.maxClaimableSupply;
    condition.merkleRoot = newCondition.merkleRoot;
    condition.currency = newCondition.currency;
    condition.penaltyBps = newCondition.penaltyBps;
  }

  function _updateClaim(
    DropStorage.Layout storage ds,
    uint256 conditionId,
    address account,
    uint256 amount
  ) internal {
    ds.conditionById[conditionId].supplyClaimed += amount;
    unchecked {
      ds.supplyClaimedByWallet[conditionId][account].claimed += amount;
    }
  }

  function _updateDepositId(
    DropStorage.Layout storage ds,
    uint256 conditionId,
    address account,
    uint256 depositId
  ) internal {
    ds.supplyClaimedByWallet[conditionId][account].depositId = depositId;
  }

  function _verifyEnoughBalance(
    address currency,
    uint256 amount
  ) internal view {
    if (amount > IERC20(currency).balanceOf(address(this))) {
      CustomRevert.revertWith(DropFacet__InsufficientBalance.selector);
    }
  }

  function _approveClaimToken(
    DropStorage.Layout storage ds,
    uint256 conditionId,
    uint256 amount
  ) internal {
    ClaimCondition storage condition = ds.conditionById[conditionId];
    IERC20(condition.currency).approve(ds.rewardsDistribution, amount);
  }

  function _setRewardsDistribution(
    DropStorage.Layout storage ds,
    address rewardsDistribution
  ) internal {
    if (rewardsDistribution == address(0)) {
      CustomRevert.revertWith(DropFacet__RewardsDistributionNotSet.selector);
    }

    ds.rewardsDistribution = rewardsDistribution;
  }

  // =============================================================
  //                        Utilities
  // =============================================================
  function _createLeaf(
    address account,
    uint256 amount
  ) internal pure returns (bytes32 leaf) {
    assembly ("memory-safe") {
      // Store the account address at memory location 0
      mstore(0, account)
      // Store the amount at memory location 0x20 (32 bytes after the account address)
      mstore(0x20, amount)
      // Compute the keccak256 hash of the account and amount, and store it at memory location 0
      mstore(0, keccak256(0, 0x40))
      // Compute the keccak256 hash of the previous hash (stored at memory location 0) and store it in the leaf variable
      leaf := keccak256(0, 0x20)
    }
  }
}

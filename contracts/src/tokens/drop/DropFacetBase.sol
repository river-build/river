// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDropFacetBase} from "./IDropFacet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// libraries
import {DropStorage} from "./DropStorage.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {MerkleProofLib} from "solady/utils/MerkleProofLib.sol";

// contracts

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

  function _setClaimConditions(
    DropStorage.Layout storage ds,
    ClaimCondition[] calldata conditions,
    bool resetEligibility
  ) internal {
    // get the existing claim condition count and start id
    uint256 existingStartId = ds.conditionStartId;
    uint256 existingConditionCount = ds.conditionCount;

    /// @dev If the claim conditions are being reset, we assign a new uid to the claim conditions.
    /// which ends up resetting the eligibility of the claim conditions in `supplyClaimedByWallet`.
    uint256 newConditionCount = conditions.length;
    uint256 newStartId = existingStartId;
    if (resetEligibility) {
      newStartId = existingStartId + existingConditionCount;
    }

    ds.conditionCount = newConditionCount;
    ds.conditionStartId = newStartId;

    uint256 lastConditionTimestamp;
    for (uint256 i; i < newConditionCount; ++i) {
      ClaimCondition calldata newCondition = conditions[i];
      if (lastConditionTimestamp >= newCondition.startTimestamp) {
        CustomRevert.revertWith(
          DropFacet__ClaimConditionsNotInAscendingOrder.selector
        );
      }

      // check that amount already claimed is less than or equal to the max claimable supply
      ClaimCondition storage condition = ds.conditionById[newStartId + i];
      uint256 amountAlreadyClaimed = condition.supplyClaimed;

      if (amountAlreadyClaimed > newCondition.maxClaimableSupply) {
        CustomRevert.revertWith(DropFacet__CannotSetClaimConditions.selector);
      }

      // copy the new condition to the storage except `supplyClaimed`
      condition.startTimestamp = newCondition.startTimestamp;
      condition.endTimestamp = newCondition.endTimestamp;
      condition.maxClaimableSupply = newCondition.maxClaimableSupply;
      condition.merkleRoot = newCondition.merkleRoot;
      condition.currency = newCondition.currency;
      condition.penaltyBps = newCondition.penaltyBps;
      lastConditionTimestamp = newCondition.startTimestamp;
    }

    // if resetEligibility is true, we assign new uids to the claim conditions
    // so we delete claim conditions with UID < newStartId
    if (resetEligibility) {
      for (uint256 i = existingStartId; i < newStartId; i++) {
        delete ds.conditionById[i];
      }
    } else {
      if (existingConditionCount > newConditionCount) {
        for (uint256 i = newConditionCount; i < existingConditionCount; i++) {
          delete ds.conditionById[newStartId + i];
        }
      }
    }

    emit DropFacet_ClaimConditionsUpdated(conditions, resetEligibility);
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

  function _approveClaimToken(
    DropStorage.Layout storage ds,
    uint256 conditionId,
    uint256 amount
  ) internal {
    ClaimCondition storage condition = ds.conditionById[conditionId];

    IERC20(condition.currency).approve(ds.rewardsDistribution, amount);
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDropFacetBase} from "./IDropFacet.sol";

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

    uint256 currentTimestamp = block.timestamp;
    uint256 lastConditionId = conditionStartId + conditionCount - 1;

    for (uint256 i = lastConditionId; i >= conditionStartId; i--) {
      ClaimCondition storage condition = ds.conditionById[i];
      if (
        currentTimestamp >= condition.startTimestamp &&
        (condition.endTimestamp == 0 ||
          currentTimestamp < condition.endTimestamp)
      ) {
        return i;
      }
    }

    CustomRevert.revertWith(DropFacet__NoActiveClaimCondition.selector);
  }

  function _verifyClaim(
    DropStorage.Layout storage ds,
    uint256 conditionId,
    address account,
    uint256 quantity,
    bytes32[] calldata proof
  ) internal view {
    ClaimCondition memory condition = ds.getClaimConditionById(conditionId);

    if (condition.merkleRoot == bytes32(0)) {
      CustomRevert.revertWith(DropFacet__MerkleRootNotSet.selector);
    }

    if (quantity == 0) {
      CustomRevert.revertWith(
        DropFacet__QuantityMustBeGreaterThanZero.selector
      );
    }

    // Check if the total claimed supply (including the current claim) exceeds the maximum claimable supply
    if (condition.supplyClaimed + quantity > condition.maxClaimableSupply) {
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
    if (ds.supplyClaimedByWallet[conditionId][account] > 0) {
      CustomRevert.revertWith(DropFacet__AlreadyClaimed.selector);
    }

    bytes32 leaf = _createLeaf(account, quantity);
    if (!proof.verifyCalldata(condition.merkleRoot, leaf)) {
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
    for (uint256 i = 0; i < newConditionCount; i++) {
      if (lastConditionTimestamp >= conditions[i].startTimestamp) {
        CustomRevert.revertWith(
          DropFacet__ClaimConditionsNotInAscendingOrder.selector
        );
      }

      // check that amount already claimed is less than or equal to the max claimable supply
      uint256 amountAlreadyClaimed = ds
        .conditionById[newStartId + i]
        .supplyClaimed;

      if (amountAlreadyClaimed > conditions[i].maxClaimableSupply) {
        CustomRevert.revertWith(DropFacet__CannotSetClaimConditions.selector);
      }

      ds.conditionById[newStartId + i] = conditions[i];
      ds.conditionById[newStartId + i].supplyClaimed = amountAlreadyClaimed;
      lastConditionTimestamp = conditions[i].startTimestamp;
    }

    // if _resetEligibility is true, we assign new uids to the claim conditions
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
    ds.supplyClaimedByWallet[conditionId][account] += amount;
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

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

  function __DropFacetBase_init_unchained(address claimToken) internal {
    DropStorage.layout().claimToken = claimToken;
  }

  function _getActiveConditionId(
    DropStorage.Layout storage ds
  ) internal view returns (uint256) {
    uint256 conditionStartId = ds.conditionStartId;
    uint256 conditionCount = ds.conditionCount;

    for (
      uint256 i = conditionStartId + conditionCount;
      i > conditionStartId;
      i--
    ) {
      if (block.timestamp >= ds.conditionById[i - 1].startTimestamp) {
        return i - 1;
      }
    }

    CustomRevert.revertWith(IDropFacet__NoActiveClaimCondition.selector);
  }

  function _verifyClaim(
    DropStorage.Layout storage ds,
    uint256 conditionId,
    address account,
    uint256 quantity,
    bytes32[] calldata proof
  ) internal view returns (bool) {
    ClaimCondition memory condition = ds.getClaimConditionById(conditionId);

    if (condition.merkleRoot == bytes32(0)) {
      CustomRevert.revertWith(IDropFacet__MerkleRootNotSet.selector);
    }

    if (quantity == 0) {
      CustomRevert.revertWith(
        IDropFacet__QuantityMustBeGreaterThanZero.selector
      );
    }

    if (condition.supplyClaimed + quantity > condition.maxClaimableSupply) {
      CustomRevert.revertWith(IDropFacet__ExceedsMaxClaimableSupply.selector);
    }

    if (block.timestamp < condition.startTimestamp) {
      CustomRevert.revertWith(IDropFacet__ClaimHasNotStarted.selector);
    }

    // check if already claimed
    if (ds.supplyClaimedByWallet[conditionId][account] > 0) {
      CustomRevert.revertWith(IDropFacet__AlreadyClaimed.selector);
    }

    bytes32 leaf = _createLeaf(account, quantity);
    if (!proof.verifyCalldata(condition.merkleRoot, leaf)) {
      CustomRevert.revertWith(IDropFacet__InvalidProof.selector);
    }

    return true;
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
          IDropFacet__ClaimConditionsNotInAscendingOrder.selector
        );
      }

      // check that amount already claimed is less than or equal to the max claimable supply
      uint256 amountAlreadyClaimed = ds
        .conditionById[newStartId + i]
        .supplyClaimed;
      if (amountAlreadyClaimed > conditions[i].maxClaimableSupply) {
        CustomRevert.revertWith(IDropFacet__CannotSetClaimConditions.selector);
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

  function _claim(
    address account,
    uint256 amount,
    bytes32[] calldata proof
  ) internal {
    DropStorage.Layout storage ds = DropStorage.layout();

    uint256 conditionId = _getActiveConditionId(ds);

    _verifyClaim(ds, conditionId, account, amount, proof);

    _updateClaim(ds, conditionId, account, amount);

    emit DropFacet_Claimed(account, amount);

    _transferClaimToken(account, amount);
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

  // =============================================================
  //                           Overrides
  // =============================================================

  function _transferClaimToken(
    address account,
    uint256 amount
  ) internal virtual;
}

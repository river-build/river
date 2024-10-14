// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDropFacet} from "./IDropFacet.sol";

// libraries

import {DropStorage} from "./DropStorage.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";

// contracts
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {OwnableBase} from "contracts/src/diamond/facets/ownable/OwnableBase.sol";
import {DropFacetBase} from "./DropFacetBase.sol";

contract DropFacet is IDropFacet, DropFacetBase, OwnableBase, Facet {
  using DropStorage for DropStorage.Layout;
  using SafeTransferLib for address;

  function __DropFacet_init(address claimToken) external initializer {
    __DropFacetBase_init_unchained(claimToken);
  }

  function getClaimToken() external view returns (address) {
    return DropStorage.layout().claimToken;
  }

  function claim(
    address account,
    uint256 quantity,
    bytes32[] calldata proof
  ) external {
    _claim(account, quantity, proof);
  }

  function setClaimConditions(
    ClaimCondition[] calldata conditions,
    bool resetEligibility
  ) external onlyOwner {
    DropStorage.Layout storage ds = DropStorage.layout();
    _setClaimConditions(ds, conditions, resetEligibility);
  }

  function getActiveClaimConditionId() external view returns (uint256) {
    return _getActiveConditionId(DropStorage.layout());
  }

  function getClaimConditionById(
    uint256 conditionId
  ) external view returns (ClaimCondition memory) {
    return DropStorage.layout().getClaimConditionById(conditionId);
  }

  function getSupplyClaimedByWallet(
    address account,
    uint256 conditionId
  ) external view returns (uint256) {
    return DropStorage.layout().getSupplyClaimedByWallet(conditionId, account);
  }

  function _transferClaimToken(
    address account,
    uint256 amount
  ) internal override {
    DropStorage.layout().claimToken.safeTransfer(account, amount);
  }
}

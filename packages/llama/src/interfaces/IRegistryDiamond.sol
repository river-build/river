// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IRegistryDiamond {
  /// @notice Add/replace/remove any number of functions and optionally execute
  /// @param Add Facets to add functions to.
  /// @param Replace Facets to replace functions in.
  /// @param Remove Facets to remove functions from.
  enum FacetCutAction {
    Add,
    Replace,
    Remove
  }

  /// @notice Execute a diamond cut
  /// @param facetAddress Facet to cut.
  /// @param action Enum of type FacetCutAction.
  /// @param functionSelectors Array of function selectors.
  struct FacetCut {
    address facetAddress;
    FacetCutAction action;
    bytes4[] functionSelectors;
  }

  function getActiveOperators() external view returns (address[] memory);
  function getWeeklyDistributionAmount() external view returns (uint256);
  function getPeriodDistributionAmount() external view returns (uint256);
  function distributeRewards(address operator) external;
  function diamondCut(
    FacetCut[] calldata facetCuts,
    address init,
    bytes calldata initPayload
  ) external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamond} from "contracts/src/diamond/IDiamond.sol";
import {IFacetRegistryBase} from "./IFacetRegistry.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {FacetRegistryStorage} from "./FacetRegistryStorage.sol";

// contracts
import {Factory} from "contracts/src/utils/Factory.sol";

abstract contract FacetRegistryBase is IFacetRegistryBase, Factory {
  using EnumerableSet for EnumerableSet.AddressSet;
  using EnumerableSet for EnumerableSet.Bytes32Set;

  function _addFacet(address facet, bytes4[] memory selectors) internal {
    if (facet == address(0)) revert FacetRegistry_FacetAddressZero();
    if (facet.code.length == 0) revert FacetRegistry_FacetNotContract();

    uint256 selectorsLen = selectors.length;
    if (selectorsLen == 0) revert FacetRegistry_FacetMustHaveSelectors();

    FacetRegistryStorage.Layout storage layout = FacetRegistryStorage.layout();

    if (!layout.facets.add(facet))
      revert FacetRegistry_FacetAlreadyRegistered();

    for (uint256 i; i < selectorsLen; i++) {
      layout.facetSelectors[facet].add(selectors[i]);
    }

    emit FacetRegistered(facet, selectors);
  }

  function _removeFacet(address facet) internal {
    FacetRegistryStorage.Layout storage layout = FacetRegistryStorage.layout();

    if (!layout.facets.remove(facet)) revert FacetRegistry_FacetNotRegistered();

    uint256 selectorsLen = layout.facetSelectors[facet].length();
    for (uint256 i; i < selectorsLen; i++) {
      layout.facetSelectors[facet].remove(layout.facetSelectors[facet].at(i));
    }

    emit FacetUnregistered(facet);
  }

  function _facets() internal view returns (address[] memory) {
    return FacetRegistryStorage.layout().facets.values();
  }

  function _facetSelectors(
    address facet
  ) internal view returns (bytes4[] memory) {
    FacetRegistryStorage.Layout storage layout = FacetRegistryStorage.layout();

    uint256 selectorsLen = layout.facetSelectors[facet].length();
    bytes4[] memory selectors = new bytes4[](selectorsLen);

    for (uint256 i; i < selectorsLen; i++) {
      selectors[i] = bytes4(layout.facetSelectors[facet].at(i));
    }

    return selectors;
  }

  function _hasFacet(address facet) internal view returns (bool) {
    return FacetRegistryStorage.layout().facets.contains(facet);
  }

  function _createFacet(
    bytes32 salt,
    bytes memory creationCode,
    bytes4[] memory selectors
  ) internal returns (address) {
    address facet = _deploy({initCode: creationCode, salt: salt});
    _addFacet(facet, selectors);
    return facet;
  }

  function _createFacetCut(
    address facet,
    IDiamond.FacetCutAction action
  ) internal view returns (IDiamond.FacetCut memory) {
    if (!_hasFacet(facet)) revert FacetRegistry_FacetNotRegistered();

    return
      IDiamond.FacetCut({
        facetAddress: facet,
        action: action,
        functionSelectors: _facetSelectors(facet)
      });
  }

  function _computeFacetAddress(
    bytes32 salt,
    bytes memory creationCode
  ) internal view returns (address) {
    return _calculateDeploymentAddress(keccak256(creationCode), salt);
  }
}

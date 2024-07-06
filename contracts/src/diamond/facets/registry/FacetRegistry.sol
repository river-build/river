// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IFacetRegistry} from "./IFacetRegistry.sol";
import {IDiamond} from "contracts/src/diamond/IDiamond.sol";

// libraries

// contracts
import {FacetRegistryBase} from "./FacetRegistryBase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract FacetRegistry is IFacetRegistry, FacetRegistryBase, Facet {
  function __FacetRegistry_init() external initializer {
    _addInterface(type(IFacetRegistry).interfaceId);
  }

  /// @inheritdoc IFacetRegistry
  function addFacet(address facet, bytes4[] calldata selectors) external {
    _addFacet(facet, selectors);
  }

  /// @inheritdoc IFacetRegistry
  function removeFacet(address facet) external {
    _removeFacet(facet);
  }

  /// @inheritdoc IFacetRegistry
  function facets() external view returns (address[] memory) {
    return _facets();
  }

  /// @inheritdoc IFacetRegistry
  function facetSelectors(
    address facet
  ) external view returns (bytes4[] memory) {
    return _facetSelectors(facet);
  }

  /// @inheritdoc IFacetRegistry
  function hasFacet(address facet) external view returns (bool) {
    return _hasFacet(facet);
  }

  /// @inheritdoc IFacetRegistry
  function createFacet(
    bytes32 salt,
    bytes calldata creationCode,
    bytes4[] calldata selectors
  ) external returns (address facet) {
    facet = _createFacet(salt, creationCode, selectors);
  }

  /// @inheritdoc IFacetRegistry
  function createFacetCut(
    address facet,
    IDiamond.FacetCutAction action
  ) external view returns (IDiamond.FacetCut memory facetCut) {
    return _createFacetCut(facet, action);
  }

  /// @inheritdoc IFacetRegistry
  function computeFacetAddress(
    bytes32 salt,
    bytes calldata creationCode
  ) external view returns (address facet) {
    facet = _computeFacetAddress(salt, creationCode);
  }
}

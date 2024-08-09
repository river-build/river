// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamondFactoryBase} from "contracts/src/diamond/facets/factory/IDiamondFactory.sol";
import {IERC165} from "contracts/src/diamond/facets/introspection/IERC165.sol";
import {IDiamondLoupe} from "contracts/src/diamond/facets/loupe/IDiamondLoupe.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {DiamondFactoryStorage} from "contracts/src/diamond/facets/factory/DiamondFactoryStorage.sol";

// contracts
import {Diamond} from "contracts/src/diamond/Diamond.sol";
import {Factory} from "contracts/src/utils/Factory.sol";

abstract contract DiamondFactoryBase is IDiamondFactoryBase, Factory {
  using EnumerableSet for EnumerableSet.AddressSet;

  function _createDiamond(
    Diamond.InitParams memory initParams
  ) internal returns (address diamond) {
    bytes memory initCode = abi.encodePacked(
      type(Diamond).creationCode,
      abi.encode(initParams)
    );

    diamond = _deploy({initCode: initCode});

    // Check if diamond has loupe facet, to avoid deploying invalid diamonds
    if (!IERC165(diamond).supportsInterface(type(IDiamondLoupe).interfaceId)) {
      revert DiamondFactory_LoupeNotSupported();
    }

    emit DiamondCreated(diamond, msg.sender);
  }

  function _addDefaultFacet(address facet) internal {
    DiamondFactoryStorage.Layout storage layout = DiamondFactoryStorage
      .layout();

    if (!layout.defaultFacets.add(facet)) {
      revert DiamondFactory_FacetAlreadyAdded(facet);
    }

    emit DefaultFacetAdded(facet, msg.sender);
  }

  function _removeDefaultFacet(address facet) internal {
    DiamondFactoryStorage.Layout storage layout = DiamondFactoryStorage
      .layout();

    if (!layout.defaultFacets.remove(facet)) {
      revert DiamondFactory_FacetNotRegistered(facet);
    }

    emit DefaultFacetRemoved(facet, msg.sender);
  }

  function _defaultFacets() internal view returns (address[] memory) {
    DiamondFactoryStorage.Layout storage layout = DiamondFactoryStorage
      .layout();
    return layout.defaultFacets.values();
  }

  function _hasDefaultFacet(address facet) internal view returns (bool) {
    return DiamondFactoryStorage.layout().defaultFacets.contains(facet);
  }

  function _setMultiInit(address multiInit) internal {
    DiamondFactoryStorage.Layout storage layout = DiamondFactoryStorage
      .layout();
    layout.multiInit = multiInit;
    emit MultiInitSet(multiInit, msg.sender);
  }

  function _multiInit() internal view returns (address) {
    return DiamondFactoryStorage.layout().multiInit;
  }

  function _mergeArrays(
    address[] memory array1,
    address[] memory array2
  ) internal pure returns (address[] memory) {
    // Create a new array with length equal to the sum of both input arrays
    address[] memory mergedArray = new address[](array1.length + array2.length);

    // Copy elements from the first array to the merged array
    for (uint256 i = 0; i < array1.length; i++) {
      mergedArray[i] = array1[i];
    }

    // Copy elements from the second array to the merged array
    for (uint256 j = 0; j < array2.length; j++) {
      mergedArray[array1.length + j] = array2[j];
    }

    return mergedArray;
  }
}

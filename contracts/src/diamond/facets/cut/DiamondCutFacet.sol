// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamond} from "@river-build/diamond/src/Diamond.sol";
import {IDiamondCut} from "@river-build/diamond/src/facets/cut/IDiamondCut.sol";

// libraries

// contracts
import {Facet} from "./Facet.sol";
import {DiamondCutBase} from "@river-build/diamond/src/facets/cut/DiamondCutBase.sol";
import {OwnableBase} from "@river-build/diamond/src/facets/ownable/OwnableBase.sol";

// debugging
import {console} from "forge-std/console.sol";

contract DiamondCutFacet is IDiamondCut, OwnableBase, Facet {
  function __DiamondCut_init() external onlyInitializing {
    _addInterface(type(IDiamondCut).interfaceId);
  }

  /// @inheritdoc IDiamondCut
  function diamondCut(
    IDiamond.FacetCut[] memory facetCuts,
    address init,
    bytes memory initPayload
  ) external onlyOwner reinitializer(_getInitializedVersion() + 1) {
    console.log("running new diamondCut", _getInitializedVersion());
    DiamondCutBase.diamondCut(facetCuts, init, initPayload);
  }
}

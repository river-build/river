// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//interfaces

//libraries

//contracts
import {IDiamond, Diamond} from "@river-build/diamond/src/Diamond.sol";

interface IDiamondInitHelper is IDiamond {
  function diamondInitHelper(
    address deployer,
    string[] memory facetNames
  ) external returns (FacetCut[] memory);
}

abstract contract DiamondHelper is IDiamondInitHelper {
  string public name = "DiamondHelper";

  uint256 private _index = 0;

  FacetCut[] internal _cuts;
  address[] internal _initAddresses;
  bytes[] internal _initDatas;

  function addInit(address initAddress, bytes memory initData) internal {
    _initAddresses.push(initAddress);
    _initDatas.push(initData);
  }

  function addCut(FacetCut memory cut) internal {
    _cuts.push(cut);
  }

  function clearCuts() internal {
    delete _cuts;
  }

  function addFacet(
    FacetCut memory cut,
    address initAddress,
    bytes memory initData
  ) public {
    addCut(cut);
    addInit(initAddress, initData);
  }

  function getCuts() external view returns (FacetCut[] memory) {
    return _cuts;
  }

  function baseFacets() internal view returns (FacetCut[] memory) {
    return _cuts;
  }

  function diamondInitHelper(
    address, // deployer
    string[] memory // facetNames
  ) external virtual returns (FacetCut[] memory) {
    return new FacetCut[](0);
  }

  function _resetIndex() internal {
    _index = 0;
  }
}

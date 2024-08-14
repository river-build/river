// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamond} from "contracts/src/diamond/IDiamond.sol";

// libraries

// contracts
import {Proxy} from "contracts/src/diamond/proxy/Proxy.sol";
import {DiamondCutBase} from "contracts/src/diamond/facets/cut/DiamondCutBase.sol";
import {DiamondLoupeBase} from "contracts/src/diamond/facets/loupe/DiamondLoupeBase.sol";
import {Initializable} from "contracts/src/diamond/facets/initializable/Initializable.sol";
import {Diamond} from "contracts/src/diamond/Diamond.sol";

contract SpaceDiamond is
  IDiamond,
  Proxy,
  DiamondCutBase,
  DiamondLoupeBase,
  Initializable
{
  constructor(Diamond.InitParams memory initDiamondCut) initializer {
    _diamondCut(
      initDiamondCut.baseFacets,
      initDiamondCut.init,
      initDiamondCut.initData
    );
  }

  receive() external payable {}

  // =============================================================
  //                           Internal
  // =============================================================
  function _getImplementation()
    internal
    view
    virtual
    override
    returns (address facet)
  {
    facet = _facetAddress(msg.sig);
    if (facet == address(0)) revert Diamond_UnsupportedFunction();
  }
}

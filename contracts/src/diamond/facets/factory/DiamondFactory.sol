// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamondFactory} from "contracts/src/diamond/facets/factory/IDiamondFactory.sol";

// libraries

// contracts
import {Diamond} from "contracts/src/diamond/Diamond.sol";
import {DiamondFactoryBase} from "contracts/src/diamond/facets/factory/DiamondFactoryBase.sol";
import {Facet} from "contracts/src/diamond/facets/Facet.sol";

contract DiamondFactory is IDiamondFactory, DiamondFactoryBase, Facet {
  function __DiamondFactory_init() external initializer {
    _addInterface(type(IDiamondFactory).interfaceId);
  }

  function createDiamond(
    Diamond.InitParams memory initParams
  ) external returns (address diamond) {
    diamond = _createDiamond(initParams);
  }
}

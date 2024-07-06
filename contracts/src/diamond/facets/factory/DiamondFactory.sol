// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamondFactory} from "contracts/src/diamond/facets/factory/IDiamondFactory.sol";
import {IERC165} from "contracts/src/diamond/facets/introspection/IERC165.sol";
import {IDiamondLoupe} from "contracts/src/diamond/facets/loupe/IDiamondLoupe.sol";

// libraries

// contracts
import {Diamond} from "contracts/src/diamond/Diamond.sol";
import {Factory} from "contracts/src/utils/Factory.sol";

contract DiamondFactory is IDiamondFactory, Factory {
  function createDiamond(
    Diamond.InitParams memory initParams
  ) external returns (address diamond) {
    bytes memory initCode = abi.encodePacked(
      type(Diamond).creationCode,
      abi.encode(initParams)
    );

    diamond = _deploy(initCode);

    // Check if diamond has loupe facet
    if (!IERC165(diamond).supportsInterface(type(IDiamondLoupe).interfaceId)) {
      revert DiamondFactory_LoupeNotSupported();
    }

    emit DiamondCreated(diamond, msg.sender);
  }
}

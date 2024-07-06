// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IDiamondFactoryBase} from "contracts/src/diamond/facets/factory/IDiamondFactory.sol";
import {IERC165} from "contracts/src/diamond/facets/introspection/IERC165.sol";
import {IDiamondLoupe} from "contracts/src/diamond/facets/loupe/IDiamondLoupe.sol";

// libraries

// contracts
import {Diamond} from "contracts/src/diamond/Diamond.sol";
import {Factory} from "contracts/src/utils/Factory.sol";

abstract contract DiamondFactoryBase is IDiamondFactoryBase, Factory {
  function _createDiamond(
    Diamond.InitParams memory initParams
  ) internal returns (address diamond) {
    bytes memory initCode = abi.encodePacked(
      type(Diamond).creationCode,
      abi.encode(initParams)
    );

    diamond = _deploy({
      initCode: initCode,
      salt: keccak256(abi.encodePacked(msg.sender, block.timestamp))
    });

    // Check if diamond has loupe facet, to avoid deploying invalid diamonds
    if (!IERC165(diamond).supportsInterface(type(IDiamondLoupe).interfaceId)) {
      revert DiamondFactory_LoupeNotSupported();
    }

    emit DiamondCreated(diamond, msg.sender);
  }
}

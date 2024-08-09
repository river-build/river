// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {DiamondFactory} from "contracts/src/diamond/facets/factory/DiamondFactory.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";

contract DeployDiamondFactory is FacetHelper, Deployer {
  constructor() {
    addSelector(DiamondFactory.createDiamond.selector);
    addSelector(DiamondFactory.createOfficialDiamond.selector);
    addSelector(DiamondFactory.addDefaultFacet.selector);
    addSelector(DiamondFactory.removeDefaultFacet.selector);
    addSelector(DiamondFactory.setMultiInit.selector);
  }

  function initializer() public pure override returns (bytes4) {
    return DiamondFactory.__DiamondFactory_init.selector;
  }

  function versionName() public pure override returns (string memory) {
    return "diamondFactory";
  }

  function makeInitData(address multiInit) public pure returns (bytes memory) {
    return
      abi.encodeWithSelector(
        DiamondFactory.__DiamondFactory_init.selector,
        multiInit
      );
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    DiamondFactory facet = new DiamondFactory();
    vm.stopBroadcast();
    return address(facet);
  }
}

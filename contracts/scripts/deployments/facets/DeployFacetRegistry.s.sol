// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {FacetRegistry} from "contracts/src/diamond/facets/registry/FacetRegistry.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";

contract DeployFacetRegistry is FacetHelper, Deployer {
  constructor() {
    addSelector(FacetRegistry.addFacet.selector);
    addSelector(FacetRegistry.removeFacet.selector);
    addSelector(FacetRegistry.facets.selector);
    addSelector(FacetRegistry.facetSelectors.selector);
    addSelector(FacetRegistry.hasFacet.selector);
    addSelector(FacetRegistry.createFacet.selector);
    addSelector(FacetRegistry.createFacetCut.selector);
    addSelector(FacetRegistry.computeFacetAddress.selector);
  }

  function initializer() public pure override returns (bytes4) {
    return FacetRegistry.__FacetRegistry_init.selector;
  }

  function versionName() public pure override returns (string memory) {
    return "facetRegistry";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    FacetRegistry facet = new FacetRegistry();
    vm.stopBroadcast();
    return address(facet);
  }
}

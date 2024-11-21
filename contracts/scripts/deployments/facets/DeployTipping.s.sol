// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {Tipping} from "contracts/src/spaces/facets/tipping/Tipping.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";

contract DeployTipping is FacetHelper, Deployer {
  constructor() {
    addSelector(Tipping.tip.selector);
  }

  function initializer() public pure override returns (bytes4) {
    return Tipping.__Tipping_init.selector;
  }

  function versionName() public pure override returns (string memory) {
    return "tippingFacet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    Tipping tipping = new Tipping();
    vm.stopBroadcast();
    return address(tipping);
  }
}

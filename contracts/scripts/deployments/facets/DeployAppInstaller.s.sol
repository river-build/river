// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "contracts/scripts/common/Deployer.s.sol";
import {AppInstaller} from "contracts/src/app/facets/AppInstaller.sol";
import {FacetHelper} from "contracts/test/diamond/Facet.t.sol";

contract DeployAppInstaller is FacetHelper, Deployer {
  constructor() {
    addSelector(AppInstaller.install.selector);
    addSelector(AppInstaller.installedApps.selector);
    addSelector(AppInstaller.name.selector);
    addSelector(AppInstaller.symbol.selector);
    addSelector(AppInstaller.tokenURI.selector);
  }

  function versionName() public pure override returns (string memory) {
    return "appInstallerFacet";
  }

  function __deploy(address deployer) public override returns (address) {
    vm.startBroadcast(deployer);
    AppInstaller appInstaller = new AppInstaller();
    vm.stopBroadcast();
    return address(appInstaller);
  }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

//interfaces
import {IAppHooks} from "contracts/src/app/interfaces/IAppHooks.sol";
import {IAppRegistryBase} from "contracts/src/app/interfaces/IAppRegistry.sol";
//libraries
import {App} from "contracts/src/app/libraries/App.sol";
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";

//contracts
import {AppRegistry} from "contracts/src/app/facets/AppRegistry.sol";
import {AppInstaller} from "contracts/src/app/facets/AppInstaller.sol";

import {DeployAppStore} from "contracts/scripts/deployments/diamonds/DeployAppStore.s.sol";
contract AppRegistryTest is TestUtils, IAppRegistryBase {
  DeployAppStore deployAppStore = new DeployAppStore();

  AppRegistry public appRegistry;
  AppInstaller public appInstaller;

  function setUp() external {
    address deployer = getDeployer();
    address appStore = deployAppStore.deploy(deployer);

    appRegistry = AppRegistry(appStore);
    appInstaller = AppInstaller(appStore);
  }

  function test_register() external {
    address owner = _randomAddress();
    address user = _randomAddress();

    string[] memory permissions = new string[](1);
    permissions[0] = Permissions.Read;

    vm.prank(owner);
    uint256 appId = appRegistry.register(
      Registration({
        appAddress: _randomAddress(),
        owner: owner,
        uri: "https://app.com",
        permissions: permissions,
        hooks: IAppHooks(address(0)),
        name: "App",
        symbol: "APP"
      })
    );

    vm.prank(user);
    appInstaller.install(appId);

    uint256[] memory installedApps = appInstaller.installedApps(user);
    assertContains(installedApps, appId);

    assertEq(appInstaller.name(appId), "App");
    assertEq(appInstaller.symbol(appId), "APP");
  }
}

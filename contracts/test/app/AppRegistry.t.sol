// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

// utils
import {TestUtils} from "contracts/test/utils/TestUtils.sol";

//interfaces
import {IAppHooks} from "contracts/src/app/hooks/IAppHooks.sol";
//libraries
import {AppConfig} from "contracts/src/app/registry/AppConfig.sol";
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";

//contracts
import {AppRegistry} from "contracts/src/app/registry/AppRegistry.sol";

contract AppRegistryTest is TestUtils {
  AppRegistry public appRegistry;

  function setUp() external {
    appRegistry = new AppRegistry();
  }

  function test_register() external {
    address owner = _randomAddress();

    string[] memory permissions = new string[](1);
    permissions[0] = Permissions.Read;

    vm.prank(owner);
    appRegistry.register(
      AppConfig({
        owner: owner,
        uri: "https://app.com",
        permissions: permissions,
        hooks: IAppHooks(address(0))
      })
    );
  }
}

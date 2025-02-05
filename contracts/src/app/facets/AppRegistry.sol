// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IAppRegistry} from "contracts/src/app/interfaces/IAppRegistry.sol";
// libraries
import {HookManager} from "contracts/src/app/libraries/HookManager.sol";
import {AppRegistryStore} from "contracts/src/app/storage/AppRegistryStore.sol";
import {App} from "contracts/src/app/libraries/App.sol";
import {EnumerableSetLib} from "solady/utils/EnumerableSetLib.sol";

// contracts

// structs

contract AppRegistry is IAppRegistry {
  using EnumerableSetLib for EnumerableSetLib.Bytes32Set;
  using App for App.Config;

  function register(
    Registration calldata registration
  ) external returns (uint256) {
    HookManager.beforeInitialize(registration.hooks);

    AppRegistryStore.Layout storage ds = AppRegistryStore.layout();

    uint256 tokenId = ds.nextAppId++;
    App.Config storage config = ds.registrations[tokenId];

    config.initialize(
      tokenId,
      registration.appAddress,
      registration.owner,
      registration.uri,
      registration.permissions,
      registration.name,
      registration.symbol
    );

    emit AppRegistered(
      registration.owner,
      registration.appAddress,
      tokenId,
      registration
    );

    HookManager.afterInitialize(registration.hooks);

    return tokenId;
  }

  function appInfo(uint256 appId) external view returns (App.Config memory) {
    return AppRegistryStore.layout().registrations[appId];
  }
}

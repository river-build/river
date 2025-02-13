// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IAppRegistry} from "contracts/src/app/interfaces/IAppRegistry.sol";

// libraries
import {HookManager} from "contracts/src/app/libraries/HookManager.sol";
import {AppRegistryStore} from "contracts/src/app/storage/AppRegistryStore.sol";
import {App} from "contracts/src/app/libraries/App.sol";
import {EnumerableSetLib} from "solady/utils/EnumerableSetLib.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {StringSet} from "contracts/src/utils/StringSet.sol";
// contracts

// structs

contract AppRegistry is IAppRegistry {
  using EnumerableSetLib for EnumerableSetLib.Bytes32Set;
  using StringSet for StringSet.Set;
  using App for App.Config;

  function register(
    Registration calldata registration
  ) external returns (uint256) {
    if (!HookManager.isValidHookAddress(registration.hooks))
      CustomRevert.revertWith(
        HookManager.HookAddressNotValid.selector,
        address(registration.hooks)
      );

    HookManager.beforeInitialize(registration.hooks);

    AppRegistryStore.Layout storage ds = AppRegistryStore.layout();

    uint256 tokenId = ds.nextAppId++;

    App.Config storage config = ds.registrations[tokenId];

    config.initialize(
      tokenId,
      registration.appAddress,
      registration.owner,
      registration.uri,
      registration.name,
      registration.symbol,
      registration.permissions
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

  function appInfo(
    uint256 appId
  ) external view returns (address appAddress, string[] memory permissions) {
    App.Config storage config = AppRegistryStore.layout().registrations[appId];
    return (config.appAddress, config.permissions.values());
  }
}

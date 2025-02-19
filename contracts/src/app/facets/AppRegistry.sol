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
import {Validator} from "contracts/src/utils/Validator.sol";
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";
import {StringSet} from "contracts/src/utils/StringSet.sol";
import {LibString} from "solady/utils/LibString.sol";
// contracts

// structs

contract AppRegistry is IAppRegistry {
  using EnumerableSetLib for EnumerableSetLib.Uint256Set;
  using EnumerableSetLib for EnumerableSetLib.Bytes32Set;
  using App for App.Config;
  using StringSet for StringSet.Set;

  function register(
    Registration calldata registration
  ) external returns (uint256) {
    Validator.checkAddress(registration.appAddress);
    Validator.checkAddress(registration.owner);
    Validator.checkStringLength(registration.uri);
    Validator.checkStringLength(registration.name);
    Validator.checkStringLength(registration.symbol);

    if (msg.sender != registration.owner)
      CustomRevert.revertWith(AppNotOwnedBySender.selector);

    if (registration.disabled) CustomRevert.revertWith(AppDisabled.selector);

    if (registration.permissions.length == 0)
      CustomRevert.revertWith(AppPermissionsMissing.selector);

    _validatePermissions(registration.permissions);

    if (!HookManager.isValidHookAddress(registration.hooks))
      CustomRevert.revertWith(
        HookManager.HookAddressNotValid.selector,
        address(registration.hooks)
      );

    AppRegistryStore.Layout storage ds = AppRegistryStore.layout();

    if (ds.appIdByAddress[registration.appAddress] != 0)
      CustomRevert.revertWith(AppAlreadyRegistered.selector);

    HookManager.beforeInitialize(registration.hooks);

    uint256 tokenId = ++ds.nextAppId; // start at 1

    ds.appIdByAddress[registration.appAddress] = tokenId;
    App.Config storage config = ds.registrations[tokenId];

    config.initialize(tokenId, registration);

    emit AppRegistered(
      registration.owner,
      registration.appAddress,
      tokenId,
      registration
    );

    HookManager.afterInitialize(registration.hooks);

    return tokenId;
  }

  function isRegistered(address appAddress) external view returns (bool) {
    return AppRegistryStore.layout().appIdByAddress[appAddress] != 0;
  }

  function getRegistration(
    address appAddress
  ) external view returns (Registration memory) {
    uint256 appId = AppRegistryStore.layout().appIdByAddress[appAddress];
    App.Config storage config = AppRegistryStore.layout().registrations[appId];

    if (!config.exists()) CustomRevert.revertWith(AppNotRegistered.selector);

    return
      Registration({
        appAddress: config.appAddress,
        owner: config.owner,
        uri: config.uri,
        name: config.name,
        symbol: config.symbol,
        permissions: config.permissions.values(),
        disabled: config.disabled,
        hooks: config.hooks
      });
  }

  function updateRegistration(
    uint256 appId,
    UpdateRegistration calldata registration
  ) external {
    Validator.checkStringLength(registration.uri);

    App.Config storage config = AppRegistryStore.layout().registrations[appId];

    if (!config.exists()) CustomRevert.revertWith(AppNotRegistered.selector);

    if (msg.sender != config.owner)
      CustomRevert.revertWith(AppNotOwnedBySender.selector);

    _validatePermissions(registration.permissions);

    config.update(registration);

    emit AppUpdated(config.owner, config.appAddress, appId, registration);
  }

  function _validatePermissions(string[] memory permissions) internal pure {
    if (permissions.length == 0) return;
    for (uint256 i; i < permissions.length; ++i) {
      if (
        LibString.eq(permissions[i], Permissions.InstallApp) ||
        LibString.eq(permissions[i], Permissions.UninstallApp) ||
        LibString.eq(permissions[i], Permissions.ModifyBanning) ||
        LibString.eq(permissions[i], Permissions.ModifyChannel) ||
        LibString.eq(permissions[i], Permissions.ModifySpaceSettings) ||
        LibString.eq(permissions[i], Permissions.JoinSpace)
      ) CustomRevert.revertWith(AppPermissionNotAllowed.selector);
    }
  }
}

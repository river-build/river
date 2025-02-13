// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IAppRegistryBase} from "contracts/src/app/interfaces/IAppRegistry.sol";
import {IAppInstaller} from "contracts/src/app/interfaces/IAppInstaller.sol";

// libraries
import {App} from "contracts/src/app/libraries/App.sol";
import {Account} from "contracts/src/app/libraries/Account.sol";
import {AppRegistryStore} from "contracts/src/app/storage/AppRegistryStore.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {EnumerableSetLib} from "solady/utils/EnumerableSetLib.sol";

// contracts
import {ERC6909} from "solady/tokens/ERC6909.sol";

contract AppInstaller is ERC6909, IAppInstaller {
  using CustomRevert for bytes4;
  using App for App.Config;
  using Account for Account.Installation;
  using EnumerableSetLib for EnumerableSetLib.Bytes32Set;
  function name(uint256 id) public view override returns (string memory) {
    return AppRegistryStore.layout().registrations[id].name;
  }

  function symbol(uint256 id) public view override returns (string memory) {
    return AppRegistryStore.layout().registrations[id].symbol;
  }

  function tokenURI(uint256 id) public view override returns (string memory) {
    return AppRegistryStore.layout().registrations[id].uri;
  }

  function install(uint256 appId, bytes32 channelId) external {
    App.Config storage config = AppRegistryStore.layout().registrations[appId];

    if (!config.exists())
      IAppRegistryBase.AppNotRegistered.selector.revertWith();

    Account.Installation storage installation = AppRegistryStore
      .layout()
      .installations[msg.sender];

    if (installation.installed(appId, channelId))
      AppAlreadyInstalled.selector.revertWith();

    installation.install(appId, channelId, config.permissions.values());

    if (balanceOf(msg.sender, appId) == 0) _mint(msg.sender, appId, 1);

    emit AppInstalled(msg.sender, appId, config.appAddress);
  }

  function uninstall(uint256 appId, bytes32 channelId) external {
    App.Config storage config = AppRegistryStore.layout().registrations[appId];

    if (!config.exists())
      IAppRegistryBase.AppNotRegistered.selector.revertWith();

    Account.Installation storage installation = AppRegistryStore
      .layout()
      .installations[msg.sender];

    bool burnNFT = installation.uninstall(appId, channelId);
    if (burnNFT && balanceOf(msg.sender, appId) == 1)
      _burn(msg.sender, appId, 1);

    emit AppUninstalled(msg.sender, appId, config.appAddress);
  }

  function installedApps(
    address account
  ) external view returns (uint256[] memory) {
    Account.Installation storage installation = AppRegistryStore
      .layout()
      .installations[account];
    return installation.apps();
  }

  function isInstalled(
    address account,
    uint256 appId,
    bytes32 channelId
  ) external view returns (bool) {
    Account.Installation storage installation = AppRegistryStore
      .layout()
      .installations[account];
    return installation.installed(appId, channelId);
  }

  function isEntitled(
    bytes32 channelId,
    address appAddress,
    bytes32 permission
  ) external view returns (bool) {
    AppRegistryStore.Layout storage ds = AppRegistryStore.layout();

    Account.Installation storage installation = ds.installations[msg.sender];

    uint256 appId = ds.appIdByAddress[appAddress];
    if (appId == 0) return false;
    if (balanceOf(msg.sender, appId) == 0) return false;

    return installation.isEntitled(appId, channelId, permission);
  }
}

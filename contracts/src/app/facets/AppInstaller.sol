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
import {StringSet} from "contracts/src/utils/StringSet.sol";

// contracts
import {ERC6909} from "solady/tokens/ERC6909.sol";

contract AppInstaller is ERC6909, IAppInstaller {
  using CustomRevert for bytes4;
  using App for App.Config;
  using Account for Account.Installation;
  using StringSet for StringSet.Set;

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
}

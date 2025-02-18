// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IAppInstaller} from "contracts/src/app/interfaces/IAppInstaller.sol";

// libraries
import {Implementations} from "contracts/src/spaces/facets/Implementations.sol";

// contracts

library InstallLib {
  function installApp(uint256 appId, bytes32[] memory channelIds) internal {
    address appRegistry = Implementations.appRegistry();
    IAppInstaller(appRegistry).install(appId, channelIds);
  }

  function uninstallApp(uint256 appId, bytes32[] memory channelIds) internal {
    address appRegistry = Implementations.appRegistry();
    IAppInstaller(appRegistry).uninstall(appId, channelIds);
  }

  function isEntitled(
    bytes32 channelId,
    address appAddress,
    bytes32 permission
  ) internal view returns (bool) {
    address appRegistry = Implementations.appRegistry();
    return
      IAppInstaller(appRegistry).isEntitled(channelId, appAddress, permission);
  }
}

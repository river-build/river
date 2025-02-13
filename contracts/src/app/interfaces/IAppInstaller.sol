// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
interface IAppInstallerBase {
  event AppInstalled(
    address indexed account,
    uint256 indexed appId,
    address indexed appAddress
  );

  error AppAlreadyInstalled();
}

interface IAppInstaller is IAppInstallerBase {
  function install(uint256 appId, bytes32 channelId) external;

  function installedApps(
    address account
  ) external view returns (uint256[] memory);

  function isInstalled(
    address account,
    uint256 appId,
    bytes32 channelId
  ) external view returns (bool);
}

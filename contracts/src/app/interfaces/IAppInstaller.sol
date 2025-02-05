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
  function install(uint256 appId) external;

  function installedApps(
    address account
  ) external view returns (uint256[] memory);
}

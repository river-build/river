// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
interface IAppInstallerBase {
  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                        Events                              */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
  event AppInstalled(
    address indexed account,
    uint256 indexed appId,
    bytes32[] channelIds
  );

  event AppUninstalled(
    address indexed account,
    uint256 indexed appId,
    bytes32[] channelIds
  );

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                         Errors                             */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
  error AppAlreadyInstalled();
  error AppNotInstalled();
}

interface IAppInstaller is IAppInstallerBase {
  function install(uint256 appId, bytes32[] memory channelIds) external;

  function uninstall(uint256 appId, bytes32[] memory channelIds) external;

  function installedApps(
    address account
  ) external view returns (uint256[] memory);

  function isInstalled(
    address account,
    uint256 appId,
    bytes32[] memory channelIds
  ) external view returns (bool);

  function isEntitled(
    bytes32 channelId,
    address appAddress,
    bytes32 permission
  ) external view returns (bool);
}

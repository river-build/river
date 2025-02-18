// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface IInstallFacet {
  function installApp(uint256 appId, bytes32[] memory channelIds) external;

  function uninstallApp(uint256 appId, bytes32[] memory channelIds) external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {EnumerableSetLib} from "solady/utils/EnumerableSetLib.sol";
import {StringSet} from "contracts/src/utils/StringSet.sol";

// contracts

library Account {
  using EnumerableSetLib for EnumerableSetLib.Uint256Set;
  using EnumerableSetLib for EnumerableSetLib.Bytes32Set;
  using StringSet for StringSet.Set;

  struct Info {
    bool disabled;
    uint256 updatedAt;
    EnumerableSetLib.Bytes32Set channels;
    EnumerableSetLib.Bytes32Set permissions;
  }

  struct Installation {
    EnumerableSetLib.Uint256Set installedApps;
    mapping(uint256 appId => Info info) installation;
  }

  function installed(
    Installation storage self,
    uint256 appId,
    bytes32[] memory channelIds
  ) internal view returns (bool) {
    bool isChannelIdInSet;
    for (uint256 i; i < channelIds.length; ++i) {
      isChannelIdInSet = self.installation[appId].channels.contains(
        channelIds[i]
      );
      if (isChannelIdInSet) break;
    }

    return
      self.installedApps.contains(appId) &&
      (channelIds.length == 0 || isChannelIdInSet);
  }

  function install(
    Installation storage self,
    uint256 appId,
    bytes32[] memory channelIds,
    bytes32[] memory permissions
  ) internal {
    self.installation[appId].updatedAt = block.timestamp;
    for (uint256 i; i < channelIds.length; ++i) {
      self.installation[appId].channels.add(channelIds[i]);
    }
    self.installedApps.add(appId);
    for (uint256 i; i < permissions.length; ++i) {
      self.installation[appId].permissions.add(permissions[i]);
    }
  }

  function uninstall(
    Installation storage self,
    uint256 appId,
    bytes32[] memory channelIds
  ) internal returns (bool) {
    uint256 channelsLength = channelIds.length;

    for (uint256 i; i < channelsLength; ++i) {
      self.installation[appId].channels.remove(channelIds[i]);
    }

    bool isFullyUninstalled = false;
    if (self.installation[appId].channels.length() == 0) {
      uint256 permissionsLength = self.installation[appId].permissions.length();
      bytes32[] memory permissionsToRemove = new bytes32[](permissionsLength);
      for (uint256 i; i < permissionsLength; ++i) {
        permissionsToRemove[i] = self.installation[appId].permissions.at(i);
      }

      for (uint256 i; i < permissionsLength; ++i) {
        self.installation[appId].permissions.remove(permissionsToRemove[i]);
      }

      isFullyUninstalled = true;
      self.installedApps.remove(appId);
      delete self.installation[appId];
    }

    return isFullyUninstalled;
  }

  function getApps(
    Installation storage self
  ) internal view returns (uint256[] memory) {
    return self.installedApps.values();
  }

  function getChannels(
    Installation storage self,
    uint256 appId
  ) internal view returns (bytes32[] memory) {
    return self.installation[appId].channels.values();
  }

  function getPermissions(
    Installation storage self,
    uint256 appId
  ) internal view returns (bytes32[] memory) {
    return self.installation[appId].permissions.values();
  }

  function isEntitled(
    Installation storage self,
    uint256 appId,
    bytes32 channelId,
    bytes32 permission
  ) internal view returns (bool) {
    return
      self.installedApps.contains(appId) &&
      (channelId == bytes32(0) ||
        self.installation[appId].channels.contains(channelId)) &&
      self.installation[appId].permissions.contains(permission);
  }
}

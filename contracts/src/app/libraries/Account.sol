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
    bytes32 channelId
  ) internal view returns (bool) {
    return
      self.installedApps.contains(appId) &&
      (channelId == bytes32(0) ||
        self.installation[appId].channels.contains(channelId));
  }

  function install(
    Installation storage self,
    uint256 appId,
    bytes32 channelId,
    bytes32[] memory permissions
  ) internal {
    self.installation[appId].updatedAt = block.timestamp;
    if (channelId != bytes32(0))
      self.installation[appId].channels.add(channelId);
    self.installedApps.add(appId);
    for (uint256 i; i < permissions.length; ++i) {
      self.installation[appId].permissions.add(permissions[i]);
    }
  }

  function uninstall(
    Installation storage self,
    uint256 appId,
    bytes32 channelId
  ) internal returns (bool) {
    if (channelId != bytes32(0))
      self.installation[appId].channels.remove(channelId);

    if (self.installation[appId].channels.length() == 0) {
      delete self.installation[appId];
      self.installedApps.remove(appId);
    }

    return self.installation[appId].channels.length() == 0;
  }

  function apps(
    Installation storage self
  ) internal view returns (uint256[] memory) {
    return self.installedApps.values();
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {EnumerableSetLib} from "solady/utils/EnumerableSetLib.sol";

// contracts

library Account {
  using EnumerableSetLib for EnumerableSetLib.Uint256Set;

  struct Info {
    bool disabled;
    uint256 installedAt;
  }

  struct Installation {
    EnumerableSetLib.Uint256Set installedApps;
    mapping(uint256 appId => Info info) installation;
  }

  function installed(
    Installation storage self,
    uint256 appId
  ) internal view returns (bool) {
    return self.installedApps.contains(appId);
  }

  function install(Installation storage self, uint256 appId) internal {
    self.installation[appId].installedAt = block.timestamp;
    self.installedApps.add(appId);
  }

  function uninstall(Installation storage self, uint256 appId) internal {
    delete self.installation[appId];
    self.installedApps.remove(appId);
  }

  function apps(
    Installation storage self
  ) internal view returns (uint256[] memory) {
    return self.installedApps.values();
  }
}

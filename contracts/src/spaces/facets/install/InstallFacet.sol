// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {InstallLib} from "contracts/src/spaces/facets/install/InstallLib.sol";
import {Permissions} from "contracts/src/spaces/facets/Permissions.sol";

// contracts
import {Entitled} from "contracts/src/spaces/facets/Entitled.sol";

contract InstallFacet is Entitled {
  function installApp(uint256 appId, bytes32[] memory channelIds) external {
    _isEntitled(
      IN_TOWN,
      msg.sender,
      bytes32(abi.encodePacked(Permissions.InstallApp))
    );
    InstallLib.installApp(appId, channelIds);
  }

  function uninstallApp(uint256 appId, bytes32[] memory channelIds) external {
    _isEntitled(
      IN_TOWN,
      msg.sender,
      bytes32(abi.encodePacked(Permissions.UninstallApp))
    );
    InstallLib.uninstallApp(appId, channelIds);
  }
}

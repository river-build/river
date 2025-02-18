// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IAppRegistryBase} from "contracts/src/app/interfaces/IAppRegistry.sol";
import {IAppHooks} from "contracts/src/app/interfaces/IAppHooks.sol";

// libraries
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {Validator} from "contracts/src/utils/Validator.sol";
import {EnumerableSetLib} from "solady/utils/EnumerableSetLib.sol";

// contracts

library App {
  using CustomRevert for bytes4;
  using EnumerableSetLib for EnumerableSetLib.Bytes32Set;
  struct Config {
    bool disabled;
    uint256 tokenId;
    address appAddress;
    address owner;
    string uri;
    string name;
    string symbol;
    EnumerableSetLib.Bytes32Set permissions;
    IAppHooks hooks;
  }

  function initialize(
    Config storage self,
    uint256 tokenId,
    address appAddress,
    address owner,
    string memory uri,
    string memory name,
    string memory symbol,
    bytes32[] memory permissions,
    IAppHooks hooks
  ) internal {
    Validator.checkAddress(appAddress);
    Validator.checkAddress(owner);
    Validator.checkLength(uri, 1);
    Validator.checkLength(name, 1);
    Validator.checkLength(symbol, 1);

    if (exists(self))
      IAppRegistryBase.AppAlreadyRegistered.selector.revertWith();

    self.tokenId = tokenId;
    self.appAddress = appAddress;
    self.owner = owner;
    self.uri = uri;
    self.name = name;
    self.symbol = symbol;
    self.hooks = hooks;

    for (uint256 i; i < permissions.length; ++i) {
      self.permissions.add(permissions[i]);
    }
  }

  function exists(Config storage self) internal view returns (bool) {
    return self.owner != address(0);
  }

  function getPermissions(
    Config storage self
  ) internal view returns (bytes32[] memory) {
    return self.permissions.values();
  }

  function update(
    Config storage self,
    string memory uri,
    bytes32[] memory permissions,
    bool disabled,
    IAppHooks hooks
  ) internal {
    self.uri = uri;
    self.hooks = hooks;
    self.disabled = disabled;

    uint256 currentPermissionsLen = self.permissions.length();
    uint256 permissionsLen = permissions.length;
    if (permissionsLen > 0) {
      bytes32[] memory valuesToRemove = new bytes32[](currentPermissionsLen);

      unchecked {
        for (uint256 i; i < currentPermissionsLen; ++i) {
          valuesToRemove[i] = self.permissions.at(i);
        }

        for (uint256 i; i < currentPermissionsLen; ++i) {
          self.permissions.remove(valuesToRemove[i]);
        }

        for (uint256 i; i < permissionsLen; ++i) {
          self.permissions.add(permissions[i]);
        }
      }
    }
  }
}

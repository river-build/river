// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IAppRegistryBase} from "contracts/src/app/interfaces/IAppRegistry.sol";
// libraries
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {Validator} from "contracts/src/utils/Validator.sol";
import {StringSet} from "contracts/src/utils/StringSet.sol";

// contracts

library App {
  using CustomRevert for bytes4;
  using StringSet for StringSet.Set;

  struct Config {
    uint256 tokenId;
    address appAddress;
    address owner;
    string uri;
    string name;
    string symbol;
    StringSet.Set permissions;
  }

  function initialize(
    Config storage self,
    uint256 tokenId,
    address appAddress,
    address owner,
    string memory uri,
    string memory name,
    string memory symbol,
    string[] memory permissions
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

    for (uint256 i; i < permissions.length; ++i) {
      self.permissions.add(permissions[i]);
    }
  }

  function exists(Config storage self) internal view returns (bool) {
    return self.owner != address(0);
  }

  function getPermissions(
    Config storage self
  ) internal view returns (string[] memory) {
    return self.permissions.values();
  }
}

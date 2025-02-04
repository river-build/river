// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {AppId} from "./AppConfig.sol";
import {App} from "./App.sol";
// libraries

// contracts

library AppRegistryLib {
  // keccak256(abi.encode(uint256(keccak256("app.registry.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0xb8e36f5f0889cd57afca29ce4e646d20d1aa88e34a9a72ee2933cbb0fb724d00;

  struct Layout {
    mapping(AppId => App.State) apps;
  }

  function layout() internal pure returns (Layout storage ds) {
    assembly ("memory-safe") {
      ds.slot := STORAGE_SLOT
    }
  }
}

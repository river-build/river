// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IAppHooks} from "contracts/src/app/hooks/IAppHooks.sol";

// structs
import {AppConfig} from "contracts/src/app/registry/AppConfig.sol";

// libraries

// contracts

library HookManager {
  function beforeInitialize(IAppHooks self, AppConfig memory config) internal {
    // TODO: implement
  }

  function afterInitialize(IAppHooks self, AppConfig memory config) internal {
    // TODO: implement
  }
}

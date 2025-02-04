// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {App} from "./App.sol";

// libraries
import {AppRegistryLib} from "./AppRegistryLib.sol";
import {HookManager} from "contracts/src/app/hooks/HookManager.sol";

// contracts

// structs
import {AppId, AppConfig} from "./AppConfig.sol";

contract AppRegistry {
  using App for App.State;

  function register(AppConfig memory config) external {
    HookManager.beforeInitialize(config.hooks, config);

    AppId id = config.toId();
    App.State storage state = AppRegistryLib.layout().apps[id];
    state.initialize(config.owner, config.uri, config.permissions);

    // TODO: emit event

    HookManager.afterInitialize(config.hooks, config);
  }
}

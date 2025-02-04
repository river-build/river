// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IAppHooks} from "contracts/src/app/hooks/IAppHooks.sol";

// libraries

// contracts

using AppConfigLib for AppConfig global;

type AppId is bytes32;

struct AppConfig {
  address owner;
  bytes32 uri;
  string[] permissions;
  IAppHooks hooks;
}

library AppConfigLib {
  /// @notice Returns value equal to keccak256(abi.encode(appConfig))
  function toId(
    AppConfig memory appConfig
  ) internal pure returns (AppId appId) {
    return AppId.wrap(keccak256(abi.encode(appConfig)));
  }
}

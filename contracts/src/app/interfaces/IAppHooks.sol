// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {Permissions} from "contracts/src/app/libraries/HookManager.sol";

// contracts

interface IAppHooks {
  function getHookPermissions() external view returns (Permissions memory);

  //  initialization
  function beforeInitialize(address sender) external returns (bytes4);
  function afterInitialize(address sender) external returns (bytes4);

  // registration hooks
  function beforeRegister(address sender) external returns (bytes4);
  function afterRegister(address sender) external returns (bytes4);
}

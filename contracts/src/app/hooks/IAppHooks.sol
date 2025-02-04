// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
import {AppConfig} from "../registry/AppConfig.sol";

interface IAppHooks {
  //  initialization
  function beforeInitialize(address sender, AppConfig memory config) external;
  function afterInitialize(address sender, AppConfig memory config) external;

  // execution hooks
  function beforeExecution(address target, bytes4 selector) external;
  function afterExecution(address target, bytes4 selector) external;
}

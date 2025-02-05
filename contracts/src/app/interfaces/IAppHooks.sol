// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface IAppHooks {
  //  initialization
  function beforeInitialize(address sender) external;
  function afterInitialize(address sender) external;

  // execution hooks
  function beforeExecution(address target, bytes4 selector) external;
  function afterExecution(address target, bytes4 selector) external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

library App {
  using App for State;

  struct Execution {
    address target;
    bytes4 selector;
  }

  struct State {
    address owner;
    bytes32 uri;
    string[] permissions;
    Execution[] executions;
  }

  function initialize(
    State storage self,
    address owner,
    bytes32 uri,
    string[] memory permissions
  ) internal {
    self.owner = owner;
    self.uri = uri;
    self.permissions = permissions;
  }
}

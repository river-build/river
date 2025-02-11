// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {BaseHook} from "contracts/src/app/facets/BaseHook.sol";

// libraries

// contracts

contract MockHook is BaseHook {
  constructor() {
    _permissions.beforeInitialize = true;
  }

  function _beforeInitialize(address) internal override {}

  function _afterInitialize(address) internal override {}

  function _beforeRegister(address) internal override {}

  function _afterRegister(address) internal override {}
}

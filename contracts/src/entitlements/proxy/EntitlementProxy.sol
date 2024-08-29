// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

import {EntitlementProxyBase} from "contracts/src/entitlements/proxy/EntitlementProxyBase.sol";

contract EntitlementProxy is EntitlementProxyBase {
  constructor(address manager, bytes4 managerSelector, bytes4 entitlementId) {
    __EntitlementProxyBase_init(manager, managerSelector, entitlementId);
  }
}

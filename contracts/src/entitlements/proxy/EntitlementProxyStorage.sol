// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

library EntitlementProxyStorage {
  // keccak256(abi.encode(uint256(keccak256("diamond.entitlement.proxy.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0x23e75ba980826f1692d90550974ebb6400efde4cd9a3213f3a0482f77a1f0e00;

  struct Layout {
    address manager;
    bytes4 managerSelector;
    bytes4 entitlementId;
  }

  function layout() internal pure returns (Layout storage ds) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      ds.slot := slot
    }
  }
}

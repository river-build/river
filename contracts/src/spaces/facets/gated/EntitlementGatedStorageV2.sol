// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementGatedBaseV2} from "./IEntitlementGatedV2.sol";
import {IEntitlementChecker} from "contracts/src/base/registry/facets/checker/IEntitlementChecker.sol";

// libraries

// contracts

library EntitlementGatedStorageV2 {
  // keccak256(abi.encode(uint256(keccak256("facets.entitlement.gated.storage.v2")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0xc9f85609eb60ac71988cfb4c314695ea9c394b99f001405aaba56d724f4cf800;

  struct Layout {
    IEntitlementChecker entitlementChecker;
    mapping(bytes32 => IEntitlementGatedBaseV2.Transaction) transactions;
  }

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}

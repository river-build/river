// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IRuleEntitlementV2} from "./IRuleEntitlementV2.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// contracts

library RuleEntitlementStorage {
  // keccak256(abi.encode(uint256(keccak256("spaces.entitlements.rule.storage.v2")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0x858b72ffb9b2fa0fc89266b0dd2710729cbe0194d0dc7ad7f830ebf836219000;

  struct Entitlement {
    address grantedBy;
    uint256 grantedTime;
    IRuleEntitlementV2.RuleData data;
  }

  struct Layout {
    address space;
    mapping(uint256 => Entitlement) entitlementsByRoleId;
  }

  function layout() internal pure returns (Layout storage l) {
    assembly {
      l.slot := STORAGE_SLOT
    }
  }
}

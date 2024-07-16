// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// contracts

library UserEntitlementStorage {
  // keccak256(abi.encode(uint256(keccak256("spaces.entitlements.user.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0xedb79b159744d25ddda880eb783ba7163de9ba7585742d86c7981d9a8b5b8200;

  struct Entitlement {
    address grantedBy;
    uint256 grantedTime;
    address[] users;
  }

  struct Layout {
    address space;
    EnumerableSet.UintSet allEntitlementRoleIds;
    mapping(uint256 => Entitlement) entitlementsByRoleId;
    mapping(address => uint256[]) roleIdsByUser;
  }

  function layout() internal pure returns (Layout storage l) {
    assembly {
      l.slot := STORAGE_SLOT
    }
  }
}

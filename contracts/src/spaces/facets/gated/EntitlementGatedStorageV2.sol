// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementGatedBaseV2} from "./IEntitlementGatedV2.sol";
import {IEntitlementChecker} from "contracts/src/base/registry/facets/checker/IEntitlementChecker.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// contracts

library EntitlementGatedStorageV2 {
  using EnumerableSet for EnumerableSet.UintSet;
  struct NodeVote {
    address node;
    NodeVoteStatus vote;
  }

  struct Transaction {
    bool hasBenSet;
    address clientAddress;
    mapping(uint256 => NodeVote[]) nodeVotesArray;
    mapping(uint256 => bool) isCompleted;
    IRuleEntitlementV2 entitlement;
    uint256[] roleIds;
  }

  // keccak256(abi.encode(uint256(keccak256("facets.entitlement.gated.storage.v2")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0xc9f85609eb60ac71988cfb4c314695ea9c394b99f001405aaba56d724f4cf800;

  struct Layout {
    IEntitlementChecker entitlementChecker;
    mapping(bytes32 => Transaction) transactions;
  }

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// contracts

library FacetRegistryStorage {
  // keccak256(abi.encode(uint256(keccak256("diamond.facets.registry.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0x1f69b36b047165e56e55255b6f01d452e9f9c59a994bb0188d7b51a29b867200;

  struct Layout {
    EnumerableSet.AddressSet facets;
    mapping(address facet => EnumerableSet.Bytes32Set selectors) facetSelectors;
    mapping(address facet => bytes4 initializer) facetInitializer;
  }

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}

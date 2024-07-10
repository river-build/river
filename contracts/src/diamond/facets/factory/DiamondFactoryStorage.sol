// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// contracts

library DiamondFactoryStorage {
  // keccak256(abi.encode(uint256(keccak256("diamond.facets.factory.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0xd23fc4f8155db892112cb4ec402b8648aef4fe536fdf31957c2e7c8664bedc00;

  struct Layout {
    address multiInit;
    EnumerableSet.AddressSet defaultFacets;
  }

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}

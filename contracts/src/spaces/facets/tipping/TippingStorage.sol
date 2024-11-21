// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// contracts

library TippingStorage {
  // keccak256(abi.encode(uint256(keccak256("spaces.facets.tipping.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0xb6cb334a9eea0cca2581db4520b45ac6f03de8e3927292302206bb82168be300;

  struct Layout {
    EnumerableSet.AddressSet currencies;
    mapping(uint256 tokenId => mapping(address currency => uint256 amount)) tipsByCurrencyByTokenId;
  }

  function layout() internal pure returns (Layout storage l) {
    assembly {
      l.slot := STORAGE_SLOT
    }
  }
}

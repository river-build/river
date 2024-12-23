// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

library VotesEnumerableLib {
  using EnumerableSet for EnumerableSet.AddressSet;

  // keccak256(abi.encode(uint256(keccak256("diamond.facets.governance.votes.enumerable.paginated.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0x1e6f63a55fa2f79ccff8b182616973e1427c599a6b5606636e814a1fea286300;

  struct Layout {
    EnumerableSet.AddressSet delegators;
  }

  function layout() internal pure returns (Layout storage l) {
    assembly {
      l.slot := STORAGE_SLOT
    }
  }

  function addDelegator(address account, address delegatee) internal {
    Layout storage ds = layout();

    ds.delegators.remove(account);

    if (delegatee != address(0)) {
      ds.delegators.add(account);
    }
  }

  function getDelegatorCount() external view returns (uint256) {
    Layout storage l = layout();
    return l.delegators.length();
  }

  function getDelegators() external view returns (address[] memory) {
    Layout storage l = layout();
    return l.delegators.values();
  }

  function getDelegatorsPaginated(
    uint256 start,
    uint256 count
  ) external view returns (address[] memory) {
    Layout storage ds = layout();
    uint256 total = ds.delegators.length();

    if (start >= total) {
      return new address[](0);
    }

    // Adjust count if it exceeds the total number of delegators
    uint256 end = start + count > total ? total : start + count;
    uint256 size = end - start;

    address[] memory paginatedDelegators = new address[](size);
    for (uint256 i = 0; i < size; i++) {
      paginatedDelegators[i] = ds.delegators.at(start + i);
    }

    return paginatedDelegators;
  }
}

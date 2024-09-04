// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// interfaces

// libraries
import {StakingRewards} from "./StakingRewards.sol";

// contracts

library RewardsDistributionStorage {
  // keccak256(abi.encode(uint256(keccak256("facets.registry.rewards.distribution.v2.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0x9aed53e346ef79853612b4c863c4eb308de8a5e84e0fd7d00dad88eb5ff1ea00;

  function layout() internal pure returns (StakingRewards.Layout storage s) {
    assembly {
      s.slot := STORAGE_SLOT
    }
  }
}

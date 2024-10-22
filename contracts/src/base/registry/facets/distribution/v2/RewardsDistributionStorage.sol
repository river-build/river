// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// interfaces

// libraries
import {StakingRewards} from "./StakingRewards.sol";

// contracts

library RewardsDistributionStorage {
  // keccak256(abi.encode(uint256(keccak256("facets.registry.rewards.distribution.v2.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0x7b071c8e0da733b969167f083e1913dbb26456aeda63d64176fc92d3926ff300;

  struct Layout {
    StakingRewards.Layout staking;
    mapping(address rewardNotifier => bool) isRewardNotifier;
  }

  function layout() internal pure returns (Layout storage s) {
    assembly {
      s.slot := STORAGE_SLOT
    }
  }
}

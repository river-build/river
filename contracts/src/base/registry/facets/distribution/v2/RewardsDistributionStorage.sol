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

  /// @notice The layout of the rewards distribution storage
  /// @param staking The storage of the staking rewards logic
  /// @param beacon The address of the upgradeable beacon
  /// @param proxyById The mapping of deposit ID to proxy address
  /// @param isRewardNotifier The mapping of reward notifier whitelist
  struct Layout {
    StakingRewards.Layout staking;
    address beacon;
    mapping(uint256 depositId => address proxy) proxyById;
    mapping(address rewardNotifier => bool) isRewardNotifier;
  }

  function layout() internal pure returns (Layout storage s) {
    assembly {
      s.slot := STORAGE_SLOT
    }
  }
}

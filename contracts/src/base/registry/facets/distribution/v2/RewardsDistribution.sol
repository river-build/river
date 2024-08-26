// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// interfaces
import {IRewardsDistributionBase} from "./IRewardsDistribution.sol";

// libraries
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";
import {RewardsDistributionStorage} from "./RewardsDistributionStorage.sol";

// contracts

library RewardsDistribution {
  using FixedPointMathLib for uint256;

  uint256 internal constant SCALE_FACTOR = 1e36;

  function lastTimeRewardDistributed(
    RewardsDistributionStorage.Layout storage $
  ) internal view returns (uint256) {
    return FixedPointMathLib.min($.rewardEndTime, block.timestamp);
  }

  function currentRewardPerTokenAccumulated(
    RewardsDistributionStorage.Layout storage $
  ) internal view returns (uint256) {
    (
      uint256 totalStaked,
      uint256 lastUpdateTime,
      uint256 rewardRate,
      uint256 rewardPerTokenAccumulated
    ) = (
        $.totalStaked,
        $.lastUpdateTime,
        $.rewardRate,
        $.rewardPerTokenAccumulated
      );
    if (totalStaked == 0) return rewardPerTokenAccumulated;

    return
      rewardPerTokenAccumulated +
      rewardRate.fullMulDiv(
        lastTimeRewardDistributed($) - lastUpdateTime,
        totalStaked
      );
  }

  function currentUnclaimedReward(
    RewardsDistributionStorage.Layout storage $,
    address beneficiary
  ) internal view returns (uint256) {
    IRewardsDistributionBase.Treasure storage treasure = $
      .treasureByBeneficiary[beneficiary];
    return
      treasure.unclaimedRewardSnapshot +
      (treasure.balance *
        (currentRewardPerTokenAccumulated($) -
          treasure.rewardPerTokenAccumulated));
  }

  function unclaimedReward(
    RewardsDistributionStorage.Layout storage $,
    address beneficiary
  ) internal view returns (uint256) {
    return currentUnclaimedReward($, beneficiary) / SCALE_FACTOR;
  }
}

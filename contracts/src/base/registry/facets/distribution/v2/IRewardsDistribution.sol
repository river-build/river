// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// interfaces

// libraries

// contracts

interface IRewardsDistributionBase {
  struct Deposit {
    uint96 balance;
    address owner;
    address delegatee;
    address beneficiary;
  }

  struct Treasure {
    uint256 balance;
    uint256 rewardPerTokenAccumulated;
    uint256 unclaimedRewardSnapshot;
  }
}

interface IRewardsDistribution is IRewardsDistributionBase {}

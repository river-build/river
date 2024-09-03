// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// interfaces
import {IRewardsDistributionBase} from "./IRewardsDistribution.sol";

// libraries

// contracts

library RewardsDistributionStorage {
  // keccak256(abi.encode(uint256(keccak256("facets.registry.rewards.distribution.v2.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0x9aed53e346ef79853612b4c863c4eb308de8a5e84e0fd7d00dad88eb5ff1ea00;

  struct Layout {
    address rewardToken;
    address stakeToken;
    uint256 totalStaked;
    uint256 rewardDuration;
    uint256 rewardEndTime;
    uint256 lastUpdateTime;
    uint256 rewardRate;
    uint256 rewardPerTokenAccumulated;
    uint256 nextDepositId;
    mapping(address depositor => uint256 amount) stakedByDepositor;
    mapping(address beneficiary => IRewardsDistributionBase.Treasure) treasureByBeneficiary;
    mapping(uint256 depositId => IRewardsDistributionBase.Deposit) deposits;
    mapping(address delegatee => address minion) delegationMinions;
    mapping(address rewardNotifier => bool) isRewardNotifier;
    mapping(address operator => uint256 commissionRate) commissionRateByOperator;
  }

  function layout() internal pure returns (Layout storage s) {
    assembly {
      s.slot := STORAGE_SLOT
    }
  }
}

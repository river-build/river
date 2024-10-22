// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// interfaces

// libraries
import {StakingRewards} from "./StakingRewards.sol";

// contracts

interface IRewardsDistributionBase {
  error RewardsDistribution__NotBeneficiary();
  error RewardsDistribution__NotClaimer();
  error RewardsDistribution__NotDepositOwner();
  error RewardsDistribution__ExpiredDeadline();
  error RewardsDistribution__InvalidSignature();
  error RewardsDistribution__NotRewardNotifier();
  error RewardsDistribution__NotOperatorOrSpace();

  event RewardsDistributionInitialized(
    address stakeToken,
    address rewardToken,
    uint256 rewardDuration
  );
  event RewardNotifierSet(address indexed notifier, bool enabled);
}

interface IRewardsDistribution is IRewardsDistributionBase {
  /// @notice Returns the current state of the staking rewards contract
  /// @return rewardToken The token that is being distributed as rewards
  /// @return stakeToken The token that is being staked
  /// @return totalStaked The total amount of stakeToken that is staked
  /// @return rewardDuration The duration of the reward distribution
  /// @return rewardEndTime The time at which the reward distribution ends
  /// @return lastUpdateTime The time at which the reward was last updated
  /// @return rewardRate The scaled rate of reward distributed per second
  /// @return rewardPerTokenAccumulated The scaled amount of rewardToken that has been accumulated per staked token
  /// @return nextDepositId The next deposit ID that will be used
  function stakingState()
    external
    view
    returns (
      address rewardToken,
      address stakeToken,
      uint256 totalStaked,
      uint256 rewardDuration,
      uint256 rewardEndTime,
      uint256 lastUpdateTime,
      uint256 rewardRate,
      uint256 rewardPerTokenAccumulated,
      uint256 nextDepositId
    );

  /// @notice Returns the amount of stakeToken that is staked by a particular depositor
  /// @param depositor The address of the depositor
  /// @return amount The amount of stakeToken that is staked by the depositor
  function stakedByDepositor(
    address depositor
  ) external view returns (uint256 amount);

  /// @notice Returns the account information for a beneficiary
  /// @param beneficiary The address of the beneficiary
  /// @return The account information for the beneficiary
  /// earningPower The amount of stakeToken that is yielding rewards
  /// rewardPerTokenAccumulated The scaled amount of rewardToken that has been accumulated per staked token
  /// unclaimedRewardSnapshot The snapshot of the unclaimed reward scaled
  function treasureByBeneficiary(
    address beneficiary
  ) external view returns (StakingRewards.Treasure memory);

  /// @notice Returns the information for a deposit
  /// @param depositId The ID of the deposit
  /// @return The information for the deposit
  /// amount The amount of stakeToken that is staked
  /// owner The address of the depositor
  /// commissionEarningPower The amount of stakeToken assigned to the commission
  /// delegatee The address of the delegatee
  /// beneficiary The address of the beneficiary
  function depositById(
    uint256 depositId
  ) external view returns (StakingRewards.Deposit memory);

  function stakeOnBehalf(
    uint96 amount,
    address delegatee,
    address beneficiary,
    address owner,
    uint256 deadline,
    bytes calldata signature
  ) external returns (uint256 depositId);
}

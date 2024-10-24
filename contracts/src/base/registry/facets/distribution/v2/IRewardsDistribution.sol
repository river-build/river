// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// interfaces

// libraries
import {StakingRewards} from "./StakingRewards.sol";

// contracts

interface IRewardsDistributionBase {
  /// @notice The state of the staking rewards contract
  /// @param riverToken The token that is being staked and used for rewards
  /// @param totalStaked The total amount of stakeToken that is staked
  /// @param rewardDuration The duration of the reward distribution
  /// @param rewardEndTime The time at which the reward distribution ends
  /// @param lastUpdateTime The time at which the reward was last updated
  /// @param rewardRate The scaled rate of reward distributed per second
  /// @param rewardPerTokenAccumulated The scaled amount of rewardToken that has been accumulated per staked token
  /// @param nextDepositId The next deposit ID that will be used
  struct StakingState {
    address riverToken;
    uint256 totalStaked;
    uint256 rewardDuration;
    uint256 rewardEndTime;
    uint256 lastUpdateTime;
    uint256 rewardRate;
    uint256 rewardPerTokenAccumulated;
    uint256 nextDepositId;
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                       CUSTOM ERRORS                        */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  error RewardsDistribution__NotBeneficiary();
  error RewardsDistribution__NotClaimer();
  error RewardsDistribution__NotDepositOwner();
  error RewardsDistribution__ExpiredDeadline();
  error RewardsDistribution__InvalidSignature();
  error RewardsDistribution__NotRewardNotifier();
  error RewardsDistribution__NotOperatorOrSpace();

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           EVENTS                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  event RewardsDistributionInitialized(
    address stakeToken,
    address rewardToken,
    uint256 rewardDuration
  );
  event RewardNotifierSet(address indexed notifier, bool enabled);
}

interface IRewardsDistribution is IRewardsDistributionBase {
  /// @notice Returns the current state of the staking rewards contract
  /// @return Staking state variables
  /// riverToken The token that is being staked and used for rewards
  /// totalStaked The total amount of stakeToken that is staked
  /// rewardDuration The duration of the reward distribution
  /// rewardEndTime The time at which the reward distribution ends
  /// lastUpdateTime The time at which the reward was last updated
  /// rewardRate The scaled rate of reward distributed per second
  /// rewardPerTokenAccumulated The scaled amount of rewardToken that has been accumulated per staked token
  /// nextDepositId The next deposit ID that will be used
  function stakingState() external view returns (StakingState memory);

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
  /// pendingWithdrawal The amount of stakeToken that is pending withdrawal
  /// beneficiary The address of the beneficiary
  function depositById(
    uint256 depositId
  ) external view returns (StakingRewards.Deposit memory);

  /// @notice Returns the address of the delegation proxy for a deposit
  /// @param depositId The ID of the deposit
  /// @return The address of the delegation proxy
  function delegationProxyById(
    uint256 depositId
  ) external view returns (address);

  /// @notice Returns whether a particular address is a reward notifier
  /// @param notifier The address to check
  /// @return True if the address is a reward notifier
  function isRewardNotifier(address notifier) external view returns (bool);

  /// @notice Returns the lesser of rewardEndTime and the current time
  /// @return The lesser of rewardEndTime and the current time
  function lastTimeRewardDistributed() external view returns (uint256);

  /// @notice Returns the current scaled amount of rewardToken that has been accumulated per staked token
  /// @return The current scaled amount of rewardToken that has been accumulated per staked token
  function currentRewardPerTokenAccumulated() external view returns (uint256);

  /// @notice Returns the current unclaimed reward for a beneficiary
  /// @param beneficiary The address of the beneficiary
  /// @return The current unclaimed reward for the beneficiary
  function currentReward(address beneficiary) external view returns (uint256);

  /// @notice Returns the current unclaimed reward for an operator from delegating spaces
  /// @param operator The address of the operator
  /// @return The current unclaimed reward for the operator from delegating spaces
  function currentSpaceDelegationReward(
    address operator
  ) external view returns (uint256);
}

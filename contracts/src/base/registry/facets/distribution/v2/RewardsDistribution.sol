// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {RewardsDistributionStorage} from "contracts/src/base/registry/facets/distribution/v2/RewardsDistributionStorage.sol";
import {SpaceDelegationStorage} from "contracts/src/base/registry/facets/delegation/SpaceDelegationStorage.sol";

// libraries
import {CurrencyTransfer} from "contracts/src/utils/libraries/CurrencyTransfer.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {StakingRewards} from "./StakingRewards.sol";

// contracts
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {IRewardsDistribution} from "./IRewardsDistribution.sol";

contract RewardsDistribution is IRewardsDistribution, Facet {
  using StakingRewards for StakingRewards.Layout;

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                       STATE MUTATING                       */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function __RewardsDistribution_init() external onlyInitializing {
    _addInterface(type(IRewardsDistribution).interfaceId);
  }

  function stake(
    uint96 amount,
    address delegatee
  ) external returns (uint256 depositId) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    depositId = StakingRewards.stake(
      ds.staking,
      msg.sender,
      amount,
      delegatee,
      msg.sender
    );
  }

  function permitAndStake(
    uint96 amount,
    address delegatee,
    address beneficiary,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external returns (uint256 depositId) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    try
      IERC20Permit(ds.staking.stakeToken).permit(
        msg.sender,
        address(this),
        amount,
        deadline,
        v,
        r,
        s
      )
    {} catch {}
    depositId = StakingRewards.stake(
      ds.staking,
      msg.sender,
      amount,
      delegatee,
      beneficiary
    );
  }

  function increaseStake(uint256 depositId, uint96 amount) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    _revertIfNotDepositOwner(deposit);

    StakingRewards.increaseStake(ds.staking, deposit, amount);
  }

  function redelegate(uint256 depositId, address delegatee) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    _revertIfNotDepositOwner(deposit);

    StakingRewards.redelegate(ds.staking, deposit, delegatee);
  }

  function changeBeneficiary(
    uint256 depositId,
    address newBeneficiary
  ) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    _revertIfNotDepositOwner(deposit);

    StakingRewards.changeBeneficiary(ds.staking, deposit, newBeneficiary);
  }

  function withdraw(uint256 depositId, uint96 amount) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.depositById[depositId];
    _revertIfNotDepositOwner(deposit);

    StakingRewards.withdraw(ds.staking, deposit, amount);
  }

  function claimReward() external returns (uint256) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return StakingRewards.claimReward(ds.staking, msg.sender);
  }

  function notifyRewardAmount(uint256 reward) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    if (!ds.isRewardNotifier[msg.sender]) {
      CustomRevert.revertWith(RewardsDistribution_NotRewardNotifier.selector);
    }

    StakingRewards.notifyRewardAmount(ds.staking, reward);
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                          VIEWERS                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  /// @inheritdoc IRewardsDistribution
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
    )
  {
    StakingRewards.Layout storage staking = RewardsDistributionStorage
      .layout()
      .staking;
    return (
      staking.rewardToken,
      staking.stakeToken,
      staking.totalStaked,
      staking.rewardDuration,
      staking.rewardEndTime,
      staking.lastUpdateTime,
      staking.rewardRate,
      staking.rewardPerTokenAccumulated,
      staking.nextDepositId
    );
  }

  /// @inheritdoc IRewardsDistribution
  function stakedByDepositor(
    address depositor
  ) external view returns (uint256 amount) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.staking.stakedByDepositor[depositor];
  }

  /// @inheritdoc IRewardsDistribution
  function treasureByBeneficiary(
    address beneficiary
  ) external view returns (StakingRewards.Treasure memory) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.staking.treasureByBeneficiary[beneficiary];
  }

  /// @inheritdoc IRewardsDistribution
  function depositById(
    uint256 depositId
  ) external view returns (StakingRewards.Deposit memory) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.staking.depositById[depositId];
  }

  function delegationProxies(
    address delegatee
  ) external view returns (address proxy) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.staking.delegationProxies[delegatee];
  }

  function commissionRateByDelegatee(
    address delegatee
  ) external view returns (uint256) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.staking.commissionRateByDelegatee[delegatee];
  }

  function isRewardNotifier(address notifier) external view returns (bool) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return ds.isRewardNotifier[notifier];
  }

  function lastTimeRewardDistributed() external view returns (uint256) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return StakingRewards.lastTimeRewardDistributed(ds.staking);
  }

  function currentRewardPerTokenAccumulated() external view returns (uint256) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return StakingRewards.currentRewardPerTokenAccumulated(ds.staking);
  }

  function currentUnclaimedReward(
    address beneficiary
  ) external view returns (uint256) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    return
      StakingRewards.currentUnclaimedReward(
        ds.staking,
        ds.staking.treasureByBeneficiary[beneficiary]
      );
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                          INTERNAL                          */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function _revertIfNotDepositOwner(
    StakingRewards.Deposit storage deposit
  ) internal view {
    if (msg.sender != deposit.owner) {
      CustomRevert.revertWith(RewardsDistribution_NotDepositOwner.selector);
    }
  }
}

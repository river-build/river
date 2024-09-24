// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {CurrencyTransfer} from "contracts/src/utils/libraries/CurrencyTransfer.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {NodeOperatorStorage} from "contracts/src/base/registry/facets/operator/NodeOperatorStorage.sol";
import {SpaceDelegationStorage} from "contracts/src/base/registry/facets/delegation/SpaceDelegationStorage.sol";
import {StakingRewards} from "./StakingRewards.sol";
import {RewardsDistributionStorage} from "./RewardsDistributionStorage.sol";

// contracts
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {IRewardsDistribution} from "./IRewardsDistribution.sol";

contract RewardsDistribution is IRewardsDistribution, Facet {
  using EnumerableSet for EnumerableSet.AddressSet;
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
  ) external onlyOperatorOrSpace(delegatee) returns (uint256 depositId) {
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
  ) external onlyOperatorOrSpace(delegatee) returns (uint256 depositId) {
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

  function redelegate(
    uint256 depositId,
    address delegatee
  ) external onlyOperatorOrSpace(delegatee) {
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

  function claimReward(
    address beneficiary,
    address recipient
  ) external returns (uint256) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    // If the beneficiary is a space, only the operator can claim the reward
    if (_isSpace(beneficiary)) {
      SpaceDelegationStorage.Layout storage sd = SpaceDelegationStorage
        .layout();
      address operator = sd.operatorBySpace[beneficiary];
      _checkClaimer(operator);
    }
    // If the beneficiary is an operator, only the claimer can claim the reward
    else if (_isOperator(beneficiary)) {
      _checkClaimer(beneficiary);
    }
    // If the beneficiary is not an operator or space, only the beneficiary can claim the reward
    else if (msg.sender != beneficiary) {
      CustomRevert.revertWith(RewardsDistribution__NotBeneficiary.selector);
    }
    return StakingRewards.claimReward(ds.staking, beneficiary, recipient);
  }

  function notifyRewardAmount(uint256 reward) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    if (!ds.isRewardNotifier[msg.sender]) {
      CustomRevert.revertWith(RewardsDistribution__NotRewardNotifier.selector);
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

  function _isOperator(address delegatee) internal view returns (bool) {
    NodeOperatorStorage.Layout storage nos = NodeOperatorStorage.layout();
    return nos.operators.contains(delegatee);
  }

  function _isSpace(address delegatee) internal view returns (bool) {
    SpaceDelegationStorage.Layout storage sd = SpaceDelegationStorage.layout();
    return sd.operatorBySpace[delegatee] != address(0);
  }

  function _checkClaimer(address operator) internal view {
    NodeOperatorStorage.Layout storage nos = NodeOperatorStorage.layout();
    address claimer = nos.claimerByOperator[operator];
    if (msg.sender != claimer) {
      CustomRevert.revertWith(RewardsDistribution__NotClaimer.selector);
    }
  }

  modifier onlyOperatorOrSpace(address delegatee) {
    _onlyOperatorOrSpace(delegatee);
    _;
  }

  function _onlyOperatorOrSpace(address delegatee) internal view {
    SpaceDelegationStorage.Layout storage sd = SpaceDelegationStorage.layout();
    NodeOperatorStorage.Layout storage nos = NodeOperatorStorage.layout();
    if (!(_isOperator(delegatee) || _isSpace(delegatee))) {
      CustomRevert.revertWith(RewardsDistribution__NotOperatorOrSpace.selector);
    }
  }

  function _revertIfNotDepositOwner(
    StakingRewards.Deposit storage deposit
  ) internal view {
    if (msg.sender != deposit.owner) {
      CustomRevert.revertWith(RewardsDistribution__NotDepositOwner.selector);
    }
  }
}

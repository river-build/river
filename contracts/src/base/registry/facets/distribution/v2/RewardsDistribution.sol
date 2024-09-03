// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// interfaces
import {IRewardsDistributionBase} from "./IRewardsDistribution.sol";

// libraries
import {FixedPointMathLib} from "solady/src/utils/FixedPointMathLib.sol";
import {SafeTransferLib} from "solady/src/utils/SafeTransferLib.sol";
import {RewardsDistributionStorage} from "./RewardsDistributionStorage.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";

// contracts
import {DelegationMinion} from "./DelegationMinion.sol";

library RewardsDistribution {
  using CustomRevert for bytes4;
  using FixedPointMathLib for uint256;
  using SafeTransferLib for address;

  uint256 internal constant SCALE_FACTOR = 1e36;

  error RewardsDistribution_InvalidAddress();
  error RewardsDistribution_InvalidRewardNotifier();
  error RewardsDistribution_InvalidRewardRate();
  error RewardsDistribution_InsufficientReward();

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                          VIEWERS                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

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
      FixedPointMathLib.fullMulDiv(
        rewardRate,
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

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                       STATE MUTATING                       */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function updateGlobalReward(
    RewardsDistributionStorage.Layout storage $
  ) internal {
    $.rewardPerTokenAccumulated = currentRewardPerTokenAccumulated($);
    $.lastUpdateTime = lastTimeRewardDistributed($);
  }

  /// @dev Must be called after updating the global reward.
  function updateReward(
    RewardsDistributionStorage.Layout storage $,
    address beneficiary
  ) internal {
    IRewardsDistributionBase.Treasure storage treasure = $
      .treasureByBeneficiary[beneficiary];
    treasure.unclaimedRewardSnapshot = currentUnclaimedReward($, beneficiary);
    treasure.rewardPerTokenAccumulated = $.rewardPerTokenAccumulated;
  }

  function retrieveOrDeployMinion(
    RewardsDistributionStorage.Layout storage $,
    address delegatee
  ) internal returns (address minion) {
    minion = $.delegationMinions[delegatee];

    if (minion == address(0)) {
      minion = address(new DelegationMinion($.stakeToken, delegatee));
      $.delegationMinions[delegatee] = minion;
      emit IRewardsDistributionBase.MinionDeployed(delegatee, minion);
    }
  }

  function stake(
    RewardsDistributionStorage.Layout storage $,
    address depositor,
    uint96 amount,
    address delegatee,
    address beneficiary
  ) internal returns (uint256 depositId) {
    if (delegatee == address(0))
      RewardsDistribution_InvalidAddress.selector.revertWith();
    if (beneficiary == address(0))
      RewardsDistribution_InvalidAddress.selector.revertWith();

    updateGlobalReward($);
    updateReward($, beneficiary);

    depositId = $.nextDepositId++;

    $.totalStaked += amount;
    $.stakedByDepositor[depositor] += amount;
    $.treasureByBeneficiary[beneficiary].balance += amount;
    $.deposits[depositId] = IRewardsDistributionBase.Deposit({
      amount: amount,
      owner: depositor,
      delegatee: delegatee,
      beneficiary: beneficiary
    });

    address minion = retrieveOrDeployMinion($, delegatee);
    $.stakeToken.safeTransferFrom(depositor, minion, amount);
    // TODO: emit events
  }

  function increaseStake(
    RewardsDistributionStorage.Layout storage $,
    uint256 depositId,
    uint96 amount
  ) internal {
    IRewardsDistributionBase.Deposit storage deposit = $.deposits[depositId];
    (address beneficiary, address owner) = (deposit.beneficiary, deposit.owner);

    updateGlobalReward($);
    updateReward($, beneficiary);

    $.totalStaked += amount;
    $.stakedByDepositor[owner] += amount;
    $.treasureByBeneficiary[beneficiary].balance += amount;
    deposit.amount += amount;

    address minion = $.delegationMinions[deposit.delegatee];
    $.stakeToken.safeTransferFrom(owner, minion, amount);
    // TODO: emit events
  }

  function redelegate(
    RewardsDistributionStorage.Layout storage $,
    uint256 depositId,
    address newDelegatee
  ) internal {
    if (newDelegatee == address(0))
      RewardsDistribution_InvalidAddress.selector.revertWith();
    IRewardsDistributionBase.Deposit storage deposit = $.deposits[depositId];
    address oldDelegatee = deposit.delegatee;
    address oldMinion = $.delegationMinions[oldDelegatee];
    deposit.delegatee = newDelegatee;
    address newMinion = retrieveOrDeployMinion($, newDelegatee);
    $.stakeToken.safeTransferFrom(oldMinion, newMinion, deposit.amount);
    // TODO: emit events
  }

  function changeBeneficiary(
    RewardsDistributionStorage.Layout storage $,
    uint256 depositId,
    address newBeneficiary
  ) internal {
    if (newBeneficiary == address(0))
      RewardsDistribution_InvalidAddress.selector.revertWith();
    updateGlobalReward($);
    IRewardsDistributionBase.Deposit storage deposit = $.deposits[depositId];
    address oldBeneficiary = deposit.beneficiary;
    updateReward($, oldBeneficiary);
    uint96 amount = deposit.amount;
    // TODO: unchecked math
    $.treasureByBeneficiary[oldBeneficiary].balance -= amount;

    updateReward($, newBeneficiary);
    deposit.beneficiary = newBeneficiary;
    $.treasureByBeneficiary[newBeneficiary].balance += amount;
    // TODO: emit events
  }

  function withdraw(
    RewardsDistributionStorage.Layout storage $,
    uint256 depositId,
    uint96 amount
  ) internal {
    updateGlobalReward($);
    IRewardsDistributionBase.Deposit storage deposit = $.deposits[depositId];
    updateReward($, deposit.beneficiary);

    deposit.amount -= amount;
    unchecked {
      $.totalStaked -= amount;
      $.stakedByDepositor[deposit.owner] -= amount;
      $.treasureByBeneficiary[deposit.beneficiary].balance -= amount;
    }
    $.stakeToken.safeTransferFrom(
      $.delegationMinions[deposit.delegatee],
      deposit.owner,
      amount
    );
    // TODO: emit events
  }

  function claimReward(
    RewardsDistributionStorage.Layout storage $,
    address beneficiary
  ) internal returns (uint256 reward) {
    updateGlobalReward($);
    updateReward($, beneficiary);

    IRewardsDistributionBase.Treasure storage treasure = $
      .treasureByBeneficiary[beneficiary];
    reward = treasure.unclaimedRewardSnapshot / SCALE_FACTOR;
    if (reward != 0) {
      unchecked {
        treasure.unclaimedRewardSnapshot -= reward * SCALE_FACTOR;
      }
      $.rewardToken.safeTransfer(beneficiary, reward);
      // TODO: emit events
    }
  }

  function notifyRewardAmount(
    RewardsDistributionStorage.Layout storage $,
    uint256 reward
  ) internal {
    if (!$.isRewardNotifier[msg.sender])
      RewardsDistribution_InvalidRewardNotifier.selector.revertWith();

    $.rewardPerTokenAccumulated = currentRewardPerTokenAccumulated($);

    uint256 rewardRate;
    uint256 rewardDuration = $.rewardDuration;
    if (block.timestamp >= $.rewardEndTime) {
      rewardRate = reward.mulDiv(SCALE_FACTOR, rewardDuration);
    } else {
      uint256 remainingTime;
      unchecked {
        remainingTime = $.rewardEndTime - block.timestamp;
      }
      uint256 leftover = $.rewardRate * remainingTime;
      rewardRate = (leftover + reward * SCALE_FACTOR) / rewardDuration;
    }
    $.rewardRate = rewardRate;

    $.rewardEndTime = block.timestamp + rewardDuration;
    $.lastUpdateTime = block.timestamp;

    if (rewardRate < SCALE_FACTOR)
      RewardsDistribution_InvalidRewardRate.selector.revertWith();

    if (rewardRate.mulDiv(rewardDuration, SCALE_FACTOR) > reward)
      RewardsDistribution_InsufficientReward.selector.revertWith();
    // TODO: emit events
  }
}

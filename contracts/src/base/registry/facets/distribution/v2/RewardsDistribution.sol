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

  function unclaimedReward(
    RewardsDistributionStorage.Layout storage $,
    address beneficiary
  ) internal view returns (uint256) {
    return currentUnclaimedReward($, beneficiary) / SCALE_FACTOR;
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
      balance: amount,
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
    deposit.balance += amount;

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
    $.stakeToken.safeTransferFrom(oldMinion, newMinion, deposit.balance);
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
    uint96 balance = deposit.balance;
    // TODO: unchecked math
    $.treasureByBeneficiary[oldBeneficiary].balance -= balance;

    updateReward($, newBeneficiary);
    deposit.beneficiary = newBeneficiary;
    $.treasureByBeneficiary[newBeneficiary].balance += balance;
    // TODO: emit events
  }
}

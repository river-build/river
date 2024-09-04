// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// interfaces

// libraries
import {FixedPointMathLib} from "solady/src/utils/FixedPointMathLib.sol";
import {SafeTransferLib} from "solady/src/utils/SafeTransferLib.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";

// contracts
import {DelegationMinion} from "./DelegationMinion.sol";

library StakingRewards {
  using CustomRevert for bytes4;
  using FixedPointMathLib for uint256;
  using SafeTransferLib for address;

  uint256 internal constant SCALE_FACTOR = 1e36;

  struct Deposit {
    uint96 amount;
    address owner;
    address delegatee;
    address beneficiary;
  }

  struct Treasure {
    uint256 earningPower;
    uint256 rewardPerTokenAccumulated;
    uint256 unclaimedRewardSnapshot;
  }

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
    mapping(address beneficiary => Treasure) treasureByBeneficiary;
    mapping(uint256 depositId => Deposit) deposits;
    mapping(address delegatee => address minion) delegationMinions;
    mapping(address rewardNotifier => bool) isRewardNotifier;
  }

  event MinionDeployed(address indexed delegatee, address indexed minion);

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           ERRORS                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  error StakingRewards_InvalidAddress();
  error StakingRewards_InvalidRewardNotifier();
  error StakingRewards_InvalidRewardRate();
  error StakingRewards_InsufficientReward();

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                          VIEWERS                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function lastTimeRewardDistributed(
    Layout storage $
  ) internal view returns (uint256) {
    return FixedPointMathLib.min($.rewardEndTime, block.timestamp);
  }

  function currentRewardPerTokenAccumulated(
    Layout storage $
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
    Layout storage $,
    address beneficiary
  ) internal view returns (uint256) {
    Treasure storage treasure = $.treasureByBeneficiary[beneficiary];
    return
      treasure.unclaimedRewardSnapshot +
      (treasure.earningPower *
        (currentRewardPerTokenAccumulated($) -
          treasure.rewardPerTokenAccumulated));
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                       STATE MUTATING                       */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function updateGlobalReward(Layout storage $) internal {
    $.rewardPerTokenAccumulated = currentRewardPerTokenAccumulated($);
    $.lastUpdateTime = lastTimeRewardDistributed($);
  }

  /// @dev Must be called after updating the global reward.
  function updateReward(Layout storage $, address beneficiary) internal {
    Treasure storage treasure = $.treasureByBeneficiary[beneficiary];
    treasure.unclaimedRewardSnapshot = currentUnclaimedReward($, beneficiary);
    treasure.rewardPerTokenAccumulated = $.rewardPerTokenAccumulated;
  }

  function retrieveOrDeployMinion(
    Layout storage $,
    address delegatee
  ) internal returns (address minion) {
    minion = $.delegationMinions[delegatee];

    if (minion == address(0)) {
      minion = address(new DelegationMinion($.stakeToken, delegatee));
      $.delegationMinions[delegatee] = minion;
      emit MinionDeployed(delegatee, minion);
    }
  }

  function stake(
    Layout storage $,
    address depositor,
    uint96 amount,
    address delegatee,
    address beneficiary
  ) internal returns (uint256 depositId) {
    if (delegatee == address(0))
      StakingRewards_InvalidAddress.selector.revertWith();
    if (beneficiary == address(0))
      StakingRewards_InvalidAddress.selector.revertWith();

    updateGlobalReward($);
    updateReward($, beneficiary);

    depositId = $.nextDepositId++;

    $.totalStaked += amount;
    unchecked {
      // because totalStaked >= stakedByDepositor[depositor]
      // and totalStaked >= treasureByBeneficiary[beneficiary].earningPower
      // if totalStaked doesn't overflow, they won't
      $.stakedByDepositor[depositor] += amount;
      $.treasureByBeneficiary[beneficiary].earningPower += amount;
    }
    $.deposits[depositId] = Deposit({
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
    Layout storage $,
    uint256 depositId,
    uint96 amount
  ) internal {
    Deposit storage deposit = $.deposits[depositId];
    // cache storage reads
    (address beneficiary, address owner) = (deposit.beneficiary, deposit.owner);

    updateGlobalReward($);
    updateReward($, beneficiary);

    deposit.amount += amount;
    $.totalStaked += amount;
    unchecked {
      // because totalStaked >= stakedByDepositor[depositor]
      // and totalStaked >= treasureByBeneficiary[beneficiary].earningPower
      // if totalStaked doesn't overflow, they won't
      $.stakedByDepositor[owner] += amount;
      $.treasureByBeneficiary[beneficiary].earningPower += amount;
    }

    address minion = $.delegationMinions[deposit.delegatee];
    $.stakeToken.safeTransferFrom(owner, minion, amount);
    // TODO: emit events
  }

  function redelegate(
    Layout storage $,
    uint256 depositId,
    address newDelegatee
  ) internal {
    if (newDelegatee == address(0))
      StakingRewards_InvalidAddress.selector.revertWith();
    Deposit storage deposit = $.deposits[depositId];
    address oldDelegatee = deposit.delegatee;
    address oldMinion = $.delegationMinions[oldDelegatee];
    deposit.delegatee = newDelegatee;
    address newMinion = retrieveOrDeployMinion($, newDelegatee);
    $.stakeToken.safeTransferFrom(oldMinion, newMinion, deposit.amount);
    // TODO: emit events
  }

  function changeBeneficiary(
    Layout storage $,
    uint256 depositId,
    address newBeneficiary
  ) internal {
    if (newBeneficiary == address(0))
      StakingRewards_InvalidAddress.selector.revertWith();
    updateGlobalReward($);
    Deposit storage deposit = $.deposits[depositId];
    address oldBeneficiary = deposit.beneficiary;
    updateReward($, oldBeneficiary);
    uint256 amount = deposit.amount;
    unchecked {
      // treasureByBeneficiary[oldBeneficiary].earningPower >= deposit.amount
      $.treasureByBeneficiary[oldBeneficiary].earningPower -= amount;
    }

    updateReward($, newBeneficiary);
    deposit.beneficiary = newBeneficiary;
    unchecked {
      // the invariant totalStaked >= treasureByBeneficiary[beneficiary].earningPower is ensured on stake and increaseStake
      // the following won't overflow
      $.treasureByBeneficiary[newBeneficiary].earningPower += amount;
    }
    // TODO: emit events
  }

  function withdraw(
    Layout storage $,
    uint256 depositId,
    uint96 amount
  ) internal {
    updateGlobalReward($);
    Deposit storage deposit = $.deposits[depositId];
    // cache storage reads
    (address beneficiary, address owner) = (deposit.beneficiary, deposit.owner);
    updateReward($, beneficiary);

    deposit.amount -= amount;
    unchecked {
      // totalStaked >= deposit.amount
      $.totalStaked -= amount;
      // stakedByDepositor[owner] >= deposit.amount
      $.stakedByDepositor[owner] -= amount;
      // treasureByBeneficiary[beneficiary].earningPower >= deposit.amount
      $.treasureByBeneficiary[beneficiary].earningPower -= amount;
    }
    $.stakeToken.safeTransferFrom(
      $.delegationMinions[deposit.delegatee],
      owner,
      amount
    );
    // TODO: emit events
  }

  function claimReward(
    Layout storage $,
    address beneficiary
  ) internal returns (uint256 reward) {
    updateGlobalReward($);
    updateReward($, beneficiary);

    Treasure storage treasure = $.treasureByBeneficiary[beneficiary];
    reward = treasure.unclaimedRewardSnapshot / SCALE_FACTOR;
    if (reward != 0) {
      unchecked {
        treasure.unclaimedRewardSnapshot -= reward * SCALE_FACTOR;
      }
      $.rewardToken.safeTransfer(beneficiary, reward);
      // TODO: emit events
    }
  }

  function notifyRewardAmount(Layout storage $, uint256 reward) internal {
    if (!$.isRewardNotifier[msg.sender])
      StakingRewards_InvalidRewardNotifier.selector.revertWith();

    $.rewardPerTokenAccumulated = currentRewardPerTokenAccumulated($);

    // cache storage reads
    (uint256 rewardDuration, uint256 rewardEndTime) = (
      $.rewardDuration,
      $.rewardEndTime
    );

    uint256 rewardRate;
    if (block.timestamp >= rewardEndTime) {
      rewardRate = reward.mulDiv(SCALE_FACTOR, rewardDuration);
    } else {
      uint256 remainingTime;
      unchecked {
        remainingTime = rewardEndTime - block.timestamp;
      }
      uint256 leftover = $.rewardRate * remainingTime;
      rewardRate = (leftover + reward * SCALE_FACTOR) / rewardDuration;
    }

    // batch storage writes
    ($.rewardEndTime, $.lastUpdateTime, $.rewardRate) = (
      block.timestamp + rewardDuration,
      block.timestamp,
      rewardRate
    );

    if (rewardRate < SCALE_FACTOR)
      StakingRewards_InvalidRewardRate.selector.revertWith();

    if (rewardRate.mulDiv(rewardDuration, SCALE_FACTOR) > reward)
      StakingRewards_InsufficientReward.selector.revertWith();
    // TODO: emit events
  }
}

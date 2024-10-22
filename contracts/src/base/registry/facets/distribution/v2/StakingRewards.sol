// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// libraries
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";

// contracts
import {DelegationProxy} from "./DelegationProxy.sol";

library StakingRewards {
  using SafeTransferLib for address;

  uint256 internal constant SCALE_FACTOR = 1e36;

  /// @notice The deposit information
  /// @param amount The amount of stakeToken that is staked
  /// @param owner The address of the depositor
  /// @param commissionEarningPower The amount of stakeToken assigned to the commission
  /// @param delegatee The address of the delegatee
  /// @param beneficiary The address of the beneficiary
  struct Deposit {
    uint96 amount;
    address owner;
    uint96 commissionEarningPower;
    address delegatee;
    address beneficiary;
  }

  /// @notice The account information for a beneficiary
  /// @param earningPower The amount of stakeToken that is yielding rewards
  /// @param rewardPerTokenAccumulated The scaled amount of rewardToken that has been accumulated per staked token
  /// @param unclaimedRewardSnapshot The snapshot of the unclaimed reward scaled
  struct Treasure {
    uint96 earningPower;
    uint256 rewardPerTokenAccumulated;
    uint256 unclaimedRewardSnapshot;
  }

  /// @notice The layout of the staking rewards storage
  /// @param rewardToken The token that is being distributed as rewards
  /// @param stakeToken The token that is being staked
  /// @param totalStaked The total amount of stakeToken that is staked
  /// @param rewardDuration The duration of the reward distribution
  /// @param rewardEndTime The time at which the reward distribution ends
  /// @param lastUpdateTime The time at which the reward was last updated
  /// @param rewardRate The scaled rate of reward distributed per second
  /// @param rewardPerTokenAccumulated The scaled amount of rewardToken that has been accumulated per staked token
  /// @param nextDepositId The next deposit ID that will be used
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
    mapping(uint256 depositId => Deposit) depositById;
    mapping(uint256 depositId => address proxy) proxyById;
  }

  event DelegationProxyDeployed(
    uint256 depositId,
    address delegatee,
    address proxy
  );

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           ERRORS                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  error StakingRewards__InvalidAmount();
  error StakingRewards__InvalidAddress();
  error StakingRewards__InvalidRewardRate();
  error StakingRewards__InsufficientReward();

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                          VIEWERS                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function lastTimeRewardDistributed(
    Layout storage ds
  ) internal view returns (uint256) {
    return FixedPointMathLib.min(ds.rewardEndTime, block.timestamp);
  }

  function currentRewardPerTokenAccumulated(
    Layout storage ds
  ) internal view returns (uint256) {
    // cache storage reads
    (
      uint256 totalStaked,
      uint256 lastUpdateTime,
      uint256 rewardRate,
      uint256 rewardPerTokenAccumulated
    ) = (
        ds.totalStaked,
        ds.lastUpdateTime,
        ds.rewardRate,
        ds.rewardPerTokenAccumulated
      );
    if (totalStaked == 0) return rewardPerTokenAccumulated;

    return
      rewardPerTokenAccumulated +
      FixedPointMathLib.fullMulDiv(
        rewardRate,
        lastTimeRewardDistributed(ds) - lastUpdateTime,
        totalStaked
      );
  }

  function currentUnclaimedReward(
    Layout storage ds,
    Treasure storage treasure
  ) internal view returns (uint256) {
    return
      treasure.unclaimedRewardSnapshot +
      (treasure.earningPower *
        (currentRewardPerTokenAccumulated(ds) -
          treasure.rewardPerTokenAccumulated));
  }

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                       STATE MUTATING                       */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  function updateGlobalReward(Layout storage ds) internal {
    ds.rewardPerTokenAccumulated = currentRewardPerTokenAccumulated(ds);
    ds.lastUpdateTime = lastTimeRewardDistributed(ds);
  }

  /// @dev Must be called after updating the global reward.
  function updateReward(Layout storage ds, Treasure storage treasure) internal {
    treasure.unclaimedRewardSnapshot = currentUnclaimedReward(ds, treasure);
    treasure.rewardPerTokenAccumulated = ds.rewardPerTokenAccumulated;
  }

  function stake(
    Layout storage ds,
    address depositor,
    uint96 amount,
    address delegatee,
    address beneficiary,
    uint256 commissionRate
  ) internal returns (uint256 depositId) {
    if (amount == 0) {
      CustomRevert.revertWith(StakingRewards__InvalidAmount.selector);
    }
    if (delegatee == address(0) || beneficiary == address(0)) {
      CustomRevert.revertWith(StakingRewards__InvalidAddress.selector);
    }

    updateGlobalReward(ds);

    Treasure storage beneficiaryTreasure = ds.treasureByBeneficiary[
      beneficiary
    ];
    updateReward(ds, beneficiaryTreasure);

    depositId = ds.nextDepositId++;
    Deposit storage deposit = ds.depositById[depositId];
    // batch storage writes
    (deposit.amount, deposit.owner, deposit.beneficiary, deposit.delegatee) = (
      amount,
      depositor,
      beneficiary,
      delegatee
    );

    ds.totalStaked += amount;
    unchecked {
      // because totalStaked >= stakedByDepositor[depositor]
      // if totalStaked doesn't overflow, they won't
      ds.stakedByDepositor[depositor] += amount;
    }
    _increaseEarningPower(
      ds,
      deposit,
      beneficiaryTreasure,
      amount,
      delegatee,
      commissionRate
    );

    address proxy = address(new DelegationProxy(ds.stakeToken, delegatee));
    ds.proxyById[depositId] = proxy;
    emit DelegationProxyDeployed(depositId, delegatee, proxy);

    ds.stakeToken.safeTransferFrom(depositor, proxy, amount);
  }

  function increaseStake(
    Layout storage ds,
    Deposit storage deposit,
    uint256 depositId,
    uint96 amount,
    uint256 commissionRate
  ) internal {
    // cache storage reads
    (
      uint96 currentAmount,
      address owner,
      address beneficiary,
      address delegatee
    ) = (deposit.amount, deposit.owner, deposit.beneficiary, deposit.delegatee);
    deposit.amount = currentAmount + amount;

    updateGlobalReward(ds);

    Treasure storage beneficiaryTreasure = ds.treasureByBeneficiary[
      beneficiary
    ];
    updateReward(ds, beneficiaryTreasure);

    ds.totalStaked += amount;
    unchecked {
      // because totalStaked >= stakedByDepositor[depositor]
      // if totalStaked doesn't overflow, they won't
      ds.stakedByDepositor[owner] += amount;
    }
    _increaseEarningPower(
      ds,
      deposit,
      beneficiaryTreasure,
      amount,
      delegatee,
      commissionRate
    );

    address proxy = ds.proxyById[depositId];
    ds.stakeToken.safeTransferFrom(owner, proxy, amount);
  }

  function _increaseEarningPower(
    Layout storage ds,
    Deposit storage deposit,
    Treasure storage beneficiaryTreasure,
    uint96 amount,
    address delegatee,
    uint256 commissionRate
  ) private {
    unchecked {
      if (commissionRate == 0) {
        beneficiaryTreasure.earningPower += amount;
      } else {
        uint96 commissionEarningPower = uint96(
          (uint256(amount) * commissionRate) / 10000
        );
        deposit.commissionEarningPower += commissionEarningPower;
        beneficiaryTreasure.earningPower += amount - commissionEarningPower;

        Treasure storage delegateeTreasure = ds.treasureByBeneficiary[
          delegatee
        ];
        updateReward(ds, delegateeTreasure);
        delegateeTreasure.earningPower += commissionEarningPower;
      }
    }
  }

  function _decreaseEarningPower(
    Layout storage ds,
    Deposit storage deposit,
    Treasure storage beneficiaryTreasure
  ) private {
    unchecked {
      (uint96 amount, uint96 commissionEarningPower, address delegatee) = (
        deposit.amount,
        deposit.commissionEarningPower,
        deposit.delegatee
      );
      if (commissionEarningPower == 0) {
        beneficiaryTreasure.earningPower -= amount;
      } else {
        deposit.commissionEarningPower = 0;
        beneficiaryTreasure.earningPower -= amount - commissionEarningPower;

        Treasure storage delegateeTreasure = ds.treasureByBeneficiary[
          delegatee
        ];
        updateReward(ds, delegateeTreasure);
        delegateeTreasure.earningPower -= commissionEarningPower;
      }
    }
  }

  function redelegate(
    Layout storage ds,
    Deposit storage deposit,
    uint256 depositId,
    address newDelegatee,
    uint256 commissionRate
  ) internal {
    if (newDelegatee == address(0)) {
      CustomRevert.revertWith(StakingRewards__InvalidAddress.selector);
    }

    updateGlobalReward(ds);

    Treasure storage beneficiaryTreasure = ds.treasureByBeneficiary[
      deposit.beneficiary
    ];
    updateReward(ds, beneficiaryTreasure);

    _decreaseEarningPower(ds, deposit, beneficiaryTreasure);

    _increaseEarningPower(
      ds,
      deposit,
      beneficiaryTreasure,
      deposit.amount,
      newDelegatee,
      commissionRate
    );

    address proxy = ds.proxyById[depositId];
    DelegationProxy(proxy).redelegate(newDelegatee);
    deposit.delegatee = newDelegatee;
  }

  function changeBeneficiary(
    Layout storage ds,
    Deposit storage deposit,
    address newBeneficiary
  ) internal {
    if (newBeneficiary == address(0)) {
      CustomRevert.revertWith(StakingRewards__InvalidAddress.selector);
    }

    updateGlobalReward(ds);

    (uint96 amount, address oldBeneficiary, uint96 commissionEarningPower) = (
      deposit.amount,
      deposit.beneficiary,
      deposit.commissionEarningPower
    );
    deposit.beneficiary = newBeneficiary;

    unchecked {
      uint96 amountMinusCommission = amount - commissionEarningPower;

      Treasure storage oldTreasure = ds.treasureByBeneficiary[oldBeneficiary];
      updateReward(ds, oldTreasure);

      oldTreasure.earningPower -= amountMinusCommission;

      Treasure storage newTreasure = ds.treasureByBeneficiary[newBeneficiary];
      updateReward(ds, newTreasure);

      // the invariant totalStaked >= treasureByBeneficiary[beneficiary].earningPower is ensured on stake and increaseStake
      // the following won't overflow
      newTreasure.earningPower += amountMinusCommission;
    }
  }

  function initiateWithdraw(
    Layout storage ds,
    Deposit storage deposit,
    uint256 depositId
  ) internal {
    updateGlobalReward(ds);

    Treasure storage beneficiaryTreasure = ds.treasureByBeneficiary[
      deposit.beneficiary
    ];
    updateReward(ds, beneficiaryTreasure);

    _decreaseEarningPower(ds, deposit, beneficiaryTreasure);

    address proxy = ds.proxyById[depositId];
    DelegationProxy(proxy).redelegate(address(0));
    deposit.delegatee = address(0);
  }

  function withdraw(
    Layout storage ds,
    Deposit storage deposit,
    uint256 depositId
  ) internal {
    updateGlobalReward(ds);

    // cache storage reads
    (uint96 amount, address owner) = (deposit.amount, deposit.owner);

    deposit.amount = 0;
    unchecked {
      // totalStaked >= deposit.amount
      ds.totalStaked -= amount;
      // stakedByDepositor[owner] >= deposit.amount
      ds.stakedByDepositor[owner] -= amount;
    }

    address proxy = ds.proxyById[depositId];
    ds.stakeToken.safeTransferFrom(proxy, owner, amount);
  }

  function claimReward(
    Layout storage ds,
    address beneficiary,
    address recipient
  ) internal returns (uint256 reward) {
    updateGlobalReward(ds);

    Treasure storage treasure = ds.treasureByBeneficiary[beneficiary];
    updateReward(ds, treasure);

    reward = treasure.unclaimedRewardSnapshot / SCALE_FACTOR;
    if (reward != 0) {
      unchecked {
        treasure.unclaimedRewardSnapshot -= reward * SCALE_FACTOR;
      }
      ds.rewardToken.safeTransfer(recipient, reward);
    }
  }

  function notifyRewardAmount(Layout storage ds, uint256 reward) internal {
    ds.rewardPerTokenAccumulated = currentRewardPerTokenAccumulated(ds);

    // cache storage reads
    (uint256 rewardDuration, uint256 rewardEndTime) = (
      ds.rewardDuration,
      ds.rewardEndTime
    );

    uint256 rewardRate = FixedPointMathLib.fullMulDiv(
      reward,
      SCALE_FACTOR,
      rewardDuration
    );
    // if the reward period hasn't ended, add the remaining reward to the reward rate
    if (rewardEndTime > block.timestamp) {
      uint256 remainingTime;
      unchecked {
        remainingTime = rewardEndTime - block.timestamp;
      }
      rewardRate += FixedPointMathLib.fullMulDiv(
        ds.rewardRate,
        remainingTime,
        rewardDuration
      );
    }

    // batch storage writes
    (ds.rewardEndTime, ds.lastUpdateTime, ds.rewardRate) = (
      block.timestamp + rewardDuration,
      block.timestamp,
      rewardRate
    );

    if (rewardRate < SCALE_FACTOR) {
      CustomRevert.revertWith(StakingRewards__InvalidRewardRate.selector);
    }

    if (
      FixedPointMathLib.fullMulDiv(rewardRate, rewardDuration, SCALE_FACTOR) >
      IERC20(ds.rewardToken).balanceOf(address(this))
    ) {
      CustomRevert.revertWith(StakingRewards__InsufficientReward.selector);
    }
  }
}

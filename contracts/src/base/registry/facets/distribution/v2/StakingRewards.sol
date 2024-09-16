// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// interfaces

// libraries
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";

// contracts
import {DelegationProxy} from "./DelegationProxy.sol";

library StakingRewards {
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
    mapping(address delegatee => address proxy) delegationProxies;
  }

  event DelegationProxyDeployed(
    address indexed delegatee,
    address indexed proxy
  );

  /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
  /*                           ERRORS                           */
  /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

  error StakingRewards_InvalidAddress();
  error StakingRewards_InvalidRewardRate();
  error StakingRewards_InsufficientReward();

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
    address beneficiary
  ) internal view returns (uint256) {
    Treasure storage treasure = ds.treasureByBeneficiary[beneficiary];
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
  function updateReward(Layout storage ds, address beneficiary) internal {
    Treasure storage treasure = ds.treasureByBeneficiary[beneficiary];
    treasure.unclaimedRewardSnapshot = currentUnclaimedReward(ds, beneficiary);
    treasure.rewardPerTokenAccumulated = ds.rewardPerTokenAccumulated;
  }

  function retrieveOrDeployProxy(
    Layout storage ds,
    address delegatee
  ) internal returns (address proxy) {
    proxy = ds.delegationProxies[delegatee];

    if (proxy == address(0)) {
      proxy = address(new DelegationProxy(ds.stakeToken, delegatee));
      ds.delegationProxies[delegatee] = proxy;
      emit DelegationProxyDeployed(delegatee, proxy);
    }
  }

  function stake(
    Layout storage ds,
    address depositor,
    uint96 amount,
    address delegatee,
    address beneficiary
  ) internal returns (uint256 depositId) {
    if (delegatee == address(0)) {
      CustomRevert.revertWith(StakingRewards_InvalidAddress.selector);
    }
    if (beneficiary == address(0)) {
      CustomRevert.revertWith(StakingRewards_InvalidAddress.selector);
    }

    updateGlobalReward(ds);
    updateReward(ds, beneficiary);

    depositId = ds.nextDepositId++;

    ds.totalStaked += amount;
    unchecked {
      // because totalStaked >= stakedByDepositor[depositor]
      // and totalStaked >= treasureByBeneficiary[beneficiary].earningPower
      // if totalStaked doesn't overflow, they won't
      ds.stakedByDepositor[depositor] += amount;
      ds.treasureByBeneficiary[beneficiary].earningPower += amount;
    }
    ds.deposits[depositId] = Deposit({
      amount: amount,
      owner: depositor,
      delegatee: delegatee,
      beneficiary: beneficiary
    });

    address proxy = retrieveOrDeployProxy(ds, delegatee);
    ds.stakeToken.safeTransferFrom(depositor, proxy, amount);
  }

  function increaseStake(
    Layout storage ds,
    uint256 depositId,
    uint96 amount
  ) internal {
    Deposit storage deposit = ds.deposits[depositId];
    // cache storage reads
    (address beneficiary, address owner) = (deposit.beneficiary, deposit.owner);

    updateGlobalReward(ds);
    updateReward(ds, beneficiary);

    deposit.amount += amount;
    ds.totalStaked += amount;
    unchecked {
      // because totalStaked >= stakedByDepositor[depositor]
      // and totalStaked >= treasureByBeneficiary[beneficiary].earningPower
      // if totalStaked doesn't overflow, they won't
      ds.stakedByDepositor[owner] += amount;
      ds.treasureByBeneficiary[beneficiary].earningPower += amount;
    }

    address proxy = ds.delegationProxies[deposit.delegatee];
    ds.stakeToken.safeTransferFrom(owner, proxy, amount);
  }

  function redelegate(
    Layout storage ds,
    uint256 depositId,
    address newDelegatee
  ) internal {
    if (newDelegatee == address(0)) {
      CustomRevert.revertWith(StakingRewards_InvalidAddress.selector);
    }
    Deposit storage deposit = ds.deposits[depositId];
    address oldDelegatee = deposit.delegatee;
    address oldProxy = ds.delegationProxies[oldDelegatee];
    deposit.delegatee = newDelegatee;
    address newProxy = retrieveOrDeployProxy(ds, newDelegatee);
    ds.stakeToken.safeTransferFrom(oldProxy, newProxy, deposit.amount);
  }

  function changeBeneficiary(
    Layout storage ds,
    uint256 depositId,
    address newBeneficiary
  ) internal {
    if (newBeneficiary == address(0)) {
      CustomRevert.revertWith(StakingRewards_InvalidAddress.selector);
    }
    updateGlobalReward(ds);
    Deposit storage deposit = ds.deposits[depositId];
    address oldBeneficiary = deposit.beneficiary;
    updateReward(ds, oldBeneficiary);
    uint256 amount = deposit.amount;
    unchecked {
      // treasureByBeneficiary[oldBeneficiary].earningPower >= deposit.amount
      ds.treasureByBeneficiary[oldBeneficiary].earningPower -= amount;
    }

    updateReward(ds, newBeneficiary);
    deposit.beneficiary = newBeneficiary;
    unchecked {
      // the invariant totalStaked >= treasureByBeneficiary[beneficiary].earningPower is ensured on stake and increaseStake
      // the following won't overflow
      ds.treasureByBeneficiary[newBeneficiary].earningPower += amount;
    }
  }

  function withdraw(
    Layout storage ds,
    uint256 depositId,
    uint96 amount
  ) internal {
    updateGlobalReward(ds);
    Deposit storage deposit = ds.deposits[depositId];
    // cache storage reads
    (address beneficiary, address owner) = (deposit.beneficiary, deposit.owner);
    updateReward(ds, beneficiary);

    deposit.amount -= amount;
    unchecked {
      // totalStaked >= deposit.amount
      ds.totalStaked -= amount;
      // stakedByDepositor[owner] >= deposit.amount
      ds.stakedByDepositor[owner] -= amount;
      // treasureByBeneficiary[beneficiary].earningPower >= deposit.amount
      ds.treasureByBeneficiary[beneficiary].earningPower -= amount;
    }
    ds.stakeToken.safeTransferFrom(
      ds.delegationProxies[deposit.delegatee],
      owner,
      amount
    );
  }

  function claimReward(
    Layout storage ds,
    address beneficiary
  ) internal returns (uint256 reward) {
    updateGlobalReward(ds);
    updateReward(ds, beneficiary);

    Treasure storage treasure = ds.treasureByBeneficiary[beneficiary];
    reward = treasure.unclaimedRewardSnapshot / SCALE_FACTOR;
    if (reward != 0) {
      unchecked {
        treasure.unclaimedRewardSnapshot -= reward * SCALE_FACTOR;
      }
      ds.rewardToken.safeTransfer(beneficiary, reward);
    }
  }

  function notifyRewardAmount(Layout storage ds, uint256 reward) internal {
    ds.rewardPerTokenAccumulated = currentRewardPerTokenAccumulated(ds);

    // cache storage reads
    (uint256 rewardDuration, uint256 rewardEndTime) = (
      ds.rewardDuration,
      ds.rewardEndTime
    );

    uint256 rewardRate;
    if (block.timestamp >= rewardEndTime) {
      rewardRate = FixedPointMathLib.mulDiv(
        reward,
        SCALE_FACTOR,
        rewardDuration
      );
    } else {
      uint256 remainingTime;
      unchecked {
        remainingTime = rewardEndTime - block.timestamp;
      }
      uint256 leftover = ds.rewardRate * remainingTime;
      rewardRate = (leftover + reward * SCALE_FACTOR) / rewardDuration;
    }

    // batch storage writes
    (ds.rewardEndTime, ds.lastUpdateTime, ds.rewardRate) = (
      block.timestamp + rewardDuration,
      block.timestamp,
      rewardRate
    );

    if (rewardRate < SCALE_FACTOR) {
      CustomRevert.revertWith(StakingRewards_InvalidRewardRate.selector);
    }

    if (
      FixedPointMathLib.mulDiv(rewardRate, rewardDuration, SCALE_FACTOR) >
      reward
    ) {
      CustomRevert.revertWith(StakingRewards_InsufficientReward.selector);
    }
  }
}

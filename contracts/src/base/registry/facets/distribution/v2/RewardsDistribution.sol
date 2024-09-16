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

  error RewardsDistribution_NotDepositOwner();

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
    StakingRewards.Deposit storage deposit = ds.staking.deposits[depositId];
    if (msg.sender != deposit.owner) {
      CustomRevert.revertWith(RewardsDistribution_NotDepositOwner.selector);
    }

    StakingRewards.increaseStake(ds.staking, deposit, amount);
  }

  function redelegate(uint256 depositId, address delegatee) external {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    StakingRewards.Deposit storage deposit = ds.staking.deposits[depositId];
    if (msg.sender != deposit.owner) {
      CustomRevert.revertWith(RewardsDistribution_NotDepositOwner.selector);
    }

    StakingRewards.redelegate(ds.staking, deposit, delegatee);
  }
}

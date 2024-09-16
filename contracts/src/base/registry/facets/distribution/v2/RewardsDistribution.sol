// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RewardsDistributionStorage} from "contracts/src/base/registry/facets/distribution/v2/RewardsDistributionStorage.sol";
import {SpaceDelegationStorage} from "contracts/src/base/registry/facets/delegation/SpaceDelegationStorage.sol";

// libraries
import {CurrencyTransfer} from "contracts/src/utils/libraries/CurrencyTransfer.sol";
import {StakingRewards} from "./StakingRewards.sol";

// contracts
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {IRewardsDistribution} from "./IRewardsDistribution.sol";

contract RewardsDistribution is IRewardsDistribution, Facet {
  using StakingRewards for StakingRewards.Layout;

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
}

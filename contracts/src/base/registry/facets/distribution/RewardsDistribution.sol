// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IVotesEnumerable} from "contracts/src/diamond/facets/governance/votes/enumerable/IVotesEnumerable.sol"; // make this into interface
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRewardsDistribution} from "contracts/src/base/registry/facets/distribution/IRewardsDistribution.sol";
import {MainnetDelegationBase} from "contracts/src/tokens/river/base/delegation/MainnetDelegationBase.sol";
import {OwnableBase} from "contracts/src/diamond/facets/ownable/OwnableBase.sol";
import {NodeOperatorStorage, NodeOperatorStatus} from "contracts/src/base/registry/facets/operator/NodeOperatorStorage.sol";
import {RewardsDistributionStorage} from "contracts/src/base/registry/facets/distribution/RewardsDistributionStorage.sol";
import {SpaceDelegationStorage} from "contracts/src/base/registry/facets/delegation/SpaceDelegationStorage.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {CurrencyTransfer} from "contracts/src/utils/libraries/CurrencyTransfer.sol";

// contracts
import {Facet} from "contracts/src/diamond/facets/Facet.sol";
import {ERC721ABase} from "contracts/src/diamond/facets/token/ERC721A/ERC721ABase.sol";

contract RewardsDistribution is
  IRewardsDistribution,
  ERC721ABase,
  MainnetDelegationBase,
  OwnableBase,
  Facet
{
  using EnumerableSet for EnumerableSet.AddressSet;

  function __RewardsDistribution_init() external onlyInitializing {
    _addInterface(type(IRewardsDistribution).interfaceId);
  }

  function getClaimableAmount(address addr) public view returns (uint256) {
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    uint256 delegatorAmount = ds.distributionByDelegator[addr];
    uint256 operatorAmount = ds.distributionByOperator[addr];
    return delegatorAmount + operatorAmount;
  }

  function claim() external {
    uint256 amount = getClaimableAmount(msg.sender);

    if (amount == 0) revert RewardsDistribution_NoRewardsToClaim();

    SpaceDelegationStorage.Layout storage sd = SpaceDelegationStorage.layout();

    if (IERC20(sd.riverToken).balanceOf(address(this)) < amount)
      revert RewardsDistribution_InsufficientRewardBalance();

    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();

    ds.distributionByDelegator[msg.sender] = 0;
    ds.distributionByOperator[msg.sender] = 0;

    CurrencyTransfer.transferCurrency(
      sd.riverToken,
      address(this),
      msg.sender,
      amount
    );
  }

  function distributeRewards(address operator) external onlyOwner {
    address[] memory activeOperators = _getActiveOperators();
    uint256 totalActiveOperators = activeOperators.length;

    if (totalActiveOperators == 0)
      revert RewardsDistribution_NoActiveOperators();

    bool isActiveOperator = false;
    for (uint256 i = 0; i < totalActiveOperators; i++) {
      if (operator == activeOperators[i]) {
        isActiveOperator = true;
        break;
      }
    }

    if (!isActiveOperator) revert RewardsDistribution_InvalidOperator();

    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();
    NodeOperatorStorage.Layout storage nos = NodeOperatorStorage.layout();
    SpaceDelegationStorage.Layout storage sd = SpaceDelegationStorage.layout();

    uint256 amountPerOperator = ds.weeklyDistributionAmount /
      totalActiveOperators;

    //calculate how much the operator should receive

    uint256 commission = nos.commissionByOperator[operator];
    uint256 operatorClaimAmount = (commission * amountPerOperator) / 100;

    //set that amount to the operator
    address operatorClaimAddress = nos.claimerByOperator[operator];
    ds.distributionByOperator[operatorClaimAddress] += operatorClaimAmount;
    emit RewardsDistributed(operator, operatorClaimAmount);

    //distribute the remainder across the delgators to this operator
    uint256 delegatorClaimAmount = amountPerOperator - operatorClaimAmount;
    _calculateDelegatorDistribution(sd, operator, delegatorClaimAmount);
  }

  function setWeeklyDistributionAmount(uint256 amount) external onlyOwner {
    RewardsDistributionStorage.layout().weeklyDistributionAmount = amount;
  }

  function getWeeklyDistributionAmount() public view returns (uint256) {
    return RewardsDistributionStorage.layout().weeklyDistributionAmount;
  }

  // =============================================================
  //                           Internal
  // =============================================================

  function _calculateDelegatorDistribution(
    SpaceDelegationStorage.Layout storage sd,
    address operator,
    uint256 delegatorsClaimAmount
  ) internal {
    address[] memory delegators = IVotesEnumerable(sd.riverToken)
      .getDelegatorsByDelegatee(operator);

    address[] memory spaceDelegators = sd.spacesByOperator[operator].values();
    uint256 spaceDelegatorsLen = spaceDelegators.length;

    uint256 totalLength = delegators.length;
    for (uint256 i = 0; i < spaceDelegatorsLen; i++) {
      totalLength += IVotesEnumerable(sd.riverToken)
        .getDelegatorsByDelegatee(spaceDelegators[i])
        .length;
    }

    Delegation[] memory mainnetDelegations = _getDelegationsByOperator(
      operator
    );
    totalLength += mainnetDelegations.length;

    address[] memory combinedDelegators = new address[](totalLength);

    uint256 count = 0;
    uint256 totalDelegation = 0;

    // Copy elements from the first array
    for (uint256 i = 0; i < delegators.length; i++) {
      combinedDelegators[count++] = delegators[i];
      totalDelegation += IERC20(sd.riverToken).balanceOf(delegators[i]);
    }

    // Copy elements from the second array
    for (uint256 i = 0; i < spaceDelegatorsLen; i++) {
      address[] memory spaceDelegatorDelegators = IVotesEnumerable(
        sd.riverToken
      ).getDelegatorsByDelegatee(spaceDelegators[i]);

      for (uint256 j = 0; j < spaceDelegatorDelegators.length; j++) {
        combinedDelegators[count++] = spaceDelegatorDelegators[j];
        totalDelegation += IERC20(sd.riverToken).balanceOf(
          spaceDelegatorDelegators[j]
        );
      }
    }

    for (uint256 i = 0; i < mainnetDelegations.length; i++) {
      combinedDelegators[count++] = mainnetDelegations[i].delegator;
      totalDelegation += mainnetDelegations[i].quantity;
    }

    uint256 delegatorsLen = combinedDelegators.length;
    RewardsDistributionStorage.Layout storage ds = RewardsDistributionStorage
      .layout();

    for (uint256 i = 0; i < delegatorsLen; i++) {
      address delegator = combinedDelegators[i];

      uint256 amount = IERC20(sd.riverToken).balanceOf(delegator);
      //if this user has no token delegated, then we assume that they are a mainnet delegation
      if (amount == 0) {
        amount = _getDelegationByDelegator(delegator).quantity;
      }
      uint256 delegatorProRata = (amount * delegatorsClaimAmount) /
        totalDelegation;
      ds.distributionByDelegator[delegator] += delegatorProRata;
    }
  }

  function _getActiveOperators() internal view returns (address[] memory) {
    uint256 totalOperators = _totalSupply();
    uint256 totalActiveOperators = 0;

    address[] memory expectedOperators = new address[](totalOperators);
    for (uint256 i = 0; i < totalOperators; i++) {
      address operator = _ownerOf(i);

      NodeOperatorStorage.Layout storage nos = NodeOperatorStorage.layout();
      NodeOperatorStatus currentStatus = nos.statusByOperator[operator];

      if (currentStatus == NodeOperatorStatus.Approved) {
        expectedOperators[i] = operator;
        totalActiveOperators++;
      }
    }

    // trim the array
    assembly {
      mstore(expectedOperators, totalActiveOperators)
    }
    return expectedOperators;
  }

  function _getOperatorDelegatee(
    address delegator
  ) internal view returns (address) {
    SpaceDelegationStorage.Layout storage sd = SpaceDelegationStorage.layout();

    // get the delegatee that the delegator is voting for
    address delegatee = IVotes(SpaceDelegationStorage.layout().riverToken)
      .delegates(delegator);
    // if the delegatee is a space, get the operator that the space is delegating to
    address spaceDelegatee = sd.operatorBySpace[delegatee];
    address actualOperator = spaceDelegatee != address(0)
      ? spaceDelegatee
      : delegatee;
    return actualOperator;
  }

  function _isActiveSinceLastCycle(
    uint256 delegationTime
  ) internal view returns (bool) {
    return delegationTime < (block.timestamp - 7 days);
  }
}

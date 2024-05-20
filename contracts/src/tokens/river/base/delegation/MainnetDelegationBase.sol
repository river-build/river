// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

// interfaces
import {IMainnetDelegationBase} from "./IMainnetDelegation.sol";
import {IProxyDelegation} from "contracts/src/tokens/river/mainnet/delegation/IProxyDelegation.sol";
import {ICrossDomainMessenger} from "contracts/src/tokens/river/mainnet/delegation/ICrossDomainMessenger.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {MainnetDelegationStorage} from "./MainnetDelegationStorage.sol";

// contracts

abstract contract MainnetDelegationBase is IMainnetDelegationBase {
  using EnumerableSet for EnumerableSet.AddressSet;

  function _setDelegation(
    address delegator,
    address operator,
    uint256 quantity
  ) internal {
    MainnetDelegationStorage.Layout storage ds = MainnetDelegationStorage
      .layout();

    if (operator == address(0)) {
      Delegation memory delegation = ds.delegationByDelegator[delegator];
      delete delegation.operator;
      delete delegation.quantity;
      ds.delegatorsByOperator[delegation.operator].remove(delegator);
      emit DelegationRemoved(delegator);
    } else {
      ds.delegatorsByOperator[operator].add(delegator);
      ds.delegationByDelegator[delegator] = Delegation(
        operator,
        quantity,
        delegator
      );
      emit DelegationSet(delegator, operator, quantity);
    }
  }

  function _getDelegationByDelegator(
    address delegator
  ) internal view returns (Delegation memory) {
    return MainnetDelegationStorage.layout().delegationByDelegator[delegator];
  }

  function _getDelegationsByOperator(
    address operator
  ) internal view returns (Delegation[] memory) {
    MainnetDelegationStorage.Layout storage ds = MainnetDelegationStorage
      .layout();
    EnumerableSet.AddressSet storage delegators = ds.delegatorsByOperator[
      operator
    ];
    Delegation[] memory delegations = new Delegation[](delegators.length());

    for (uint256 i = 0; i < delegators.length(); i++) {
      address delegator = delegators.at(i);
      delegations[i] = ds.delegationByDelegator[delegator];
    }

    return delegations;
  }

  function _getDelegatedStakeByOperator(
    address operator
  ) internal view returns (uint256) {
    uint256 stake = 0;
    Delegation[] memory delegations = _getDelegationsByOperator(operator);
    for (uint256 i = 0; i < delegations.length; i++) {
      stake += delegations[i].quantity;
    }
    return stake;
  }

  function _setAuthorizedClaimer(address delegator, address claimer) internal {
    MainnetDelegationStorage.Layout storage ds = MainnetDelegationStorage
      .layout();

    address currentClaimer = ds.claimerByDelegator[delegator];

    if (ds.delegatorsByAuthorizedClaimer[currentClaimer].contains(delegator)) {
      ds.delegatorsByAuthorizedClaimer[currentClaimer].remove(delegator);
    }

    ds.claimerByDelegator[delegator] = claimer;
    ds.delegatorsByAuthorizedClaimer[claimer].add(delegator);
  }

  function _getDelegatorsByAuthorizedClaimer(
    address claimer
  ) internal view returns (address[] memory) {
    MainnetDelegationStorage.Layout storage ds = MainnetDelegationStorage
      .layout();
    return ds.delegatorsByAuthorizedClaimer[claimer].values();
  }

  function _getAuthorizedClaimer(
    address owner
  ) internal view returns (address) {
    return MainnetDelegationStorage.layout().claimerByDelegator[owner];
  }

  function _setProxyDelegation(IProxyDelegation proxyDelegation) internal {
    MainnetDelegationStorage.layout().proxyDelegation = proxyDelegation;
  }

  function _getProxyDelegation() internal view returns (IProxyDelegation) {
    return MainnetDelegationStorage.layout().proxyDelegation;
  }

  function _setMessenger(ICrossDomainMessenger messenger) internal {
    MainnetDelegationStorage.layout().messenger = messenger;
  }

  function _getMessenger() internal view returns (ICrossDomainMessenger) {
    return MainnetDelegationStorage.layout().messenger;
  }
}

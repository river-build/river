// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementGatedBaseV2} from "./IEntitlementGatedV2.sol";
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";
import {IEntitlementChecker} from "contracts/src/base/registry/facets/checker/IEntitlementChecker.sol";
import {IImplementationRegistry} from "contracts/src/factory/facets/registry/IImplementationRegistry.sol";

// libraries
import {EntitlementGatedStorageV2} from "./EntitlementGatedStorageV2.sol";
import {MembershipStorage} from "contracts/src/spaces/facets/membership/MembershipStorage.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract EntitlementGatedBaseV2 is IEntitlementGatedBaseV2 {
  using EnumerableSet for EnumerableSet.AddressSet;
  using EnumerableSet for EnumerableSet.UintSet;

  function _setEntitlementChecker(
    IEntitlementChecker entitlementChecker
  ) internal {
    EntitlementGatedStorageV2.layout().entitlementChecker = entitlementChecker;
  }

  function _requestEntitlementCheck(
    bytes32 transactionId,
    IRuleEntitlementV2 entitlement,
    uint256 roleId
  ) internal {
    EntitlementGatedStorageV2.Layout storage ds = EntitlementGatedStorageV2
      .layout();

    EntitlementGatedStorageV2.Transaction storage transaction = ds.transactions[
      transactionId
    ];

    if (transaction.registered && transaction.roleIds.contains(roleId)) {
      revert EntitlementGated_TransactionCheckAlreadyRegistered();
    }

    // if the entitlement checker has not been set, set it
    if (address(ds.entitlementChecker) == address(0)) {
      _setFallbackEntitlementChecker();
    }

    address[] memory selectedNodes = ds.entitlementChecker.getRandomNodes(5);

    if (!transaction.registered) {
      transaction.registered = true;
      transaction.entitlement = entitlement;
      transaction.client = msg.sender;
    }

    transaction.roleIds.add(roleId);

    for (uint256 i = 0; i < selectedNodes.length; i++) {
      transaction.nodesByRoleId[roleId].add(selectedNodes[i]);
      transaction.voteByNodeByRoleId[roleId][selectedNodes[i]] = NodeVoteStatus
        .NOT_VOTED;
    }

    ds.entitlementChecker.requestEntitlementCheck(
      msg.sender,
      transactionId,
      roleId,
      selectedNodes
    );
  }

  function _postEntitlementCheckResult(
    bytes32 transactionId,
    uint256 roleId,
    NodeVoteStatus result
  ) internal {
    EntitlementGatedStorageV2.Layout storage ds = EntitlementGatedStorageV2
      .layout();
    EntitlementGatedStorageV2.Transaction storage transaction = ds.transactions[
      transactionId
    ];

    if (transaction.client == address(0) || transaction.registered == false) {
      revert EntitlementGated_TransactionNotRegistered();
    }

    if (transaction.isCompleted[roleId]) {
      revert EntitlementGated_TransactionCheckAlreadyCompleted();
    }

    // Find node in the array and update the vote, revert if node was not found.
    bool found;

    // count the votes
    uint256 passed = 0;
    uint256 failed = 0;

    uint256 transactionNodesLength = transaction.nodesByRoleId[roleId].length();

    for (uint256 i = 0; i < transactionNodesLength; i++) {
      address node = transaction.nodesByRoleId[roleId].at(i);
      NodeVoteStatus txNodeVoteStatus = transaction.voteByNodeByRoleId[roleId][
        node
      ];

      // Update vote if not yet voted
      if (node == msg.sender) {
        if (txNodeVoteStatus != NodeVoteStatus.NOT_VOTED) {
          revert EntitlementGated_NodeAlreadyVoted();
        }
        txNodeVoteStatus = result;
        found = true;
      }

      // Count votes
      if (txNodeVoteStatus == NodeVoteStatus.PASSED) {
        passed++;
      } else if (txNodeVoteStatus == NodeVoteStatus.FAILED) {
        failed++;
      }
    }

    if (!found) {
      revert EntitlementGated_NodeNotFound();
    }

    if (
      passed > transactionNodesLength / 2 || failed > transactionNodesLength / 2
    ) {
      transaction.isCompleted[roleId] = true;
      NodeVoteStatus finalStatus = passed > failed
        ? NodeVoteStatus.PASSED
        : NodeVoteStatus.FAILED;
      _onEntitlementCheckResultPosted(transactionId, finalStatus);
      emit EntitlementCheckResultPosted(transactionId, finalStatus);
      _removeTransaction(transactionId);
    }
  }

  function _removeTransaction(bytes32 transactionId) internal {
    EntitlementGatedStorageV2.Layout storage ds = EntitlementGatedStorageV2
      .layout();

    EntitlementGatedStorageV2.Transaction storage transaction = ds.transactions[
      transactionId
    ];

    // remove nodes from nodesByRoleId
    for (uint256 i = 0; i < transaction.roleIds.length(); i++) {
      uint256 roleId = transaction.roleIds.at(i);
      transaction.roleIds.remove(roleId);

      for (uint256 j = 0; j < transaction.nodesByRoleId[roleId].length(); j++) {
        address node = transaction.nodesByRoleId[roleId].at(j);
        delete transaction.voteByNodeByRoleId[roleId][node];
      }

      delete transaction.nodesByRoleId[roleId];
    }

    delete ds.transactions[transactionId];
  }

  function _getRuleData(
    bytes32 transactionId,
    uint256 roleId
  ) internal view returns (IRuleEntitlementV2.RuleData memory) {
    EntitlementGatedStorageV2.Layout storage ds = EntitlementGatedStorageV2
      .layout();

    EntitlementGatedStorageV2.Transaction storage transaction = ds.transactions[
      transactionId
    ];

    if (transaction.registered == false) {
      revert EntitlementGated_TransactionNotRegistered();
    }

    IRuleEntitlementV2 re = IRuleEntitlementV2(
      address(transaction.entitlement)
    );
    IRuleEntitlementV2.RuleData memory ruleData = re.getRuleDataV2(roleId);

    return ruleData;
  }

  function _onEntitlementCheckResultPosted(
    bytes32 transactionId,
    NodeVoteStatus result
  ) internal virtual {}

  // TODO: This should be removed in the future when we wipe data
  function _setFallbackEntitlementChecker() internal {
    EntitlementGatedStorageV2.Layout storage ds = EntitlementGatedStorageV2
      .layout();
    address entitlementChecker = IImplementationRegistry(
      MembershipStorage.layout().spaceFactory
    ).getLatestImplementation("SpaceOperator");
    ds.entitlementChecker = IEntitlementChecker(entitlementChecker);
  }
}

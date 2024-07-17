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

    EntitlementGatedStorageV2.TransactionRole storage transactionRole = ds
      .transactionRoles[transactionId];

    if (transaction.registered && transactionRole.roleIds.contains(roleId)) {
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

    transactionRole.roleIds.add(roleId);

    for (uint256 i; i < selectedNodes.length; i++) {
      transactionRole.nodesByRoleId[roleId].add(selectedNodes[i]);
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

    EntitlementGatedStorageV2.TransactionRole storage transactionRole = ds
      .transactionRoles[transactionId];

    if (transactionRole.isCompleted[roleId]) {
      revert EntitlementGated_TransactionCheckAlreadyCompleted();
    }

    // Find node in the array and update the vote, revert if node was not found.
    bool found;

    // count the votes
    uint256 passed = 0;
    uint256 failed = 0;

    uint256 transactionNodesLength = transactionRole
      .nodesByRoleId[roleId]
      .length();

    for (uint256 i; i < transactionNodesLength; i++) {
      address node = transactionRole.nodesByRoleId[roleId].at(i);

      NodeVoteStatus txNodeVoteStatus = transactionRole.voteByNodeByRoleId[
        roleId
      ][node];

      // Update vote if not yet voted
      if (node == msg.sender) {
        if (txNodeVoteStatus != NodeVoteStatus.NOT_VOTED) {
          revert EntitlementGated_NodeAlreadyVoted();
        }
        transactionRole.voteByNodeByRoleId[roleId][node] = result;
        found = true;
      }

      txNodeVoteStatus = transactionRole.voteByNodeByRoleId[roleId][node];

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
      transactionRole.isCompleted[roleId] = true;
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

    EntitlementGatedStorageV2.TransactionRole storage transactionRole = ds
      .transactionRoles[transactionId];

    // remove nodes from nodesByRoleId
    for (uint256 i = 0; i < transactionRole.roleIds.length(); i++) {
      uint256 roleId = transactionRole.roleIds.at(i);

      transactionRole.roleIds.remove(roleId);

      for (
        uint256 j = 0;
        j < transactionRole.nodesByRoleId[roleId].length();
        j++
      ) {
        delete transactionRole.voteByNodeByRoleId[roleId][
          transactionRole.nodesByRoleId[roleId].at(j)
        ];
      }

      delete transactionRole.nodesByRoleId[roleId];
    }

    ds.transactions[transactionId].registered = false;
    ds.transactions[transactionId].client = address(0);
    delete ds.transactions[transactionId].entitlement;
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

    IRuleEntitlementV2 re = transaction.entitlement;
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

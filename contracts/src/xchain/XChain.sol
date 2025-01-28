// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementGated} from "contracts/src/spaces/facets/gated/IEntitlementGated.sol";
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {IEntitlementCheckerBase} from "contracts/src/base/registry/facets/checker/IEntitlementChecker.sol";

// libraries
import {XChainLib} from "./XChainLib.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";

// contracts
import {EntitlementGated} from "contracts/src/spaces/facets/gated/EntitlementGated.sol";
import {Facet} from "@river-build/diamond/src/facets/Facet.sol";
import {ReentrancyGuard} from "solady/utils/ReentrancyGuard.sol";

contract XChain is
  IEntitlementGated,
  IEntitlementCheckerBase,
  ReentrancyGuard,
  Facet
{
  using EnumerableSet for EnumerableSet.AddressSet;
  using EnumerableSet for EnumerableSet.UintSet;

  function __XChain_init() external onlyInitializing {
    _addInterface(type(IEntitlementGated).interfaceId);
  }

  function isCompleted(
    bytes32 transactionId,
    uint256 requestId
  ) external view returns (bool) {
    return XChainLib.layout().checks[transactionId].voteCompleted[requestId];
  }

  function postEntitlementCheckResult(
    bytes32 transactionId,
    uint256 requestId,
    NodeVoteStatus result
  ) external nonReentrant {
    XChainLib.Request storage request = XChainLib.layout().requests[
      transactionId
    ];

    if (request.completed) {
      revert EntitlementGated_TransactionCheckAlreadyCompleted();
    }

    XChainLib.Check storage check = XChainLib.layout().checks[transactionId];

    if (!check.requestIds.contains(requestId)) {
      CustomRevert.revertWith(EntitlementGated_RequestIdNotFound.selector);
    }

    if (!check.nodes[requestId].contains(msg.sender)) {
      CustomRevert.revertWith(EntitlementGated_NodeNotFound.selector);
    }

    if (check.voteCompleted[requestId]) {
      CustomRevert.revertWith(
        EntitlementGated_TransactionCheckAlreadyCompleted.selector
      );
    }

    bool found;
    uint256 passed = 0;
    uint256 failed = 0;

    uint256 transactionNodesLength = check.nodes[requestId].length();

    for (uint256 i; i < transactionNodesLength; ++i) {
      NodeVote storage currentVote = check.votes[requestId][i];

      // Update vote if not yet voted
      if (currentVote.node == msg.sender) {
        if (currentVote.vote != NodeVoteStatus.NOT_VOTED) {
          revert EntitlementGated_NodeAlreadyVoted();
        }
        currentVote.vote = result;
        found = true;
      }

      unchecked {
        if (currentVote.vote == NodeVoteStatus.PASSED) {
          ++passed;
        } else if (currentVote.vote == NodeVoteStatus.FAILED) {
          ++failed;
        }
      }
    }

    if (!found) {
      revert EntitlementGated_NodeNotFound();
    }

    if (
      passed > transactionNodesLength / 2 || failed > transactionNodesLength / 2
    ) {
      check.voteCompleted[requestId] = true;
      NodeVoteStatus finalStatusForRole = passed > failed
        ? NodeVoteStatus.PASSED
        : NodeVoteStatus.FAILED;

      bool allRoleIdsCompleted = checkAllRequestsCompleted(transactionId);

      if (finalStatusForRole == NodeVoteStatus.PASSED || allRoleIdsCompleted) {
        EntitlementGated(request.caller).postEntitlementCheckResultV2{
          value: request.value
        }(transactionId, 0, finalStatusForRole);
        request.completed = true;
      }
    }
  }

  function checkAllRequestsCompleted(
    bytes32 transactionId
  ) internal view returns (bool) {
    XChainLib.Check storage check = XChainLib.layout().checks[transactionId];

    uint256 requestIdsLength = check.requestIds.length();
    for (uint256 i; i < requestIdsLength; ++i) {
      if (!check.voteCompleted[check.requestIds.at(i)]) {
        return false;
      }
    }
    return true;
  }

  function getRuleData(
    bytes32 transactionId,
    uint256 roleId
  ) external view returns (IRuleEntitlement.RuleData memory) {}
}

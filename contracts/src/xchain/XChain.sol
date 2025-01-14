// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IEntitlementGated} from "contracts/src/spaces/facets/gated/IEntitlementGated.sol";
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";
import {IEntitlementCheckerBase} from "contracts/src/base/registry/facets/checker/IEntitlementChecker.sol";

// libraries
import {XChainLib} from "./XChainLib.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// contracts
import {EntitlementGated} from "contracts/src/spaces/facets/gated/EntitlementGated.sol";
import {Facet} from "@river-build/diamond/src/facets/Facet.sol";

// debugging
import {console} from "forge-std/console.sol";

contract XChain is IEntitlementGated, IEntitlementCheckerBase, Facet {
  using EnumerableSet for EnumerableSet.AddressSet;

  function __XChain_init() external onlyInitializing {
    _addInterface(type(IEntitlementGated).interfaceId);
  }

  function postEntitlementCheckResult(
    bytes32 transactionId,
    uint256 requestId,
    NodeVoteStatus result
  ) external {
    XChainLib.Check storage check = XChainLib.layout().checks[transactionId];

    if (!check.nodes[requestId].contains(msg.sender)) {
      revert("XChain: caller is not a voting node");
    }

    if (check.voteCompleted[requestId]) {
      revert("XChain: vote already completed");
    }

    check.votesCount[requestId].total++;

    if (result == NodeVoteStatus.PASSED) {
      check.votesCount[requestId].passed++;
    } else {
      check.votesCount[requestId].failed++;
    }

    // wait for at least half of the nodes to vote
    uint256 nodesLength = check.nodes[requestId].length();
    if (check.votesCount[requestId].total <= nodesLength / 2) {
      return;
    }

    if (
      check.votesCount[requestId].passed > check.votesCount[requestId].failed ||
      check.votesCount[requestId].failed > check.votesCount[requestId].passed
    ) {
      check.voteCompleted[requestId] = true;
    }

    if (check.voteCompleted[requestId]) {
      address caller = XChainLib.layout().callers[transactionId];

      NodeVoteStatus finalStatusForRole = check.votesCount[requestId].passed >
        check.votesCount[requestId].failed
        ? NodeVoteStatus.PASSED
        : NodeVoteStatus.FAILED;

      EntitlementGated(caller).postEntitlementCheckResultV2(
        transactionId,
        requestId,
        finalStatusForRole
      );
    }

    // uint256 passed = 0;
    // uint256 failed = 0;

    // uint256 nodesLength = check.nodes[requestId].length();

    // for (uint256 i; i < nodesLength; ++i) {
    //   NodeVote memory currentVote = check.votes[requestId][i];

    //   if (
    //     currentVote.node == msg.sender &&
    //     currentVote.vote != NodeVoteStatus.NOT_VOTED
    //   ) {
    //     revert("XChain: node already voted");
    //   }

    //   if (currentVote.node == msg.sender) {
    //     currentVote.vote = result;
    //   }

    //   unchecked {
    //     NodeVoteStatus currentStatus = currentVote.vote;
    //     // Count votes
    //     if (currentStatus == NodeVoteStatus.PASSED) {
    //       ++passed;
    //     } else if (currentStatus == NodeVoteStatus.FAILED) {
    //       ++failed;
    //     }
    //   }
    // }

    // console.log("passed", passed);
    // console.log("failed", failed);

    // if (passed > nodesLength / 2 || failed > nodesLength / 2) {
    //   check.voteCompleted[requestId] = true;
    //   NodeVoteStatus finalStatusForRole = passed > failed
    //     ? NodeVoteStatus.PASSED
    //     : NodeVoteStatus.FAILED;

    //   address caller = XChainLib.layout().callers[transactionId];

    //   EntitlementGated(caller).postEntitlementCheckResultV2(
    //     transactionId,
    //     requestId,
    //     finalStatusForRole
    //   );
    // }
  }

  function getRuleData(
    bytes32 transactionId,
    uint256 roleId
  ) external view returns (IRuleEntitlement.RuleData memory) {}
}

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

contract XChain is IEntitlementGated, IEntitlementCheckerBase, Facet {
  using EnumerableSet for EnumerableSet.AddressSet;

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

    uint256 passed = check.votesCount[requestId].passed;
    uint256 failed = check.votesCount[requestId].failed;

    if (passed > failed || failed > passed) {
      check.voteCompleted[requestId] = true;
    }

    if (check.voteCompleted[requestId]) {
      XChainLib.Request memory request = XChainLib.layout().requests[
        transactionId
      ];

      NodeVoteStatus finalStatusForRole = passed > failed
        ? NodeVoteStatus.PASSED
        : NodeVoteStatus.FAILED;

      EntitlementGated(request.caller).postEntitlementCheckResultV2{
        value: request.value
      }(transactionId, requestId, finalStatusForRole);
    }
  }

  function getRuleData(
    bytes32 transactionId,
    uint256 roleId
  ) external view returns (IRuleEntitlement.RuleData memory) {}
}

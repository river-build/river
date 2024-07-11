// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IRuleEntitlementV2} from "contracts/src/spaces/entitlements/rule/IRuleEntitlementV2.sol";

interface IEntitlementGatedBaseV2 {
  enum NodeVoteStatus {
    NOT_VOTED,
    PASSED,
    FAILED
  }

  struct NodeVote {
    address node;
    NodeVoteStatus vote;
  }

  struct Transaction {
    bool hasBenSet;
    address clientAddress;
    mapping(uint256 => NodeVote[]) nodeVotesArray;
    mapping(uint256 => bool) isCompleted;
    IRuleEntitlementV2 entitlement;
    uint256[] roleIds;
  }

  error EntitlementGated_InvalidAddress();
  error EntitlementGated_TransactionCheckAlreadyRegistered();
  error EntitlementGated_TransactionCheckAlreadyCompleted();
  error EntitlementGated_TransactionNotRegistered();
  error EntitlementGated_NodeNotFound();
  error EntitlementGated_NodeAlreadyVoted();

  event EntitlementCheckResultPosted(
    bytes32 indexed transactionId,
    NodeVoteStatus result
  );
}

interface IEntitlementGatedV2 is IEntitlementGatedBaseV2 {
  function postEntitlementCheckResult(
    bytes32 transactionId,
    uint256 roleId,
    NodeVoteStatus result
  ) external;

  function getRuleData(
    bytes32 transactionId,
    uint256 roleId
  ) external view returns (IRuleEntitlementV2.RuleData memory);
}

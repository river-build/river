// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IRuleEntitlement} from "contracts/src/spaces/entitlements/rule/IRuleEntitlement.sol";

// libraries
import {EnumerableSetLib} from "solady/utils/EnumerableSetLib.sol";

// contracts

interface IXChainBase {
  enum VoteStatus {
    NOT_VOTED,
    PASSED,
    FAILED
  }

  struct Node {
    address node;
    VoteStatus vote;
  }

  struct Request {
    uint256 requestId;
    Node[] nodes;
    bool isCompleted;
  }

  struct TransactionV2 {
    bytes32 txId;
    address sender;
    address receiver;
    uint256 blockNumber;
    mapping(uint256 requestId => Request) requests;
    IRuleEntitlement entitlementModule;
    EnumerableSetLib.Uint256Set requestIds;
  }
}

interface IXChain is IXChainBase {}

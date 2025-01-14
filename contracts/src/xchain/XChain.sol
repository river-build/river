// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IXChain} from "./IXChains.sol";

// libraries

// contracts

contract XChain is IXChain {
  function postXChainResult(
    bytes32 transactionId,
    uint256 roleId,
    VoteStatus result
  ) external {
    // TODO: Implement
  }

  function requestEntitlementCheck(
    bytes32 txId,
    address sender,
    uint256 requestId
  ) external {
    // TODO: Implement
  }
}

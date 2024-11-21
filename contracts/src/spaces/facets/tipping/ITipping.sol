// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface ITippingBase {
  struct TipRequest {
    uint256 tokenId;
    address currency;
    uint256 amount;
    bytes32 messageId;
    bytes32 channelId;
  }

  event Tipped(
    uint256 indexed tokenId,
    address indexed currency,
    address sender,
    address receiver,
    uint256 amount,
    bytes32 messageId,
    bytes32 channelId
  );

  error TokenDoesNotExist();
  error SenderIsNotMember();
  error SenderIsOwner();
  error AmountIsZero();
}

interface ITipping is ITippingBase {
  function tip(TipRequest calldata tipRequest) external payable;
}

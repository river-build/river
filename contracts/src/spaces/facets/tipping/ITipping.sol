// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface ITippingBase {
  // =============================================================
  //                           Structs
  // =============================================================

  struct TipRequest {
    uint256 tokenId;
    address currency;
    uint256 amount;
    bytes32 messageId;
    bytes32 channelId;
  }

  // =============================================================
  //                           Events
  // =============================================================

  event Tip(
    uint256 indexed tokenId,
    address indexed currency,
    address sender,
    address receiver,
    uint256 amount
  );

  event TipMessage(bytes32 indexed messageId, bytes32 indexed channelId);

  // =============================================================
  //                           Errors
  // =============================================================

  error TokenDoesNotExist();
  error SenderIsNotMember();
  error ReceiverIsNotMember();
  error CannotTipSelf();
  error AmountIsZero();
  error CurrencyIsZero();
}

interface ITipping is ITippingBase {
  function tip(TipRequest calldata tipRequest) external payable;
}

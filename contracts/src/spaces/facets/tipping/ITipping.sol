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
  /// @notice Sends a tip to a space member
  /// @param tipRequest The tip request containing token ID, currency, amount, message ID and channel ID
  /// @dev Requires sender and receiver to be members of the space
  /// @dev Requires amount > 0 and valid currency address
  /// @dev Emits Tip and TipMessage events
  function tip(TipRequest calldata tipRequest) external payable;

  /// @notice Gets the total tips received for a token ID in a specific currency
  /// @param tokenId The token ID to get tips for
  /// @param currency The currency address to get tips in
  /// @return The total amount of tips received in the specified currency
  function tipsByCurrencyAndTokenId(
    uint256 tokenId,
    address currency
  ) external view returns (uint256);

  /// @notice Gets the list of currencies that have been tipped to the space
  /// @return An array of currency addresses
  function tippingCurrencies() external view returns (address[] memory);

  /// @notice Gets the total amount of tips received for a currency
  /// @param currency The currency address to get tips for
  /// @return The total amount of tips received in the specified currency
  function getTotalTipAmountByCurrency(
    address currency
  ) external view returns (uint256);

  /// @notice Gets the total count of tips received for a currency
  /// @param currency The currency address to get tips for
  /// @return The total count of tips received in the specified currency
  function getTotalTipCountByCurrency(
    address currency
  ) external view returns (uint256);

  /// @notice Gets the total amount of tips received for a user
  /// @param user The user address to get tips for
  /// @param currency The currency address to get tips for
  /// @return The total amount of tips received in the specified currency
  function getTipsReceivedByCurrency(
    address user,
    address currency
  ) external view returns (uint256);

  /// @notice Gets the total amount of tips sent for a user
  /// @param user The user address to get tips for
  /// @param currency The currency address to get tips for
  /// @return The total amount of tips sent in the specified currency
  function getTipsSentByCurrency(
    address user,
    address currency
  ) external view returns (uint256);

  /// @notice Gets the total count of tips received for a user
  /// @param user The user address to get tips for
  /// @param currency The currency address to get tips for
  /// @return The total count of tips received in the specified currency
  function getTipsReceivedCountByCurrency(
    address user,
    address currency
  ) external view returns (uint256);

  /// @notice Gets the total count of tips sent for a user
  /// @param user The user address to get tips for
  /// @param currency The currency address to get tips for
  /// @return The total count of tips sent in the specified currency
  function getTipsSentCountByCurrency(
    address user,
    address currency
  ) external view returns (uint256);
}

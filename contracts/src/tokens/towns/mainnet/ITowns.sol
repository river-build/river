// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface ITownsBase {
  // =============================================================
  //                           Structs
  // =============================================================
  struct InflationConfig {
    uint256 initialInflationRate;
    uint256 finalInflationRate;
    uint256 inflationDecreaseRate;
    uint256 inflationDecreaseInterval;
  }

  // =============================================================
  //                           Errors
  // =============================================================
  error InvalidInflationRate();
  error CannotMint();
  error CannotMintZero();
  error TransferLockEnabled();
  error InvalidDelegatee();
  error MintingTooSoon();
  error InvalidAddress();
  error DelegateeSameAsCurrent();

  // =============================================================
  //                           Events
  // =============================================================
  event InflationCreated(uint256 amount);
  event OverrideInflationSet(
    bool overrideInflation,
    uint256 overrideInflationRate
  );
  event TokenRecipientSet(address tokenRecipient);
}

interface ITowns is ITownsBase {
  // =============================================================
  //                           Functions
  // =============================================================

  /// @notice create inflation
  function createInflation() external;

  /// @notice override inflation
  /// @param overrideInflation bool to override inflation
  /// @param overrideInflationRate uint256 to override inflation rate
  function setOverrideInflation(
    bool overrideInflation,
    uint256 overrideInflationRate
  ) external;
}

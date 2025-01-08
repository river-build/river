// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface ITownsBase {
  struct InflationConfig {
    uint256 lastMintTime;
    uint256 initialInflationRate;
    uint256 finalInflationRate;
    uint256 inflationDecayRate;
    uint256 inflationDecayInterval;
    address inflationReceiver;
  }

  error InvalidAddress();
  error InvalidInflationRate();
}

interface ITowns is ITownsBase {
  /// @notice Returns the current receiver of inflation rewards
  /// @return The address of the inflation receiver
  function inflationReceiver() external view returns (address);

  /// @notice Returns the current inflation rate in basis points (0-100)
  /// @return The current inflation rate
  function currentInflationRate() external view returns (uint256);

  /// @notice Allows the inflation rate manager to override the normal inflation rate
  /// @param overrideInflation Whether to override the normal inflation rate
  /// @param overrideInflationRate The inflation rate to use when overriding, in basis points
  /// @dev Can only be called by accounts with ROLE_INFLATION_RATE_MANAGER
  /// @dev overrideInflationRate must be less than or equal to finalInflationRate
  function setOverrideInflation(
    bool overrideInflation,
    uint256 overrideInflationRate
  ) external;

  /// @notice Sets the receiver address for inflation rewards
  /// @param receiver The new inflation receiver address
  /// @dev Can only be called by accounts with ROLE_INFLATION_MANAGER
  /// @dev receiver cannot be the zero address
  function setInflationReceiver(address receiver) external;

  /// @notice Creates new tokens according to the current inflation rate
  /// @dev Can only be called by accounts with ROLE_INFLATION_MANAGER
  /// @dev Mints tokens to the inflation receiver based on current total supply and inflation rate
  /// @dev Updates lastMintTime to current block timestamp after minting
  function createInflation() external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface ITokenMigrationBase {
  // Errors
  error TokenMigration__InvalidBalance();
  error TokenMigration__InvalidAllowance();
  // Events
  event TokensMigrated(address indexed account, uint256 amount);
}

interface ITokenMigration is ITokenMigrationBase {
  function migrate(address account) external;
  function withdrawTokens() external;
  function pauseMigration() external;
  function resumeMigration() external;
}

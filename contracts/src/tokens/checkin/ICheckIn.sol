// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

interface ICheckInBase {
  /// @notice Error thrown when a user attempts to check in too soon after their last check-in
  error CheckInPeriodNotPassed();

  // Events
  event CheckedIn(
    address indexed user,
    uint256 points,
    uint256 streak,
    uint256 lastCheckIn
  );
}

interface ICheckIn is ICheckInBase {
  /// @notice Allows a user to check in and earn points based on their streak
  /// @dev Users must wait at least 24 hours between check-ins
  /// @dev If a user checks in within 48 hours of their last check-in, their streak continues
  /// @dev Otherwise, their streak resets to 1
  function checkIn() external;

  /// @notice Gets the current check-in streak for a user
  /// @param user The address of the user to query
  /// @return The current streak count for the user
  function getStreak(address user) external view returns (uint256);

  /// @notice Gets the timestamp of the user's last check-in
  /// @param user The address of the user to query
  /// @return The timestamp of the user's last check-in, 0 if never checked in
  function getLastCheckIn(address user) external view returns (uint256);
}

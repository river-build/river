// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {ICheckInBase} from "contracts/src/tokens/checkin/ICheckIn.sol";

// libraries
import {CustomRevert} from "contracts/src/utils/libraries/CustomRevert.sol";
import {RiverPointsStorage} from "contracts/src/tokens/points/RiverPointsStorage.sol";

// contracts

library CheckIn {
  // keccak256(abi.encode(uint256(keccak256("river.tokens.checkin.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0x62755009e737dbac2f30b2876987ec999edfaa30486a87d0930a58dbf1ec6800;

  uint256 internal constant MAX_STREAK_PER_CHECKIN = 30; // Maximum points per check-in
  uint256 internal constant MAX_POINTS_PER_CHECKIN = 30 ether; // Maximum points per check-in
  uint256 internal constant CHECK_IN_FORGIVENESS_PERIOD = 2 days; // Time window to continue streak
  uint256 internal constant CHECK_IN_WAIT_PERIOD = 1 days; // Time between check-ins

  struct CheckInData {
    uint256 streak;
    uint256 lastCheckIn;
  }

  struct Layout {
    mapping(address => CheckInData) checkInsByAddress;
  }

  function layout() internal pure returns (Layout storage l) {
    assembly {
      l.slot := STORAGE_SLOT
    }
  }

  /// @notice Allows a user to check in and earn points based on their streak
  /// @dev Users must wait at least 24 hours between check-ins
  /// @dev If a user checks in within 48 hours of their last check-in, their streak continues
  /// @dev Otherwise, their streak resets to 1
  function checkIn(address user) internal {
    uint256 currentTime = block.timestamp;
    RiverPointsStorage.Layout storage points = RiverPointsStorage.layout();
    CheckInData storage userCheckIn = layout().checkInsByAddress[user];
    uint256 lastCheckIn = userCheckIn.lastCheckIn;
    uint256 currentStreak = userCheckIn.streak;

    // First time checking in
    if (lastCheckIn == 0) {
      (userCheckIn.streak, userCheckIn.lastCheckIn) = (1, currentTime);
      points.inner.mint(user, 1 ether);
      emit ICheckInBase.CheckedIn(user, 1 ether, 1, currentTime);
      return;
    }

    // Must wait at least 24 hours between check-ins
    if (currentTime <= lastCheckIn + CHECK_IN_WAIT_PERIOD) {
      CustomRevert.revertWith(ICheckInBase.CheckInPeriodNotPassed.selector);
    }

    // Update streak based on timing
    bool isWithinForgiveness = currentTime <=
      lastCheckIn + CHECK_IN_FORGIVENESS_PERIOD;
    uint256 newStreak = isWithinForgiveness ? currentStreak + 1 : 1;

    // Calculate points based on new streak
    uint256 pointsToAward = newStreak > MAX_STREAK_PER_CHECKIN
      ? MAX_POINTS_PER_CHECKIN
      : newStreak * 1 ether;

    // Update storage (combined writes)
    (userCheckIn.streak, userCheckIn.lastCheckIn) = (newStreak, currentTime);
    points.inner.mint(user, pointsToAward);

    emit ICheckInBase.CheckedIn(user, pointsToAward, newStreak, currentTime);
  }

  function getStreak(address user) internal view returns (uint256) {
    return layout().checkInsByAddress[user].streak;
  }

  function getLastCheckIn(address user) internal view returns (uint256) {
    return layout().checkInsByAddress[user].lastCheckIn;
  }
}

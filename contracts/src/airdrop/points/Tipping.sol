// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces

// libraries

// contracts

library Tipping {
  /// @custom:storage-slot keccak256(abi.encode(uint256(keccak256("airdrop.points.tipping.storage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 internal constant STORAGE_SLOT =
    0xf1a9b0402bdf38a3eb4b423977f9b19e7a774c373e7634f59c45e48930395500;

  struct Points {
    uint256 dailyPoints; // points earned today
    uint256 lastResetDay; // the day when dailyPoints was last reset
  }

  struct Layout {
    mapping(address user => Points) tippingPoints;
  }

  function layout() internal pure returns (Layout storage l) {
    assembly {
      l.slot := STORAGE_SLOT
    }
  }

  function getPoints(
    uint256 tipAmount,
    uint256 dailyPoints,
    uint256 currentDay,
    uint256 lastResetDay
  ) internal pure returns (uint256 points) {
    if (currentDay > lastResetDay) {
      // New day, would reset to 0
      points = calculateTipPoints(tipAmount);
      // Points are capped at 10 per day per town
      if (points > 10) {
        points = 10;
      }
    } else {
      // Same day, check remaining points capacity
      if (dailyPoints >= 10) {
        points = 0; // Already reached daily limit
      } else {
        points = calculateTipPoints(tipAmount);
        // Ensure we don't exceed daily limit
        if (points + dailyPoints > 10) {
          points = 10 - dailyPoints;
        }
      }
    }
  }

  function calculateTipPoints(
    uint256 tipAmount
  ) internal pure returns (uint256) {
    // 1 point per 0.0003 ETH
    return (tipAmount * 1) / (0.0003 ether);
  }

  // Add a function to update points after tip
  function updatePointsAfterTip(address user, uint256 pointsToAdd) internal {
    Points storage userPoints = layout().tippingPoints[user];

    uint256 currentDay;

    unchecked {
      currentDay = block.timestamp;
    }

    // Reset daily points if it's a new day
    if (currentDay > userPoints.lastResetDay) {
      userPoints.dailyPoints = pointsToAdd;
      userPoints.lastResetDay = currentDay;
    } else {
      userPoints.dailyPoints += pointsToAdd;
    }
  }
}

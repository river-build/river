// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// interfaces

// libraries

// contracts

import {IReentrancyGuard} from "./IReentrancyGuard.sol";
import {ReentrancyGuardStorage} from "./ReentrancyGuardStorage.sol";

/**
 * @title Utility contract for preventing reentrancy attacks
 */
abstract contract ReentrancyGuard is IReentrancyGuard {
  uint256 internal constant REENTRANCY_STATUS_LOCKED = 2;
  uint256 internal constant REENTRANCY_STATUS_UNLOCKED = 1;

  modifier nonReentrant() {
    if (ReentrancyGuardStorage.layout().status == REENTRANCY_STATUS_LOCKED)
      revert ReentrancyGuard__ReentrantCall();
    _lockReentrancyGuard();
    _;
    _unlockReentrancyGuard();
  }

  /**
   * @notice lock functions that use the nonReentrant modifier
   */
  function _lockReentrancyGuard() internal virtual {
    ReentrancyGuardStorage.layout().status = REENTRANCY_STATUS_LOCKED;
  }

  /**
   * @notice unlock funtions that use the nonReentrant modifier
   */
  function _unlockReentrancyGuard() internal virtual {
    ReentrancyGuardStorage.layout().status = REENTRANCY_STATUS_UNLOCKED;
  }
}

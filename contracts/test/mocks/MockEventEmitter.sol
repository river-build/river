// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// Simple interface for emitting an event, used for chain monitor stress testing.
interface IEventEmitter {
  event TestEvent(uint256 indexed value);

  function emitEvent(uint256 value) external;
}

contract MockEventEmitter is IEventEmitter {
  function emitEvent(uint256 value) public {
    emit TestEvent(value);
  }
}

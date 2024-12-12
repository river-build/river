// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @dev A mock script that can be configured for testing.
contract MockScript {
  event ScriptExecutedWithValue(uint256 value);

  function executeScript() external view returns (address) {
    return msg.sender;
  }

  function executeScriptWithValue() external payable {
    emit ScriptExecutedWithValue(msg.value);
  }
}

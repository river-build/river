// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LlamaSingleUseScript} from "@llama/src/llama-scripts/LlamaSingleUseScript.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";

/// @dev This is a mock contract that inherits from the single use script for testing purposes
contract MockSingleUseScript is LlamaSingleUseScript {
  event SuccessfulCall();

  constructor(LlamaExecutor executor) LlamaSingleUseScript(executor) {}

  function run() external unauthorizeAfterRun onlyDelegateCall {
    emit SuccessfulCall();
  }
}

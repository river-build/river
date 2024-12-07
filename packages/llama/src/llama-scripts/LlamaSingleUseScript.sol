// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LlamaBaseScript} from "@llama/src/llama-scripts/LlamaBaseScript.sol";
import {LlamaCore} from "@llama/src/LlamaCore.sol";
import {LlamaExecutor} from "@llama/src/LlamaExecutor.sol";

/// @dev This script is a template for creating new scripts, and should not be used directly.
/// @dev This script is meant to be delegatecalled by the executor contract, with the script leveraging the
/// `unauthorizeAfterRun` modifier to ensure it can only be used once.
abstract contract LlamaSingleUseScript is LlamaBaseScript {
  /// @dev Add this to your script's methods to unauthorize itself after it has been run once. Any subsequent calls will
  /// fail unless the script is reauthorized. Best if used in tandem with the `onlyDelegateCall` from `BaseScript.sol`.
  modifier unauthorizeAfterRun() {
    _;
    LlamaCore core = LlamaCore(EXECUTOR.LLAMA_CORE());
    core.setScriptAuthorization(SELF, false);
  }

  /// @dev Address of the executor contract. We save it off in order to access the setScriptAuthorization method in
  /// `LlamaCore`.
  LlamaExecutor internal immutable EXECUTOR;

  constructor(LlamaExecutor executor) {
    EXECUTOR = executor;
  }
}
